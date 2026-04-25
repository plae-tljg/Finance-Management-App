export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringTransaction {
  id: number;
  name: string;
  amount: number;
  categoryId: number;
  budgetId: number | null;
  description: string | null;
  type: 'income' | 'expense';
  recurrenceType: RecurrenceType;
  recurrenceDay: number | null;
  startDate: string;
  endDate: string | null;
  lastGeneratedDate: string | null;
  nextDueDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringTransactionWithCategory extends RecurringTransaction {
  categoryName: string;
  categoryIcon: string;
}

export const RecurringTransactionFields = {
  UPDATABLE: [
    'name',
    'amount',
    'categoryId',
    'budgetId',
    'description',
    'type',
    'recurrenceType',
    'recurrenceDay',
    'startDate',
    'endDate',
    'lastGeneratedDate',
    'nextDueDate',
    'isActive'
  ] as const,
  REQUIRED: [
    'name',
    'amount',
    'categoryId',
    'type',
    'recurrenceType',
    'startDate',
    'nextDueDate',
    'isActive'
  ] as const,
} as const;

export type UpdatableFields = typeof RecurringTransactionFields.UPDATABLE[number];
export type RequiredFields = typeof RecurringTransactionFields.REQUIRED[number];

export const RecurringTransactionQueries = {
  CREATE_TABLE: `
    CREATE TABLE IF NOT EXISTS recurring_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      categoryId INTEGER NOT NULL,
      budgetId INTEGER,
      description TEXT,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      recurrenceType TEXT NOT NULL CHECK(recurrenceType IN ('daily', 'weekly', 'monthly', 'yearly')),
      recurrenceDay INTEGER,
      startDate TEXT NOT NULL,
      endDate TEXT,
      lastGeneratedDate TEXT,
      nextDueDate TEXT NOT NULL,
      isActive INTEGER DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (categoryId) REFERENCES categories(id),
      FOREIGN KEY (budgetId) REFERENCES budgets(id)
    )
  `,

  CREATE_INDEXES: `
    CREATE INDEX IF NOT EXISTS idx_recurring_nextDueDate ON recurring_transactions(nextDueDate);
    CREATE INDEX IF NOT EXISTS idx_recurring_isActive ON recurring_transactions(isActive);
    CREATE INDEX IF NOT EXISTS idx_recurring_categoryId ON recurring_transactions(categoryId);
  `,

  INSERT: `
    INSERT INTO recurring_transactions (
      name,
      amount,
      categoryId,
      budgetId,
      description,
      type,
      recurrenceType,
      recurrenceDay,
      startDate,
      endDate,
      lastGeneratedDate,
      nextDueDate,
      isActive
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,

  UPDATE: `
    UPDATE recurring_transactions
    SET name = COALESCE(?, name),
        amount = COALESCE(?, amount),
        categoryId = COALESCE(?, categoryId),
        budgetId = COALESCE(?, budgetId),
        description = COALESCE(?, description),
        type = COALESCE(?, type),
        recurrenceType = COALESCE(?, recurrenceType),
        recurrenceDay = COALESCE(?, recurrenceDay),
        startDate = COALESCE(?, startDate),
        endDate = COALESCE(?, endDate),
        lastGeneratedDate = COALESCE(?, lastGeneratedDate),
        nextDueDate = COALESCE(?, nextDueDate),
        isActive = COALESCE(?, isActive),
        updatedAt = CURRENT_TIMESTAMP
    WHERE id = ?
  `,

  DELETE: 'DELETE FROM recurring_transactions WHERE id = ?',

  FIND_BY_ID: 'SELECT * FROM recurring_transactions WHERE id = ?',

  FIND_ALL: 'SELECT * FROM recurring_transactions ORDER BY nextDueDate ASC',

  FIND_ALL_ACTIVE: `
    SELECT * FROM recurring_transactions
    WHERE isActive = 1 AND (endDate IS NULL OR endDate >= date('now'))
    ORDER BY nextDueDate ASC
  `,

  FIND_DUE_FOR_GENERATION: `
    SELECT * FROM recurring_transactions
    WHERE isActive = 1
      AND nextDueDate <= date('now')
      AND (endDate IS NULL OR endDate >= date('now'))
    ORDER BY nextDueDate ASC
  `,

  FIND_BY_CATEGORY_ID: `
    SELECT * FROM recurring_transactions WHERE categoryId = ?
  `,

  FIND_BY_ID_WITH_CATEGORY: `
    SELECT r.*, c.name as categoryName, c.icon as categoryIcon
    FROM recurring_transactions r
    LEFT JOIN categories c ON r.categoryId = c.id
    WHERE r.id = ?
  `,

  FIND_ALL_WITH_CATEGORY: `
    SELECT r.*, c.name as categoryName, c.icon as categoryIcon
    FROM recurring_transactions r
    LEFT JOIN categories c ON r.categoryId = c.id
    ORDER BY r.nextDueDate ASC
  `,

  COUNT_ALL: 'SELECT COUNT(*) as count FROM recurring_transactions',

  COUNT_DUE: `
    SELECT COUNT(*) as count FROM recurring_transactions
    WHERE isActive = 1 AND nextDueDate <= date('now')
  `,
} as const;

export function calculateNextDueDate(
  currentDueDate: string,
  recurrenceType: RecurrenceType,
  recurrenceDay?: number | null
): string {
  const date = new Date(currentDueDate);

  switch (recurrenceType) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      if (recurrenceDay !== null && recurrenceDay !== undefined) {
        date.setMonth(date.getMonth() + 1);
        date.setDate(Math.min(recurrenceDay, new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()));
      } else {
        date.setMonth(date.getMonth() + 1);
      }
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
  }

  return date.toISOString().split('T')[0];
}