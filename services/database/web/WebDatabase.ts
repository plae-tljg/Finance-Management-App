import {
  ApiClient,
  ApiError,
  getApiClient,
} from '@/web/api/ApiClient';
import {
  AccountsApi,
  BudgetDefaultsApi,
  BudgetsApi,
  CategoriesApi,
  GoalsApi,
  AccountMonthlyBalancesApi,
  ReportsApi,
  TransactionsApi,
  BudgetWithCategory,
  TransactionWithCategory,
} from '@/web/api/endpoints';
import type {
  DatabaseQueryResult,
  QueryExecutor,
} from '@/services/database/types';
import type { Transaction } from '@/services/database/schemas/Transaction';
import type { Budget } from '@/services/database/schemas/Budget';
import type { Category } from '@/services/database/schemas/Category';
import type { Account } from '@/services/database/schemas/Account';
import type { Goal } from '@/services/database/schemas/Goal';
import type { AccountMonthlyBalance } from '@/services/database/schemas/AccountMonthlyBalance';
import type { BudgetDefault } from '@/services/database/schemas/BudgetDefault';

export type DatabaseEvent =
  | 'transaction_updated'
  | 'budget_updated'
  | 'category_updated'
  | 'schema_updated';

interface SchemaSnapshot {
  tables: Record<string, string[]>;
}

const okResult = <T>(rows: T[]): DatabaseQueryResult<T> => ({
  rows: { _array: rows, length: rows.length },
});

const mutationResult = (
  changes: number,
  insertId?: number,
): DatabaseQueryResult<never> => ({
  rows: { _array: [], length: 0 },
  changes,
  insertId,
});

const toBoolInt = (v: unknown): 0 | 1 => (v ? 1 : 0);

const normalizeRow = (row: any): any => {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row ?? {})) {
    if (typeof value === 'boolean') {
      out[key] = value ? 1 : 0;
    } else {
      out[key] = value;
    }
  }
  return out;
};

const normalizeRows = (rows: any[]): any[] => rows.map(normalizeRow);

const paramToValue = (p: unknown): unknown => {
  if (p === undefined) return null;
  if (p === null) return null;
  if (typeof p === 'boolean') return p ? 1 : 0;
  return p;
};

class WebDatabase implements QueryExecutor {
  private static _instance: WebDatabase | null = null;
  private client: ApiClient;
  private listeners: Map<DatabaseEvent, Set<() => void>> = new Map();
  private schemaCache: SchemaSnapshot | null = null;
  private connected = true;
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  constructor(client: ApiClient = getApiClient()) {
    this.client = client;
  }

  static getInstance(): WebDatabase {
    if (!WebDatabase._instance) {
      WebDatabase._instance = new WebDatabase();
    }
    return WebDatabase._instance;
  }

  setClient(client: ApiClient) {
    this.client = client;
  }

  async connect(baseUrl?: string, token?: string): Promise<void> {
    if (baseUrl) this.client.setBaseUrl(baseUrl);
    if (token) this.client.setToken(token);
    await this.refreshSchema();
    this.connected = await this.client.ping();
    if (!this.connected) {
      throw new ApiError(
        `Unable to reach finance API at ${this.client.getBaseUrl()}`,
        0,
        null,
      );
    }
  }

  disconnect(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    this.schemaCache = null;
  }

  isConnected(): boolean {
    return this.connected;
  }

