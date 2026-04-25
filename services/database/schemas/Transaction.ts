export interface Transaction {
  id: number;
  name: string;
  description: string | null;
  amount: number;
  categoryId: number;
  budgetId: number;
  accountId: number;
  date: string;
  type: 'income' | 'expense';
  createdAt: string;
  updatedAt: string;
}

// 可选：添加一些示例交易数据用于测试
export const SAMPLE_TRANSACTIONS: Omit<Transaction, 'id'>[] = [
  {
    name: '午餐',
    amount: 30,
    categoryId: 1,
    budgetId: 1,
    accountId: 1,
    description: '午餐',
    date: new Date().toISOString(),
    type: 'expense',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const TransactionFields = {
  UPDATABLE: ['name', 'description', 'amount', 'categoryId', 'budgetId', 'accountId', 'date', 'type'] as const,
  REQUIRED: ['name', 'amount', 'categoryId', 'budgetId', 'accountId', 'date', 'type'] as const,
  OPTIONAL: ['description'] as const
} as const;

export type UpdatableFields = typeof TransactionFields.UPDATABLE[number];
export type RequiredFields = typeof TransactionFields.REQUIRED[number];

export const TransactionQueries = {
  CREATE_TABLE: `
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      amount REAL NOT NULL,
      categoryId INTEGER NOT NULL,
      budgetId INTEGER NOT NULL,
      accountId INTEGER NOT NULL DEFAULT 1,
      date DATETIME NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (categoryId) REFERENCES categories(id),
      FOREIGN KEY (budgetId) REFERENCES budgets(id),
      FOREIGN KEY (accountId) REFERENCES accounts(id)
    )
  `,

  CREATE_INDEXES: `
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_categoryId ON transactions(categoryId);
    CREATE INDEX IF NOT EXISTS idx_transactions_budgetId ON transactions(budgetId);
    CREATE INDEX IF NOT EXISTS idx_transactions_accountId ON transactions(accountId);
    CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
  `,
  
  INSERT: `
    INSERT INTO transactions (
      name,
      description,
      amount,
      categoryId,
      budgetId,
      accountId,
      date,
      type
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `,
  
  UPDATE: `
    UPDATE transactions
    SET name = COALESCE(?, name),
        description = COALESCE(?, description),
        amount = COALESCE(?, amount),
        categoryId = COALESCE(?, categoryId),
        budgetId = COALESCE(?, budgetId),
        accountId = COALESCE(?, accountId),
        date = COALESCE(?, date),
        type = COALESCE(?, type),
        updatedAt = CURRENT_TIMESTAMP
    WHERE id = ?
  `,
  
  DELETE: 'DELETE FROM transactions WHERE id = ?',
  
  FIND_BY_ID: 'SELECT * FROM transactions WHERE id = ?',
  
  FIND_ALL: 'SELECT * FROM transactions ORDER BY date DESC',
  
  FIND_BY_CATEGORY_ID: 'SELECT * FROM transactions WHERE categoryId = ? ORDER BY date DESC',
  
  FIND_BY_BUDGET_ID: 'SELECT * FROM transactions WHERE budgetId = ? ORDER BY date DESC',
  
  FIND_BY_DATE_RANGE: 'SELECT * FROM transactions WHERE date BETWEEN ? AND ? ORDER BY date DESC',
  
  COUNT_ALL: 'SELECT COUNT(*) as count FROM transactions',

  FIND_ALL_WITH_CATEGORY: `
    SELECT t.*, c.name as categoryName, c.icon as categoryIcon, a.name as accountName, a.icon as accountIcon, a.color as accountColor
    FROM transactions t
    LEFT JOIN categories c ON t.categoryId = c.id
    LEFT JOIN accounts a ON t.accountId = a.id
    ORDER BY t.date DESC
  `,

  FIND_BY_ID_WITH_CATEGORY: `
    SELECT t.*, c.name as categoryName, c.icon as categoryIcon, a.name as accountName, a.icon as accountIcon, a.color as accountColor
    FROM transactions t
    LEFT JOIN categories c ON t.categoryId = c.id
    LEFT JOIN accounts a ON t.accountId = a.id
    WHERE t.id = ?
  `,

  FIND_BY_DATE_RANGE_WITH_CATEGORY: `
    SELECT t.*, c.name as categoryName, c.icon as categoryIcon, a.name as accountName, a.icon as accountIcon, a.color as accountColor
    FROM transactions t
    LEFT JOIN categories c ON t.categoryId = c.id
    LEFT JOIN accounts a ON t.accountId = a.id
    WHERE t.date BETWEEN ? AND ?
    ORDER BY t.date DESC
  `,

  GET_TOTAL_BY_TYPE: `
    SELECT COALESCE(SUM(amount), 0) as total
    FROM transactions
    WHERE type = ?
  `,

  GET_SUMMARY_BY_CATEGORY: `
    SELECT 
      t.categoryId,
      c.name as categoryName,
      COALESCE(SUM(t.amount), 0) as total,
      COUNT(*) as count
    FROM transactions t
    LEFT JOIN categories c ON t.categoryId = c.id
    WHERE t.date BETWEEN ? AND ?
    GROUP BY t.categoryId, c.name
    ORDER BY total DESC
  `,

  GET_SUMMARY_BY_BUDGET: `
    SELECT
      b.id as budgetId,
      b.name as budgetName,
      COALESCE(SUM(t.amount), 0) as totalSpent,
      b.amount as budgetAmount,
      CASE
        WHEN COALESCE(SUM(t.amount), 0) > b.amount THEN 1
        ELSE 0
      END as isExceeded
    FROM budgets b
    LEFT JOIN transactions t ON b.id = t.budgetId
    WHERE t.date BETWEEN ? AND ?
    GROUP BY b.id, b.name, b.amount
  `,

  GET_TOTAL_BY_ACCOUNT: `
    SELECT COALESCE(SUM(amount), 0) as total
    FROM transactions
    WHERE accountId = ? AND type = ?
  `,

  GET_SUMMARY_BY_ACCOUNT: `
    SELECT
      t.accountId,
      a.name as accountName,
      a.icon as accountIcon,
      a.color as accountColor,
      COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as totalIncome,
      COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as totalExpense,
      COUNT(*) as transactionCount
    FROM transactions t
    LEFT JOIN accounts a ON t.accountId = a.id
    WHERE t.date BETWEEN ? AND ?
    GROUP BY t.accountId, a.name, a.icon, a.color
  `,

  FIND_BY_ACCOUNT_ID: 'SELECT * FROM transactions WHERE accountId = ? ORDER BY date DESC',

  generateUpdateQuery: (fields: string[]): string => {
    const setClause = fields.map(field => {
      const dbField = field.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      return `${dbField} = ?`;
    }).join(', ');
    
    return `UPDATE transactions SET ${setClause}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`;
  }
} as const; 