package com.anonymous.financemanager.webserver

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.util.Log
import java.io.File

/**
 * Opens the same SQLite database file that `expo-sqlite` uses on the device,
 * runs schema migrations, and exposes the underlying [SQLiteDatabase].
 *
 * `expo-sqlite` (>= 14) stores its DB files under
 * `<files>/SQLite/<databaseName>` on Android. We replicate that path so both
 * the native UI and the embedded HTTP server see exactly the same data.
 */
class Database(context: Context, dbName: String = "FinanceManager.db") {

    private val dbPath: File = File(context.filesDir, "SQLite/$dbName")

    val database: SQLiteDatabase by lazy { openInternal() }

    val isReady: Boolean
        get() = dbPath.exists()

    @Synchronized
    private fun openInternal(): SQLiteDatabase {
        if (!dbPath.exists()) {
            Log.w(TAG, "Database file does not exist yet at ${dbPath.absolutePath}")
        }
        val db = SQLiteDatabase.openDatabase(
            dbPath.absolutePath,
            /* factory = */ null,
            SQLiteDatabase.OPEN_READWRITE or SQLiteDatabase.CREATE_IF_NECESSARY,
        )
        db.execSQL("PRAGMA foreign_keys = ON;")
        ensureSchema(db)
        return db
    }

    /**
     * Replicates the JS-side `initialize.ts` schema bootstrap. Idempotent.
     */
    fun ensureSchema(db: SQLiteDatabase) {
        for (sql in Schemas.CREATE_STATEMENTS) {
            try {
                db.execSQL(sql)
            } catch (e: Exception) {
                Log.w(TAG, "ensureSchema statement failed (continuing): ${e.message}")
            }
        }
        for (sql in Schemas.INDEX_STATEMENTS) {
            try {
                db.execSQL(sql)
            } catch (e: Exception) {
                Log.w(TAG, "ensureSchema index failed (continuing): ${e.message}")
            }
        }
        // Run migration v2: add isRegular/isBudgetExceeded to budgets.
        try {
            val cursor = db.rawQuery(
                "SELECT name FROM pragma_table_info('budgets') WHERE name='isRegular'",
                null,
            )
            cursor.use {
                if (!it.moveToFirst()) {
                    db.execSQL("ALTER TABLE budgets ADD COLUMN isRegular INTEGER DEFAULT 0;")
                    db.execSQL("ALTER TABLE budgets ADD COLUMN isBudgetExceeded INTEGER DEFAULT 0;")
                    Log.i(TAG, "Migration v2 applied: budgets.isRegular/isBudgetExceeded")
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "Migration v2 skipped: ${e.message}")
        }

        // Run migration v4: ensure transactions.accountId exists.
        try {
            val cursor = db.rawQuery(
                "SELECT name FROM pragma_table_info('transactions') WHERE name='accountId'",
                null,
            )
            cursor.use {
                if (!it.moveToFirst()) {
                    db.execSQL(
                        "ALTER TABLE transactions ADD COLUMN accountId INTEGER NOT NULL DEFAULT 1;"
                    )
                    Log.i(TAG, "Migration v4 applied: transactions.accountId")
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "Migration v4 skipped: ${e.message}")
        }

        seedDefaultsIfEmpty(db)
    }

    private fun seedDefaultsIfEmpty(db: SQLiteDatabase) {
        try {
            val cursor = db.rawQuery("SELECT COUNT(*) AS c FROM categories", null)
            cursor.use {
                if (it.moveToFirst() && it.getInt(0) == 0) {
                    for (cat in DEFAULT_CATEGORIES) {
                        db.execSQL(
                            "INSERT INTO categories (name, icon, type, sortOrder, isDefault, isActive) VALUES (?, ?, ?, ?, 1, 1)",
                            arrayOf<Any?>(cat[0], cat[1], cat[2], cat[3]),
                        )
                    }
                    Log.i(TAG, "Seeded default categories")
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "seedCategories skipped: ${e.message}")
        }

        try {
            val cursor = db.rawQuery("SELECT COUNT(*) AS c FROM accounts", null)
            cursor.use {
                if (it.moveToFirst() && it.getInt(0) == 0) {
                    for (acc in DEFAULT_ACCOUNTS) {
                        db.execSQL(
                            "INSERT INTO accounts (name, type, icon, color, balance, isActive, sortOrder) VALUES (?, ?, ?, ?, 0, 1, ?)",
                            arrayOf(acc[0], acc[1], acc[2], acc[3], acc[4]),
                        )
                    }
                    Log.i(TAG, "Seeded default accounts")
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "seedAccounts skipped: ${e.message}")
        }
    }

    companion object {
        private const val TAG = "FMWebDb"

        private val DEFAULT_CATEGORIES = listOf(
            arrayOf("餐饮", "🍚", "expense", 1),
            arrayOf("交通", "🚌", "expense", 2),
            arrayOf("购物", "🛍️", "expense", 3),
            arrayOf("工资", "💰", "income", 1),
            arrayOf("家用", "🧓", "expense", 5),
            arrayOf("账单", "🧾", "expense", 6),
        )

        private val DEFAULT_ACCOUNTS = listOf(
            arrayOf("现金", "cash", "💵", "#34C759", 1),
            arrayOf("银行账户", "bank", "🏦", "#007AFF", 2),
            arrayOf("数字钱包", "digital_wallet", "📱", "#5856D6", 3),
        )
    }
}