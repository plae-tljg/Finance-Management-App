export const DATABASE_CONFIG = {
  name: 'FinanceManager.db',
  version: 1,
  tables: ['categories', 'transactions', 'budgets']
} as const;

export const MIGRATIONS = [
  {
    version: 1,
    up: `
      CREATE TABLE IF NOT EXISTS categories (...);
      CREATE TABLE IF NOT EXISTS transactions (...);
      CREATE TABLE IF NOT EXISTS budgets (...);
    `,
    down: `
      DROP TABLE IF EXISTS budgets;
      DROP TABLE IF EXISTS transactions;
      DROP TABLE IF EXISTS categories;
    `
  }
] as const; 