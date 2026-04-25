export interface AccountMonthlyBalance {
  id: number;
  accountId: number;
  year: number;
  month: number;
  openingBalance: number;
  closingBalance: number;
  createdAt: string;
  updatedAt: string;
}

export const AccountMonthlyBalanceFields = {
  UPDATABLE: ['accountId', 'year', 'month', 'openingBalance', 'closingBalance'] as const,
} as const;

export const AccountMonthlyBalanceQueries = {
  CREATE_TABLE: `
    CREATE TABLE IF NOT EXISTS account_monthly_balances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      accountId INTEGER NOT NULL,
      year INTEGER NOT NULL,
      month INTEGER NOT NULL,
      openingBalance DECIMAL(10,2) NOT NULL,
      closingBalance DECIMAL(10,2) NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(accountId, year, month)
    )
  `,

  CREATE_INDEXES: `
    CREATE INDEX IF NOT EXISTS idx_account_monthly_balances_account_year_month ON account_monthly_balances(accountId, year, month);
  `,

  INSERT: `
    INSERT OR REPLACE INTO account_monthly_balances (accountId, year, month, openingBalance, closingBalance)
    VALUES (?, ?, ?, ?, ?)
  `,

  UPDATE: `
    UPDATE account_monthly_balances
    SET openingBalance = COALESCE(?, openingBalance),
        closingBalance = COALESCE(?, closingBalance),
        updatedAt = CURRENT_TIMESTAMP
    WHERE id = ?
  `,

  FIND_BY_ID: `
    SELECT * FROM account_monthly_balances WHERE id = ?
  `,

  DELETE: `
    DELETE FROM account_monthly_balances WHERE id = ?
  `,

  COUNT_ALL: `
    SELECT COUNT(*) as count FROM account_monthly_balances
  `,

  FIND_BY_ACCOUNT_YEAR_MONTH: `
    SELECT * FROM account_monthly_balances WHERE accountId = ? AND year = ? AND month = ?
  `,

  FIND_ALL: `
    SELECT * FROM account_monthly_balances ORDER BY year DESC, month DESC
  `,

  FIND_BY_ACCOUNT: `
    SELECT * FROM account_monthly_balances WHERE accountId = ? ORDER BY year DESC, month DESC
  `,

  FIND_BY_YEAR_MONTH: `
    SELECT * FROM account_monthly_balances WHERE year = ? AND month = ?
  `,

  FIND_BY_YEAR: `
    SELECT * FROM account_monthly_balances WHERE year = ? ORDER BY month ASC
  `,
};