export interface BudgetDefault {
  id: number;
  categoryId: number;
  amount: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  createdAt: string;
  updatedAt: string;
}

export interface BudgetDefaultWithCategory extends BudgetDefault {
  categoryName: string;
  categoryIcon: string;
  categoryType: string;
}

export const BudgetDefaultQueries = {
  CREATE_TABLE: `
    CREATE TABLE IF NOT EXISTS budget_defaults (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      categoryId INTEGER NOT NULL UNIQUE,
      amount DECIMAL(10,2) NOT NULL,
      period TEXT NOT NULL DEFAULT 'monthly' CHECK(period IN ('daily', 'weekly', 'monthly', 'yearly')),
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (categoryId) REFERENCES categories(id)
    )
  `,

  CREATE_INDEXES: `
    CREATE INDEX IF NOT EXISTS idx_budget_defaults_categoryId ON budget_defaults(categoryId);
  `,

  INSERT: `
    INSERT INTO budget_defaults (categoryId, amount, period)
    VALUES (?, ?, ?)
  `,

  UPDATE: `
    UPDATE budget_defaults
    SET amount = ?,
        period = ?,
        updatedAt = CURRENT_TIMESTAMP
    WHERE categoryId = ?
  `,

  UPSERT: `
    INSERT INTO budget_defaults (categoryId, amount, period)
    VALUES (?, ?, ?)
    ON CONFLICT(categoryId) DO UPDATE SET
      amount = excluded.amount,
      period = excluded.period,
      updatedAt = CURRENT_TIMESTAMP
  `,

  DELETE: 'DELETE FROM budget_defaults WHERE categoryId = ?',

  FIND_BY_ID: 'SELECT * FROM budget_defaults WHERE id = ?',

  FIND_BY_CATEGORY_ID: 'SELECT * FROM budget_defaults WHERE categoryId = ?',

  FIND_ALL: `
    SELECT bd.*, c.name as categoryName, c.icon as categoryIcon, c.type as categoryType
    FROM budget_defaults bd
    LEFT JOIN categories c ON bd.categoryId = c.id
    ORDER BY c.sortOrder ASC
  `,

  COUNT_ALL: 'SELECT COUNT(*) as count FROM budget_defaults',
};