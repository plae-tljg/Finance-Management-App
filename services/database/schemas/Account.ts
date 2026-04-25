export interface Account {
  id: number;
  name: string;
  type: 'cash' | 'bank' | 'digital_wallet' | 'savings' | 'other';
  icon: string;
  color: string;
  balance: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_ACCOUNTS: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: '现金',
    type: 'cash',
    icon: '💵',
    color: '#34C759',
    balance: 0,
    isActive: true,
    sortOrder: 1,
  },
  {
    name: '银行账户',
    type: 'bank',
    icon: '🏦',
    color: '#007AFF',
    balance: 0,
    isActive: true,
    sortOrder: 2,
  },
  {
    name: '数字钱包',
    type: 'digital_wallet',
    icon: '📱',
    color: '#5856D6',
    balance: 0,
    isActive: true,
    sortOrder: 3,
  },
];

export const AccountFields = {
  UPDATABLE: ['name', 'type', 'icon', 'color', 'balance', 'isActive', 'sortOrder'] as const,
  REQUIRED: ['name', 'type', 'icon', 'color'] as const,
  OPTIONAL: ['balance', 'isActive', 'sortOrder'] as const,
};

export type UpdatableFields = typeof AccountFields.UPDATABLE[number];
export type RequiredFields = typeof AccountFields.REQUIRED[number];

export const AccountQueries = {
  CREATE_TABLE: `
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('cash', 'bank', 'digital_wallet', 'savings', 'other')),
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      balance DECIMAL(10,2) DEFAULT 0,
      isActive INTEGER DEFAULT 1,
      sortOrder INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,

  CREATE_INDEXES: `
    CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type);
    CREATE INDEX IF NOT EXISTS idx_accounts_isActive ON accounts(isActive);
  `,

  INSERT: `
    INSERT INTO accounts (name, type, icon, color, balance, isActive, sortOrder)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `,

  UPDATE: `
    UPDATE accounts
    SET name = COALESCE(?, name),
        type = COALESCE(?, type),
        icon = COALESCE(?, icon),
        color = COALESCE(?, color),
        balance = COALESCE(?, balance),
        isActive = COALESCE(?, isActive),
        sortOrder = COALESCE(?, sortOrder),
        updatedAt = CURRENT_TIMESTAMP
    WHERE id = ?
  `,

  DELETE: 'DELETE FROM accounts WHERE id = ?',

  FIND_BY_ID: 'SELECT * FROM accounts WHERE id = ?',

  FIND_ALL: 'SELECT * FROM accounts ORDER BY sortOrder ASC',

  FIND_ACTIVE: 'SELECT * FROM accounts WHERE isActive = 1 ORDER BY sortOrder ASC',

  FIND_BY_TYPE: 'SELECT * FROM accounts WHERE type = ? AND isActive = 1 ORDER BY sortOrder ASC',

  COUNT_ALL: 'SELECT COUNT(*) as count FROM accounts',

  UPDATE_BALANCE: 'UPDATE accounts SET balance = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',

  generateUpdateQuery: (fields: string[]): string => {
    const setClause = fields.map(field => {
      const dbField = field.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      return `${dbField} = ?`;
    }).join(', ');
    return `UPDATE accounts SET ${setClause}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`;
  },
};