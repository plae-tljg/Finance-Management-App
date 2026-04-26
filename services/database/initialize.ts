import { databaseService } from './DatabaseService';
import { CategoryRepository } from './repositories/CategoryRepository';
import { AccountRepository } from './repositories/AccountRepository';
import { BudgetRepository } from './repositories/BudgetRepository';
import { TransactionRepository } from './repositories/TransactionRepository';
import { DEFAULT_CATEGORIES } from './schemas/Category';
import { SCHEMAS } from './schemas';
import { CategoryQueries } from './schemas/Category';
import { TransactionQueries } from './schemas/Transaction';
import { BudgetQueries } from './schemas/Budget';
import { BudgetDefaultQueries } from './schemas/BudgetDefault';

import { AccountQueries } from './schemas/Account';
import { GoalQueries } from './schemas/Goal';
import { DEFAULT_ACCOUNTS } from './schemas/Account';
import Constants from 'expo-constants';

declare global {
  var DATA_CLEAR: boolean | undefined;
}

let globalIsInitializing = false;
let initializationPromise: Promise<any> | null = null;
const CURRENT_SCHEMA_VERSION = 5;

interface SchemaVersion {
  version: number;
  migrate: () => Promise<void>;
}

const MIGRATIONS: SchemaVersion[] = [
  {
    version: 2,
    migrate: async () => {
      console.log('Running migration to version 2...');
      const hasIsRegular = await databaseService.columnExists('budgets', 'isRegular');
      if (!hasIsRegular) {
        await databaseService.executeQuery('ALTER TABLE budgets ADD COLUMN isRegular INTEGER DEFAULT 0');
        await databaseService.executeQuery('ALTER TABLE budgets ADD COLUMN isBudgetExceeded INTEGER DEFAULT 0');
        console.log('Added isRegular and isBudgetExceeded columns to budgets');
      }
      await databaseService.executeQuery(BudgetQueries.CREATE_INDEXES);
      await databaseService.executeQuery(TransactionQueries.CREATE_INDEXES);
      await databaseService.executeQuery(CategoryQueries.CREATE_INDEXES);
      console.log('Created all indexes');
    }
  },
  {
    version: 3,
    migrate: async () => {
      console.log('Running migration to version 3...');
      const hasAccounts = await databaseService.tableExists('accounts');
      if (!hasAccounts) {
        await databaseService.executeQuery(AccountQueries.CREATE_TABLE);
        await databaseService.executeQuery(AccountQueries.CREATE_INDEXES);
        console.log('Created accounts table and indexes');
      }
      const hasGoals = await databaseService.tableExists('goals');
      if (!hasGoals) {
        await databaseService.executeQuery(GoalQueries.CREATE_TABLE);
        await databaseService.executeQuery(GoalQueries.CREATE_INDEXES);
        console.log('Created goals table and indexes');
      }
    }
  },
  {
    version: 4,
    migrate: async () => {
      console.log('Running migration to version 4...');
      const hasBudgetDefaults = await databaseService.tableExists('budget_defaults');
      if (!hasBudgetDefaults) {
        await databaseService.executeQuery(BudgetDefaultQueries.CREATE_TABLE);
        await databaseService.executeQuery(BudgetDefaultQueries.CREATE_INDEXES);
        console.log('Created budget_defaults table and indexes');
      }
      const hasAccountId = await databaseService.columnExists('transactions', 'accountId');
      if (!hasAccountId) {
        await databaseService.executeQuery('ALTER TABLE transactions ADD COLUMN accountId INTEGER NOT NULL DEFAULT 1');
        console.log('Added accountId to transactions');
      }
    }
  }
];