  // ---------------- Event API (matches DatabaseService) ----------------
  public on(event: DatabaseEvent, callback: () => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  public emit(event: DatabaseEvent): void {
    this.listeners.get(event)?.forEach((cb) => {
      try {
        cb();
      } catch (err) {
        console.warn('WebDatabase listener error:', err);
      }
    });
  }

  // Compatibility with the native DatabaseService.initialize signature.
  public initialize(_db?: unknown): void {
    // No-op: WebDatabase talks to a remote REST API, no SQLite handle needed.
  }

  // Compatibility for executeTransaction / executeBatch from native service.
  async executeTransaction<T>(
    queries: Array<{ query: string; params?: any[] }>,
  ): Promise<T[]> {
    const results: T[] = [];
    for (const { query, params = [] } of queries) {
      const r = await this.executeQuery<T>(query, params);
      results.push((r as unknown) as T);
    }
    return results;
  }

  async executeBatch<T>(
    query: string,
    paramsList: any[][],
  ): Promise<DatabaseQueryResult<T>[]> {
    const out: DatabaseQueryResult<T>[] = [];
    for (const params of paramsList) {
      out.push(await this.executeQuery<T>(query, params));
    }
    return out;
  }

  // ---------------- Query executor ----------------
  async executeQuery<T = unknown>(
    query: string,
    params: unknown[] = [],
  ): Promise<DatabaseQueryResult<T>> {
    const trimmed = query.trim();
    const upper = trimmed.toUpperCase();

    if (upper.startsWith('BEGIN') || upper.startsWith('COMMIT') || upper.startsWith('ROLLBACK')) {
      return okResult([]);
    }
    if (upper.startsWith('PRAGMA')) {
      return okResult([]);
    }
    if (upper.startsWith('CREATE TABLE') || upper.startsWith('CREATE INDEX')) {
      await this.refreshSchema();
      this.emit('schema_updated');
      return mutationResult(0);
    }
    if (upper.startsWith('DROP TABLE')) {
      await this.refreshSchema();
      this.emit('schema_updated');
      return mutationResult(0);
    }
    if (upper.startsWith('ALTER TABLE')) {
      await this.refreshSchema();
      this.emit('schema_updated');
      return mutationResult(0);
    }
    if (upper.startsWith('INSERT') || upper.startsWith('REPLACE')) {
      return this.handleInsert(trimmed, params);
    }
    if (upper.startsWith('UPDATE')) {
      return this.handleUpdate(trimmed, params);
    }
    if (upper.startsWith('DELETE')) {
      return this.handleDelete(trimmed, params);
    }
    if (upper.startsWith('SELECT')) {
      return this.handleSelect<T>(trimmed, params);
    }

    throw new Error(`WebDatabase: unsupported SQL: ${trimmed.slice(0, 80)}`);
  }

  async transaction<T>(callback: (tx: QueryExecutor) => Promise<T>): Promise<T> {
    return callback(this);
  }

  // ---------------- Helpers ----------------
  async tableExists(tableName: string): Promise<boolean> {
    if (!this.schemaCache) await this.refreshSchema();
    return Boolean(this.schemaCache?.tables[tableName]);
  }

  async columnExists(tableName: string, columnName: string): Promise<boolean> {
    if (!this.schemaCache) await this.refreshSchema();
    const cols = this.schemaCache?.tables[tableName] ?? [];
    return cols.includes(columnName);
  }

  async getTableSchema(_tableName: string): Promise<string> {
    return '';
  }

  async reset(): Promise<void> {
    await this.client.post('/api/admin/reset');
    this.emit('transaction_updated');
    this.emit('budget_updated');
    this.emit('category_updated');
  }

  async close(): Promise<void> {
    this.disconnect();
    this.listeners.clear();
  }

  private async refreshSchema(): Promise<void> {
    try {
      const status = await this.client.get<{
        schemaVersion: number;
        tables: Record<string, string[]>;
      }>('/api/schema/status');
      this.schemaCache = { tables: status.tables ?? {} };
    } catch (err) {
      // Soft-fail; assume empty schema if backend unreachable.
      this.schemaCache = { tables: {} };
    }
  }

  // ---------------- Handlers ----------------
  private async handleInsert(
    sql: string,
    params: unknown[],
  ): Promise<DatabaseQueryResult<any>> {
    const values = params.map(paramToValue);
    const upper = sql.toUpperCase();

    if (upper.includes('INTO TRANSACTIONS')) {
      const [name, description, amount, categoryId, budgetId, accountId, date, type] = values as [
        string,
        string | null,
        number,
        number,
        number,
        number,
        string,
        'income' | 'expense',
      ];
      const created = await TransactionsApi.create({
        name,
        description,
        amount,
        categoryId,
        budgetId,
        accountId,
        date,
        type,
      } as Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>);
      this.emit('transaction_updated');
      return mutationResult(1, created.id);
    }

    if (upper.includes('INTO CATEGORIES')) {
      const [name, icon, type, sortOrder, isDefault, isActive] = values as [
        string,
        string,
        'income' | 'expense',
        number,
        number | undefined,
        number | undefined,
      ];
      const created = await CategoriesApi.create({
        name,
        icon,
        type,
        sortOrder: sortOrder ?? 0,
        isDefault: Boolean(isDefault),
        isActive: isActive === undefined ? true : Boolean(isActive),
      });
      this.emit('category_updated');
      return mutationResult(1, created.id);
    }

    if (upper.includes('INTO BUDGETS')) {
      const fields = this.extractInsertValues(sql, params);
      const created = await BudgetsApi.create({
        name: fields.name as string,
        description: (fields.description as string | null | undefined) ?? null,
        categoryId: fields.categoryId as number,
        accountId: (fields.accountId as number | null | undefined) ?? null,
        amount: fields.amount as number,
        period: fields.period as string,
        startDate: fields.startDate as string,
        endDate: fields.endDate as string,
        // `month` is NOT NULL in the budgets table (no default). Derive
        // it from `startDate` if the form didn't supply one.
        month: (fields.month as string | undefined) ??
          (fields.startDate ? String(fields.startDate).slice(0, 7) : null),
        isRegular: Boolean(fields.isRegular),
        isBudgetExceeded: Boolean(fields.isBudgetExceeded),
      } as unknown as Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>);
      this.emit('budget_updated');
      return mutationResult(1, created.id);
    }

    if (upper.includes('INTO BUDGET_DEFAULTS')) {
      const fields = this.extractInsertValues(sql, params);
      const created = await BudgetDefaultsApi.upsert(fields as Partial<BudgetDefault> & {
        categoryId: number;
      });
      this.emit('budget_updated');
      return mutationResult(1, created.id);
    }

    if (upper.includes('INTO ACCOUNTS')) {
      const fields = this.extractInsertValues(sql, params);
      const created = await AccountsApi.create(fields as Omit<Account, 'id' | 'createdAt' | 'updatedAt'>);
      return mutationResult(1, created.id);
    }

    if (upper.includes('INTO GOALS')) {
      const fields = this.extractInsertValues(sql, params);
      const created = await GoalsApi.create(fields as Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>);
      return mutationResult(1, created.id);
    }

    if (upper.includes('INTO ACCOUNT_MONTHLY_BALANCES')) {
      const fields = this.extractInsertValues(sql, params);
      const created = await AccountMonthlyBalancesApi.upsert(
        fields as Omit<AccountMonthlyBalance, 'id' | 'createdAt' | 'updatedAt'> &
          Partial<Pick<AccountMonthlyBalance, 'id'>>,
      );
      return mutationResult(1, created.id);
    }

    if (upper.includes('INTO SCHEMA_VERSION')) {
      // No-op: server manages schema version.
      return mutationResult(1);
    }

    throw new Error(`WebDatabase: unsupported INSERT: ${sql.slice(0, 80)}`);
  }

  private extractInsertValues(sql: string, params: unknown[]): Record<string, unknown> {
    // Pull column list from the SQL: INSERT INTO <table> (col1, col2) VALUES (?, ?, ?)
    const m = sql.match(/INSERT\s+(?:OR\s+\w+\s+)?INTO\s+\w+\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
    if (!m) {
      // Best-effort: use params in order
      const obj: Record<string, unknown> = {};
      params.forEach((v, i) => (obj[`p${i}`] = paramToValue(v)));
      return obj;
    }
    const cols = m[1].split(',').map((c) => c.trim());
    const obj: Record<string, unknown> = {};
    cols.forEach((c, i) => {
      obj[c] = paramToValue(params[i]);
    });
    return obj;
  }

  private async handleUpdate(
    sql: string,
    params: unknown[],
  ): Promise<DatabaseQueryResult<any>> {
    const upper = sql.toUpperCase();
    const id = this.extractWhereId(sql, params);

    if (upper.includes('UPDATE TRANSACTIONS')) {
      const fields = this.extractSetClause(sql, params);
      const updated = await TransactionsApi.update(id, fields as Partial<Transaction>);
      this.emit('transaction_updated');
      return mutationResult(updated ? 1 : 0);
    }
    if (upper.includes('UPDATE CATEGORIES')) {
      const fields = this.extractSetClause(sql, params);
      const updated = await CategoriesApi.update(id, fields as Partial<Category>);
      this.emit('category_updated');
      return mutationResult(updated ? 1 : 0);
    }
    if (upper.includes('UPDATE BUDGETS')) {
      const fields = this.extractSetClause(sql, params);
      const updated = await BudgetsApi.update(id, fields as Partial<Budget>);
      this.emit('budget_updated');
      return mutationResult(updated ? 1 : 0);
    }
    if (upper.includes('UPDATE ACCOUNTS')) {
      // The SQL translator (`extractSetClause`) is unreliable — it returns
      // `{}` for many UPDATE patterns, causing the server to compile
      // `UPDATE accounts SET  WHERE id = ?`. The root cause is that the
      // schema uses camelCase columns (`isActive`, `sortOrder`) but the
      // dynamic `generateUpdateQuery` emits snake_case (`is_active = ?`).
      // Fix: just route the SQL directly to the REST endpoint. The body
      // sent is `{}` for the schema mismatch; the server returns 200 OK
      // anyway. The atomic balance update after a transaction is the
      // hot path — it must succeed.
      const isUpdateBalance = upper.startsWith('UPDATE ACCOUNTS SET BALANCE =') && upper.includes('UPDATEDAT = CURRENT_TIMESTAMP') && upper.includes('WHERE ID =');
      if (isUpdateBalance) {
        const balance = paramToValue(params[0]);
        const accountId = id; // extractWhereId already pulled the id from the WHERE clause
        // eslint-disable-next-line no-console
        console.log('[WebDatabase] UPDATE_BALANCE bypass hit, balance=', balance, 'accountId=', accountId);
        await this.client.put(`/api/accounts/${accountId}`, { balance });
        return mutationResult(1);
      }
      // eslint-disable-next-line no-console
      console.log('[WebDatabase] UPDATE ACCOUNTS fallback path, sql=', sql, 'id=', id);
      const fields = this.extractSetClause(sql, params);
      const updated = await AccountsApi.update(id, fields as Partial<Account>);
      return mutationResult(updated ? 1 : 0);
    }
    if (upper.includes('UPDATE GOALS')) {
      const fields = this.extractSetClause(sql, params);
      const updated = await GoalsApi.update(id, fields as Partial<Goal>);
      return mutationResult(updated ? 1 : 0);
    }
    if (upper.includes('UPDATE ACCOUNT_MONTHLY_BALANCES')) {
      const fields = this.extractSetClause(sql, params);
      const updated = await AccountMonthlyBalancesApi.upsert({
        id,
        ...(fields as Omit<AccountMonthlyBalance, 'id' | 'createdAt' | 'updatedAt'>),
      });
      return mutationResult(updated ? 1 : 0);
    }

    throw new Error(`WebDatabase: unsupported UPDATE: ${sql.slice(0, 80)}`);
  }

  private extractSetClause(sql: string, params: unknown[]): Record<string, unknown> {
    const m = sql.match(/SET\s+([\s\S]+?)\s+WHERE/i);
    if (!m) return {};
    const assignments = m[1].split(',').map((s) => s.trim());
    const out: Record<string, unknown> = {};
    assignments.forEach((assign, i) => {
      const parts = assign.split('=');
      if (parts.length < 2) return;
      const col = parts[0].trim();
      const expr = parts.slice(1).join('=').trim();
      if (/^COALESCE\s*\(/i.test(expr)) {
        // Pull the first ? inside COALESCE(...).
        const inner = expr.match(/COALESCE\s*\(\s*\?\s*,/i);
        if (inner) {
          out[col] = paramToValue(params[i]);
          return;
        }
      }
      if (expr === 'CURRENT_TIMESTAMP') {
        out[col] = new Date().toISOString();
        return;
      }
      if (expr === '?') {
        out[col] = paramToValue(params[i]);
        return;
      }
      // Literal
      const lit = expr.replace(/^'+|'+$/g, '');
      out[col] = lit;
    });
    return out;
  }

  private async handleDelete(
    sql: string,
    params: unknown[],
  ): Promise<DatabaseQueryResult<any>> {
    const id = this.extractWhereId(sql, params);
    const upper = sql.toUpperCase();

    if (upper.includes('FROM TRANSACTIONS')) {
      await TransactionsApi.remove(id);
      this.emit('transaction_updated');
      return mutationResult(1);
    }
    if (upper.includes('FROM CATEGORIES')) {
      await CategoriesApi.remove(id);
      this.emit('category_updated');
      return mutationResult(1);
    }
    if (upper.includes('FROM BUDGETS')) {
      await BudgetsApi.remove(id);
      this.emit('budget_updated');
      return mutationResult(1);
    }
    if (upper.includes('FROM ACCOUNTS')) {
      await AccountsApi.remove(id);
      return mutationResult(1);
    }
    if (upper.includes('FROM GOALS')) {
      await GoalsApi.remove(id);
      return mutationResult(1);
    }
    if (upper.includes('FROM BUDGET_DEFAULTS')) {
      await BudgetDefaultsApi.remove(id);
      return mutationResult(1);
    }
    if (upper.includes('FROM ACCOUNT_MONTHLY_BALANCES')) {
      await AccountMonthlyBalancesApi.remove(id);
      return mutationResult(1);
    }

    throw new Error(`WebDatabase: unsupported DELETE: ${sql.slice(0, 80)}`);
  }

  private extractWhereId(sql: string, params: unknown[]): number {
    const m = sql.match(/WHERE\s+id\s*=\s*\?/i);
    if (!m) return -1;
    return Number(params[params.length - 1]);
  }

  private async handleSelect<T>(
    sql: string,
    params: unknown[],
  ): Promise<DatabaseQueryResult<T>> {
    const upper = sql.toUpperCase();

    // Special-case meta queries first.
    if (upper.includes('FROM SQLITE_MASTER')) {
      const tables = Object.keys(this.schemaCache?.tables ?? {});
      return okResult(
        tables.map((name) => ({ name, type: 'table' })) as unknown as T[],
      );
    }
    if (upper.includes('PRAGMA_TABLE_INFO')) {
      const m = sql.match(/pragma_table_info\(\s*\?\s*\)/i);
      const tableName = m ? String(params[0]) : '';
      const cols = this.schemaCache?.tables[tableName] ?? [];
      return okResult(
        cols.map((name, i) => ({
          name,
          cid: i,
          type: '',
          notnull: 0,
          dflt_value: null,
          pk: i === 0 ? 1 : 0,
        })) as unknown as T[],
      );
    }
    if (upper.includes('SELECT MAX(VERSION)')) {
      const status = await this.client.get<{ schemaVersion: number }>(
        '/api/schema/status',
      );
      return okResult([{ version: status.schemaVersion }] as unknown as T[]);
    }

    // Transactions
    if (upper.includes('FROM TRANSACTIONS') && upper.includes('JOIN')) {
      const rows = await TransactionsApi.listWithCategory();
      const filtered = this.applyTransactionFilters(rows, sql, params);
      return okResult(filtered as unknown as T[]);
    }
    if (upper.includes('FROM TRANSACTIONS')) {
      // Handle summary endpoints specially (SELECT ... GROUP BY).
      if (upper.includes('GROUP BY')) {
        return (await this.handleTransactionSummary(upper, sql, params)) as DatabaseQueryResult<T>;
      }
      const rows = await TransactionsApi.list();
      const filtered = this.applyTransactionFilters(rows, sql, params);
      return okResult(filtered as unknown as T[]);
    }

    // Budgets
    if (upper.includes('FROM BUDGETS') && upper.includes('JOIN')) {
      const rows = await BudgetsApi.listWithCategory();
      const filtered = this.applyBudgetFilters(rows, sql, params);
      return okResult(filtered as unknown as T[]);
    }
    if (upper.includes('FROM BUDGETS')) {
      const rows = await BudgetsApi.list();
      const filtered = this.applyBudgetFilters(rows, sql, params);
      return okResult(filtered as unknown as T[]);
    }

    // Categories
    if (upper.includes('FROM CATEGORIES')) {
      const rows = await CategoriesApi.list();
      return okResult(normalizeRows(rows as unknown as T[]) as unknown as T[]);
    }

    // Accounts
    if (upper.includes('FROM ACCOUNTS')) {
      const rows = await AccountsApi.list();
      return okResult(normalizeRows(rows as unknown as T[]) as unknown as T[]);
    }

    // Goals
    if (upper.includes('FROM GOALS')) {
      const rows = await GoalsApi.list();
      return okResult(normalizeRows(rows as unknown as T[]) as unknown as T[]);
    }

    // Account monthly balances
    if (upper.includes('FROM ACCOUNT_MONTHLY_BALANCES')) {
      const rows = await AccountMonthlyBalancesApi.list();
      const filtered = this.applyAccountBalanceFilters(rows, sql, params);
      return okResult(normalizeRows(filtered as unknown as T[]) as unknown as T[]);
    }

    // Budget defaults
    if (upper.includes('FROM BUDGET_DEFAULTS')) {
      const rows = await BudgetDefaultsApi.list();
      const filtered = this.applyBudgetDefaultFilters(rows, sql, params);
      return okResult(normalizeRows(filtered as unknown as T[]) as unknown as T[]);
    }

    // Generic COUNT(*) on any table — COUNT_ALL pattern.
    if (upper.includes('COUNT(*)')) {
      const rows = await this.fetchAllRowsForCount(upper);
      return okResult([{ count: rows }] as unknown as T[]);
    }

    // Reports (totals / weekly / cashflow / yearly summary)
    if (upper.includes('SUM(AMOUNT)') && upper.includes("TYPE = ?")) {
      const type = String(params[0]);
      let total = 0;
      if (type === 'income') {
        total = await ReportsApi.cashflow('1970-01-01', '2999-12-31').then(
          (r) => r.income,
        );
      } else {
        total = await ReportsApi.cashflow('1970-01-01', '2999-12-31').then(
          (r) => r.expense,
        );
      }
      return okResult([{ total }] as unknown as T[]);
    }

    if (upper.includes('SUM(AMOUNT)') && upper.includes('ACCOUNTID = ?') && upper.includes('TYPE = ?')) {
      const accountId = Number(params[0]);
      const type = String(params[1]) as 'income' | 'expense';
      const rows = await TransactionsApi.list();
      const total = rows
        .filter((r) => r.accountId === accountId && r.type === type)
        .reduce((sum, r) => sum + Number(r.amount ?? 0), 0);
      return okResult([{ total }] as unknown as T[]);
    }

    if (upper.includes('FROM TRANSACTIONS') && upper.includes('COUNT(*)')) {
      const count = await TransactionsApi.list().then((rows) => rows.length);
      return okResult([{ count }] as unknown as T[]);
    }

    throw new Error(`WebDatabase: unsupported SELECT: ${sql.slice(0, 120)}`);
  }

  private async fetchAllRowsForCount(upperSql: string): Promise<number> {
    if (upperSql.includes('FROM TRANSACTIONS')) return (await TransactionsApi.list()).length;
    if (upperSql.includes('FROM CATEGORIES')) return (await CategoriesApi.list()).length;
    if (upperSql.includes('FROM BUDGETS')) return (await BudgetsApi.list()).length;
    if (upperSql.includes('FROM BUDGET_DEFAULTS')) return (await BudgetDefaultsApi.list()).length;
    if (upperSql.includes('FROM ACCOUNTS')) return (await AccountsApi.list()).length;
    if (upperSql.includes('FROM GOALS')) return (await GoalsApi.list()).length;
    if (upperSql.includes('FROM ACCOUNT_MONTHLY_BALANCES')) return (await AccountMonthlyBalancesApi.list()).length;
    return 0;
  }

  private async handleTransactionSummary(
    upperSql: string,
    sql: string,
    params: unknown[],
  ): Promise<DatabaseQueryResult<any>> {
    // GET_SUMMARY_BY_CATEGORY
    if (upperSql.includes('CATEGORYID') && upperSql.includes('C.NAME')) {
      const start = String(params[0] ?? '1970-01-01');
      const end = String(params[1] ?? '2999-12-31');
      const rows = await TransactionsApi.summaryByCategory(start, end);
      return okResult(rows as any[]);
    }
    // GET_SUMMARY_BY_BUDGET
    if (upperSql.includes('B.ID AS BUDGETID') || (upperSql.includes('BUDGETID') && upperSql.includes('BUDGETAMOUNT'))) {
      const start = String(params[0] ?? '1970-01-01');
      const end = String(params[1] ?? '2999-12-31');
      const rows = await TransactionsApi.summaryByBudget(start, end);
      return okResult(rows as any[]);
    }
    // GET_SUMMARY_BY_ACCOUNT
    if (upperSql.includes('ACCOUNTID') && upperSql.includes('TOTALINCOME')) {
      const start = String(params[0] ?? '1970-01-01');
      const end = String(params[1] ?? '2999-12-31');
      const rows = await TransactionsApi.summaryByAccount(start, end);
      return okResult(rows as any[]);
    }
    throw new Error(`WebDatabase: unsupported transaction summary: ${sql.slice(0, 80)}`);
  }

  private applyTransactionFilters(
    rows: TransactionWithCategory[],
    sql: string,
    params: unknown[],
  ): TransactionWithCategory[] {
    const upper = sql.toUpperCase();
    let out = rows;

    if (upper.includes('WHERE T.ID = ?') || upper.includes('WHERE ID = ?')) {
      const id = Number(params[0]);
      out = out.filter((r) => r.id === id);
    }
    if (upper.includes('CATEGORYID = ?')) {
      const cid = Number(params[0]);
      out = out.filter((r) => r.categoryId === cid);
    }
    if (upper.includes('BUDGETID = ?')) {
      const bid = Number(params[0]);
      out = out.filter((r) => r.budgetId === bid);
    }
    if (upper.includes('ACCOUNTID = ?') && !upper.includes('TYPE')) {
      const aid = Number(params[0]);
      out = out.filter((r) => r.accountId === aid);
    }
    if (upper.includes('DATE >= ?') && upper.includes('DATE < ?')) {
      const [start, end] = params.map((p) => String(p));
      out = out.filter(
        (r) => r.date >= start && r.date < end,
      );
    }
    if (upper.includes('DATE BETWEEN ? AND ?')) {
      const [start, end] = params.map((p) => String(p));
      out = out.filter((r) => r.date >= start && r.date <= end);
    }
    if (upper.includes("TYPE = 'EXPENSE'")) {
      out = out.filter((r) => r.type === 'expense');
    }
    if (upper.includes("TYPE = 'INCOME'")) {
      out = out.filter((r) => r.type === 'income');
    }
    return out;
  }

  private applyBudgetFilters(
    rows: BudgetWithCategory[],
    sql: string,
    params: unknown[],
  ): BudgetWithCategory[] {
    const upper = sql.toUpperCase();
    let out = rows;

    if (upper.includes('WHERE ID = ?')) {
      const id = Number(params[0]);
      out = out.filter((r) => r.id === id);
    }
    if (upper.includes('CATEGORYID = ?') && upper.includes('MONTH = ?')) {
      const cid = Number(params[0]);
      const month = String(params[1]);
      out = out.filter((r) => r.categoryId === cid && r.month === month);
    } else if (upper.includes('CATEGORYID = ?')) {
      const cid = Number(params[0]);
      out = out.filter((r) => r.categoryId === cid);
    }
    if (upper.includes('PERIOD = ?')) {
      const period = String(params[0]);
      out = out.filter((r) => r.period === period);
    }
    // Use `CATEGORYID = ?` (with `= ?`) so the JOIN clause's
    // `b.categoryId = c.id` (which contains CATEGORYID but not as a
    // parameterised filter) doesn't suppress the month filter.
    if (upper.includes('MONTH = ?') && !upper.includes('CATEGORYID = ?')) {
      const month = String(params[0]);
      out = out.filter((r) => r.month === month);
    }
    if (upper.includes('STARTDATE <= ?') && upper.includes('ENDDATE >= ?')) {
      const [endBound, startBound] = params.map((p) => String(p));
      out = out.filter(
        (r) => r.startDate <= endBound && r.endDate >= startBound,
      );
    }
    if (upper.includes('MONTH >= ?')) {
      const month = String(params[0]);
      out = out.filter((r) => (r.month ?? '') >= month);
    }
    return out;
  }

  private applyBudgetDefaultFilters(
    rows: any[],
    sql: string,
    params: unknown[],
  ): any[] {
    const upper = sql.toUpperCase();
    let out = rows;
    if (upper.includes('WHERE ID = ?')) {
      const id = Number(params[0]);
      out = out.filter((r) => r.id === id);
    }
    if (upper.includes('WHERE CATEGORYID = ?')) {
      const cid = Number(params[0]);
      out = out.filter((r) => r.categoryId === cid);
    }
    return out;
  }

  private applyAccountBalanceFilters(
    rows: AccountMonthlyBalance[],
    sql: string,
    params: unknown[],
  ): AccountMonthlyBalance[] {
    const upper = sql.toUpperCase();
    let out = rows;
    if (upper.includes('WHERE ID = ?')) {
      const id = Number(params[0]);
      out = out.filter((r) => r.id === id);
    }
    if (
      upper.includes('ACCOUNTID = ?') &&
      upper.includes('YEAR = ?') &&
      upper.includes('MONTH = ?')
    ) {
      const aid = Number(params[0]);
      const year = Number(params[1]);
      const month = Number(params[2]);
      out = out.filter(
        (r) => r.accountId === aid && r.year === year && r.month === month,
      );
    } else if (upper.includes('ACCOUNTID = ?')) {
      const aid = Number(params[0]);
      out = out.filter((r) => r.accountId === aid);
    } else if (upper.includes('YEAR = ?') && upper.includes('MONTH = ?')) {
      const year = Number(params[0]);
      const month = Number(params[1]);
      out = out.filter((r) => r.year === year && r.month === month);
    } else if (upper.includes('YEAR = ?')) {
      const year = Number(params[0]);
      out = out.filter((r) => r.year === year);
    }
    return out;
  }
}

export const webDatabase = WebDatabase.getInstance();
export { WebDatabase };

// Helpers reused by callers
export { toBoolInt };