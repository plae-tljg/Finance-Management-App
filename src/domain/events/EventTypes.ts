export const EventTypes = {
  TRANSACTION: {
    CREATED: 'TransactionCreated',
    UPDATED: 'TransactionUpdated',
    DELETED: 'TransactionDeleted'
  },
  BUDGET: {
    CREATED: 'BudgetCreated',
    UPDATED: 'BudgetUpdated',
    DELETED: 'BudgetDeleted'
  },
  ACCOUNT: {
    CREATED: 'AccountCreated',
    UPDATED: 'AccountUpdated',
    DELETED: 'AccountDeleted'
  }
} as const; 