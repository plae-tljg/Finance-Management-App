package com.anonymous.financemanager.webserver

/**
 * Port of services/database/schemas (TypeScript files).
 *
 * Each schema's CREATE TABLE / INDEX statements are duplicated here so the
 * embedded HTTP server can run them against the same SQLite database file
 * that `expo-sqlite` uses on the device. We deliberately do NOT call into
 * `expo-sqlite` from native code; instead we open the same .db file with
 * Android's `SQLiteDatabase` API.
 */
object Schemas {

    const val SCHEMA_VERSION = 5

    const val CATEGORIES = """
        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          icon TEXT NOT NULL,
          type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
          sortOrder INTEGER DEFAULT 0,
          isDefault BOOLEAN DEFAULT 0,
          isActive BOOLEAN DEFAULT 1,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """

    const val CATEGORIES_INDEXES = """
        CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
        CREATE INDEX IF NOT EXISTS idx_categories_isActive ON categories(isActive);
    """

    const val BUDGETS = """
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
    """

    const val BUDGETS_INDEXES = """
        CREATE INDEX IF NOT EXISTS idx_budgets_month ON budgets(month);
        CREATE INDEX IF NOT EXISTS idx_budgets_categoryId ON budgets(categoryId);
        CREATE INDEX IF NOT EXISTS idx_budgets_accountId ON budgets(accountId);
    """

    const val BUDGET_DEFAULTS = """
        CREATE TABLE IF NOT EXISTS budget_defaults (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          categoryId INTEGER NOT NULL UNIQUE,
          amount DECIMAL(10,2) NOT NULL,
          period TEXT NOT NULL DEFAULT 'monthly' CHECK(period IN ('daily', 'weekly', 'monthly', 'yearly')),
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (categoryId) REFERENCES categories(id)
        )
    """

    const val BUDGET_DEFAULTS_INDEXES = """
        CREATE INDEX IF NOT EXISTS idx_budget_defaults_categoryId ON budget_defaults(categoryId);
    """

    const val ACCOUNT_MONTHLY_BALANCES = """
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
    """

    const val ACCOUNT_MONTHLY_BALANCES_INDEXES = """
        CREATE INDEX IF NOT EXISTS idx_account_monthly_balances_account_year_month
            ON account_monthly_balances(accountId, year, month);
    """

    const val TRANSACTIONS = """
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
    """

    const val TRANSACTIONS_INDEXES = """
        CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
        CREATE INDEX IF NOT EXISTS idx_transactions_categoryId ON transactions(categoryId);
        CREATE INDEX IF NOT EXISTS idx_transactions_budgetId ON transactions(budgetId);
        CREATE INDEX IF NOT EXISTS idx_transactions_accountId ON transactions(accountId);
        CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
    """

    const val ACCOUNTS = """
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
    """

    const val ACCOUNTS_INDEXES = """
        CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type);
        CREATE INDEX IF NOT EXISTS idx_accounts_isActive ON accounts(isActive);
    """

    const val GOALS = """
        CREATE TABLE IF NOT EXISTS goals (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          targetAmount DECIMAL(10,2) NOT NULL,
          currentAmount DECIMAL(10,2) DEFAULT 0,
          deadline TEXT,
          icon TEXT NOT NULL,
          color TEXT NOT NULL,
          isCompleted INTEGER DEFAULT 0,
          isActive INTEGER DEFAULT 1,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """

    const val GOALS_INDEXES = """
        CREATE INDEX IF NOT EXISTS idx_goals_isActive ON goals(isActive);
        CREATE INDEX IF NOT EXISTS idx_goals_isCompleted ON goals(isCompleted);
    """

    val TABLE_NAMES = listOf(
        "categories", "budgets", "budget_defaults",
        "account_monthly_balances", "transactions", "accounts", "goals",
    )

    val CREATE_STATEMENTS = listOf(
        CATEGORIES, BUDGETS, BUDGET_DEFAULTS,
        ACCOUNT_MONTHLY_BALANCES, TRANSACTIONS, ACCOUNTS, GOALS,
    )

    val INDEX_STATEMENTS = listOf(
        CATEGORIES_INDEXES, BUDGETS_INDEXES, BUDGET_DEFAULTS_INDEXES,
        ACCOUNT_MONTHLY_BALANCES_INDEXES, TRANSACTIONS_INDEXES,
        ACCOUNTS_INDEXES, GOALS_INDEXES,
    )
}