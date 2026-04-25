import { AccountMonthlyBalance, AccountMonthlyBalanceQueries } from '../schemas/AccountMonthlyBalance';
import { BaseRepository } from './BaseRepository';
import { QueryExecutor } from '../types';

export class AccountMonthlyBalanceRepository implements BaseRepository<AccountMonthlyBalance> {
  constructor(private db: QueryExecutor) {}

  getDatabase(): QueryExecutor {
    return this.db;
  }

  async findById(id: number): Promise<AccountMonthlyBalance | null> {
    const result = await this.db.executeQuery<AccountMonthlyBalance>(
      AccountMonthlyBalanceQueries.FIND_BY_ID,
      [id]
    );
    return result.rows._array[0] || null;
  }

  async findAll(): Promise<AccountMonthlyBalance[]> {
    const result = await this.db.executeQuery<AccountMonthlyBalance>(
      AccountMonthlyBalanceQueries.FIND_ALL
    );
    return result.rows._array;
  }

  async create(balance: Omit<AccountMonthlyBalance, 'id' | 'createdAt' | 'updatedAt'>): Promise<AccountMonthlyBalance> {
    const result = await this.db.executeQuery<AccountMonthlyBalance>(
      AccountMonthlyBalanceQueries.INSERT,
      [balance.accountId, balance.year, balance.month, balance.openingBalance, balance.closingBalance]
    );
    return result.rows._array[0];
  }

  async update(id: number, balance: Partial<AccountMonthlyBalance>): Promise<boolean> {
    const result = await this.db.executeQuery<AccountMonthlyBalance>(
      AccountMonthlyBalanceQueries.UPDATE,
      [balance.openingBalance, balance.closingBalance, id]
    );
    return (result.changes ?? 0) > 0;
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db.executeQuery<AccountMonthlyBalance>(
      AccountMonthlyBalanceQueries.DELETE,
      [id]
    );
    return (result.changes ?? 0) > 0;
  }

  async count(): Promise<number> {
    const result = await this.db.executeQuery<{ count: number }>(
      AccountMonthlyBalanceQueries.COUNT_ALL
    );
    return result.rows._array[0]?.count ?? 0;
  }

  async findByAccountYearMonth(accountId: number, year: number, month: number): Promise<AccountMonthlyBalance | null> {
    const result = await this.db.executeQuery<AccountMonthlyBalance>(
      AccountMonthlyBalanceQueries.FIND_BY_ACCOUNT_YEAR_MONTH,
      [accountId, year, month]
    );
    return result.rows._array[0] || null;
  }

  async findByAccount(accountId: number): Promise<AccountMonthlyBalance[]> {
    const result = await this.db.executeQuery<AccountMonthlyBalance>(
      AccountMonthlyBalanceQueries.FIND_BY_ACCOUNT,
      [accountId]
    );
    return result.rows._array;
  }

  async findByYearMonth(year: number, month: number): Promise<AccountMonthlyBalance[]> {
    const result = await this.db.executeQuery<AccountMonthlyBalance>(
      AccountMonthlyBalanceQueries.FIND_BY_YEAR_MONTH,
      [year, month]
    );
    return result.rows._array;
  }

  async findByYear(year: number): Promise<AccountMonthlyBalance[]> {
    const result = await this.db.executeQuery<AccountMonthlyBalance>(
      AccountMonthlyBalanceQueries.FIND_BY_YEAR,
      [year]
    );
    return result.rows._array;
  }

  async upsert(accountId: number, year: number, month: number, opening: number, closing: number): Promise<void> {
    await this.db.executeQuery(
      AccountMonthlyBalanceQueries.INSERT,
      [accountId, year, month, opening, closing]
    );
  }
}