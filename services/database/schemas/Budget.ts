export interface Budget {
  id: number;
  name: string;
  description: string | null;
  categoryId: number;
  accountId: number | null;
  amount: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate: string;
  month: string;
  createdAt: string;
  updatedAt: string;
  isRegular: boolean;
  isBudgetExceeded: boolean;
}

export interface BudgetWithCategory extends Budget {
  categoryName: string;
  categoryIcon: string;
  spent: number;
}

export const BudgetFields = {
  UPDATABLE: ['name', 'description', 'categoryId', 'accountId', 'amount', 'period', 'startDate', 'endDate', 'month', 'isRegular', 'isBudgetExceeded'] as const,
} as const;

export type UpdatableFields = typeof BudgetFields.UPDATABLE[number];

export const BudgetQueries = {
  CREATE_TABLE: `
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      categoryId INTEGER NOT NULL,
      accountId INTEGER DEFAULT NULL,
      amount DECIMAL(10,2) NOT NULL,
      period TEXT NOT NULL CHECK(period IN ('daily', 'weekly', 'monthly', 'yearly')),
      startDate TEXT NOT NULL,
      endDate TEXT NOT NULL,
      month TEXT NOT NULL,
      isRegular INTEGER DEFAULT 0,
      isBudgetExceeded INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (categoryId) REFERENCES categories(id),
      FOREIGN KEY (accountId) REFERENCES accounts(id)
    )
  `,

  CREATE_INDEXES: `
    CREATE INDEX IF NOT EXISTS idx_budgets_month ON budgets(month);
    CREATE INDEX IF NOT EXISTS idx_budgets_categoryId ON budgets(categoryId);
    CREATE INDEX IF NOT EXISTS idx_budgets_accountId ON budgets(accountId);
  `,

  INSERT: `
    INSERT INTO budgets (name, description, categoryId, accountId, amount, period, startDate, endDate, month, isRegular, isBudgetExceeded)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,

  UPDATE: `
    UPDATE budgets
    SET name = COALESCE(?, name),
        description = COALESCE(?, description),
        categoryId = COALESCE(?, categoryId),
        accountId = COALESCE(?, accountId),
        amount = COALESCE(?, amount),
        period = COALESCE(?, period),
        startDate = COALESCE(?, startDate),
        endDate = COALESCE(?, endDate),
        month = COALESCE(?, month),
        isRegular = COALESCE(?, isRegular),
        isBudgetExceeded = COALESCE(?, isBudgetExceeded),
        updatedAt = CURRENT_TIMESTAMP
    WHERE id = ?
  `,

  ADD_COLUMNS_MIGRATION: `
    ALTER TABLE budgets ADD COLUMN isRegular INTEGER DEFAULT 0;
    ALTER TABLE budgets ADD COLUMN isBudgetExceeded INTEGER DEFAULT 0;
  `,

  DELETE: 'DELETE FROM budgets WHERE id = ?',

  FIND_BY_ID: 'SELECT * FROM budgets WHERE id = ?',

  FIND_ALL: 'SELECT * FROM budgets ORDER BY month DESC, categoryId ASC',

  FIND_BY_CATEGORY_ID: 'SELECT * FROM budgets WHERE categoryId = ? ORDER BY month DESC',

  FIND_BY_CATEGORY_AND_MONTH: 'SELECT * FROM budgets WHERE categoryId = ? AND month = ? ORDER BY id ASC',

  FIND_BY_DATE_RANGE: `
    SELECT * FROM budgets 
    WHERE startDate <= ? AND endDate >= ?
  `,

  FIND_BY_PERIOD: 'SELECT * FROM budgets WHERE period = ?',

  FIND_BY_MONTH: `
    SELECT * FROM budgets 
    WHERE month = ?
    ORDER BY categoryId ASC
  `,

  FIND_BY_MONTH_WITH_CATEGORY: `
    SELECT b.*, c.name as categoryName, c.type as categoryType
    FROM budgets b
    LEFT JOIN categories c ON b.categoryId = c.id
    WHERE b.month = ?
    ORDER BY b.categoryId ASC
  `,

  FIND_ACTIVE: `
    SELECT * FROM budgets 
    WHERE month >= ?
    ORDER BY month DESC, categoryId ASC
  `,

  FIND_ALL_WITH_CATEGORY: `
    SELECT b.*, c.name as categoryName, c.type as categoryType
    FROM budgets b
    LEFT JOIN categories c ON b.categoryId = c.id
    ORDER BY b.month DESC, b.categoryId ASC
  `,

  FIND_BY_ID_WITH_CATEGORY: `
    SELECT b.*, c.name as categoryName, c.type as categoryType
    FROM budgets b
    LEFT JOIN categories c ON b.categoryId = c.id
    WHERE b.id = ?
  `,

  COUNT_ALL: 'SELECT COUNT(*) as count FROM budgets',

  // 添加一个函数来生成动态 UPDATE 查询
  generateUpdateQuery: (fields: string[]): string => {
    const setClause = fields.map(field => {
      // 转换 camelCase 到 snake_case
      const dbField = field.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      return `${dbField} = ?`;
    }).join(', ');
    
    return `UPDATE budgets SET ${setClause}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`;
  },
} as const; 