export async function initializeDatabase(db: any) {
  if (initializationPromise) {
    return initializationPromise;
  }

  if (globalIsInitializing) {
    return {
      db: databaseService,
      categories: new CategoryRepository(databaseService),
      budgets: new BudgetRepository(databaseService),
      transactions: new TransactionRepository(databaseService),
      accounts: new AccountRepository(databaseService)
    };
  }

  globalIsInitializing = true;
  console.log('Starting database initialization...');

  initializationPromise = (async () => {
    try {
      if (!databaseService) {
        throw new Error('DatabaseService not initialized');
      }

      databaseService.initialize(db);

      const shouldClearData = Constants.expoConfig?.extra?.DATA_CLEAR === true;
      console.log('Config:', { DATA_CLEAR: Constants.expoConfig?.extra?.DATA_CLEAR, shouldClearData });

      if (shouldClearData) {
        console.log('Clearing database...');
        const tables = await databaseService.executeQuery<{ name: string }>(
          "SELECT name FROM sqlite_master WHERE type='table' AND name NOT IN ('sqlite_sequence', 'sqlite_master')"
        );

        await databaseService.executeQuery('PRAGMA foreign_keys = OFF;');

        for (const table of tables.rows._array) {
          console.log(`Dropping table: ${table.name}`);
          await databaseService.executeQuery(`DROP TABLE IF EXISTS ${table.name};`);
        }

        await databaseService.executeQuery('PRAGMA foreign_keys = ON;');
        console.log('Database cleared');
      }

      console.log('Creating tables...');
      const tableNames = ['categories', 'budgets', 'budget_defaults', 'account_monthly_balances', 'transactions', 'accounts', 'goals'];
      for (const tableName of tableNames) {
        const exists = await databaseService.tableExists(tableName);
        if (!exists) {
          console.log(`Creating table: ${tableName}`);
          await databaseService.executeQuery(SCHEMAS[tableName as keyof typeof SCHEMAS]);
        }
      }
      console.log('Tables created');

      await runMigrations();

      console.log('Initializing repositories...');
      const repositories = {
        categories: new CategoryRepository(databaseService),
        budgets: new BudgetRepository(databaseService),
        transactions: new TransactionRepository(databaseService),
        accounts: new AccountRepository(databaseService)
      };

      console.log('Initializing default data...');
      await initializeDefaultData(repositories);
      console.log('Default data initialized');

      console.log('Database initialization complete');
      return {
        db: databaseService,
        ...repositories
      };
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    } finally {
      initializationPromise = null;
      globalIsInitializing = false;
    }
  })();

  return initializationPromise;
}

async function runMigrations() {
  try {
    await databaseService.executeQuery(`
      CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER PRIMARY KEY,
        appliedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const result = await databaseService.executeQuery<{ version: number }>(
      'SELECT MAX(version) as version FROM schema_version'
    );
    const currentVersion = result.rows._array[0]?.version ?? 1;
    console.log(`Current schema version: ${currentVersion}, target: ${CURRENT_SCHEMA_VERSION}`);

    if (currentVersion < CURRENT_SCHEMA_VERSION) {
      console.log('Running migrations...');
      for (const migration of MIGRATIONS) {
        if (migration.version > currentVersion) {
          console.log(`Applying migration to version ${migration.version}...`);
          await migration.migrate();
          await databaseService.executeQuery(
            'INSERT INTO schema_version (version) VALUES (?)',
            [migration.version]
          );
          console.log(`Migration to version ${migration.version} complete`);
        }
      }
    }
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

export async function resetDatabase(db: any) {
  await databaseService.executeTransaction([
    { query: 'PRAGMA foreign_keys = OFF;' },
    { query: 'DROP TABLE IF EXISTS goals;' },
    { query: 'DROP TABLE IF EXISTS accounts;' },
    { query: 'DROP TABLE IF EXISTS transactions;' },
    { query: 'DROP TABLE IF EXISTS budgets;' },
    { query: 'DROP TABLE IF EXISTS budget_defaults;' },
    { query: 'DROP TABLE IF EXISTS categories;' },
    { query: 'DROP TABLE IF EXISTS account_monthly_balances;' },
    { query: 'DROP TABLE IF EXISTS schema_version;' },
    { query: SCHEMAS.categories },
    { query: SCHEMAS.budgets },
    { query: SCHEMAS.budget_defaults },
    { query: SCHEMAS.transactions },
    { query: SCHEMAS.account_monthly_balances },
    { query: SCHEMAS.accounts },
    { query: SCHEMAS.goals },
    { query: 'PRAGMA foreign_keys = ON;' }
  ]);

  const repositories = {
    categories: new CategoryRepository(databaseService),
    budgets: new BudgetRepository(databaseService),
    transactions: new TransactionRepository(databaseService),
    accounts: new AccountRepository(databaseService)
  };

  await initializeDefaultData(repositories);

  return {
    db: databaseService,
    ...repositories
  };
}

async function initializeDefaultData(repositories: {
  categories: CategoryRepository;
  budgets: BudgetRepository;
  transactions: TransactionRepository;
  accounts: AccountRepository;
}) {
  try {
    const existingCategories = await repositories.categories.findAll();
    if (existingCategories.length === 0) {
      console.log('Initializing default categories...');
      for (const category of DEFAULT_CATEGORIES) {
        await repositories.categories.create(category);
      }
      console.log(`Created ${DEFAULT_CATEGORIES.length} default categories`);
    } else {
      console.log(`Categories already exist (${existingCategories.length}), skipping defaults`);
    }

    const existingAccounts = await repositories.accounts.findAll();
    if (existingAccounts.length === 0) {
      console.log('Initializing default accounts...');
      for (const account of DEFAULT_ACCOUNTS) {
        await repositories.accounts.create(account);
      }
      console.log(`Created ${DEFAULT_ACCOUNTS.length} default accounts`);
    } else {
      console.log(`Accounts already exist (${existingAccounts.length}), skipping defaults`);
    }
  } catch (error) {
    console.error('Default data initialization failed:', error);
    throw error;
  }
}