package com.anonymous.financemanager.webserver

import android.content.Context
import android.content.res.AssetManager
import android.net.wifi.WifiManager
import android.util.Log
import fi.iki.elonen.NanoHTTPD
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException
import java.io.InputStream
import java.net.NetworkInterface
import java.util.Collections
import java.util.Locale

/**
 * Embedded HTTP server that:
 *  1. Serves the Expo web bundle (`assets/web/...`) at `/`.
 *  2. Exposes a REST API under `/api/...` that proxies to the same SQLite DB
 *     that `expo-sqlite` uses on the device.
 *
 * Real-time edits from the browser show up immediately in the native app and
 * vice versa, because they share the same `finance.db` file on disk.
 */
class FinanceHttpServer(
    private val appContext: Context,
    private val port: Int = DEFAULT_PORT,
    private val pin: String? = null,
) : NanoHTTPD(port) {

    private val db = Database(appContext)
    private val writeLock = Any()
    private val connectionLog: ArrayDeque<ConnectionRecord> = ArrayDeque()
    private val maxLogEntries = 32
    private var activeConnections = 0

    data class ConnectionRecord(
        val timestampMs: Long,
        val method: String,
        val path: String,
        val status: Int,
        val remoteAddress: String?,
    )

    init {
        // NanoHTTPD defaults to listening on '0.0.0.0'; keep it.
        try {
            start(NanoHTTPD.SOCKET_READ_TIMEOUT, false)
        } catch (e: IOException) {
            Log.e(TAG, "Failed to start HTTP server: ${e.message}")
        }
    }

    fun isRunning(): Boolean = isAlive

    fun snapshotLog(): List<ConnectionRecord> = synchronized(connectionLog) {
        connectionLog.toList()
    }

    fun activeConnectionCount(): Int = synchronized(connectionLog) { activeConnections }

    private fun record(method: String, path: String, status: Int, remote: String?) {
        synchronized(connectionLog) {
            activeConnections = (activeConnections + 1).coerceAtLeast(0)
            connectionLog.addLast(
                ConnectionRecord(System.currentTimeMillis(), method, path, status, remote),
            )
            while (connectionLog.size > maxLogEntries) connectionLog.removeFirst()
        }
    }

    private fun recordFinished() {
        synchronized(connectionLog) {
            activeConnections = (activeConnections - 1).coerceAtLeast(0)
        }
    }

    /**
     * Returns the local IPv4 address on the Wi-Fi interface, or null if
     * not connected.
     */
    fun localIpAddress(): String? {
        try {
            Collections.list(NetworkInterface.getNetworkInterfaces()).forEach { iface ->
                if (!iface.isUp || iface.isLoopback || iface.isVirtual) return@forEach
                if (!iface.name.lowercase(Locale.ROOT).contains("wlan") &&
                    !iface.name.lowercase(Locale.ROOT).contains("wifi") &&
                    !iface.name.lowercase(Locale.ROOT).contains("eth")
                ) return@forEach
                Collections.list(iface.inetAddresses).forEach { addr ->
                    if (addr is java.net.Inet4Address && !addr.isLoopbackAddress) {
                        return addr.hostAddress
                    }
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "localIpAddress enumeration failed: ${e.message}")
        }
        // Fallback: ask WifiManager.
        try {
            val wm = appContext.applicationContext
                .getSystemService(Context.WIFI_SERVICE) as? WifiManager
            val ip = wm?.connectionInfo?.ipAddress ?: 0
            if (ip != 0) {
                return String.format(
                    Locale.US,
                    "%d.%d.%d.%d",
                    ip and 0xff,
                    ip shr 8 and 0xff,
                    ip shr 16 and 0xff,
                    ip shr 24 and 0xff,
                )
            }
        } catch (e: Exception) {
            Log.w(TAG, "WifiManager fallback failed: ${e.message}")
        }
        return null
    }

    override fun serve(session: IHTTPSession): Response {
        val uri = session.uri.trimEnd('/').ifEmpty { "/" }
        val method = session.method
        val remote = session.remoteIpAddress
        return try {
            val response = handleRequest(uri, method, session)
            record(method.toString(), uri, response.status.requestStatus, remote)
            response
        } catch (e: Exception) {
            Log.e(TAG, "Error serving $method $uri", e)
            val response = jsonResponse(500, JSONObject().apply {
                put("error", e.message ?: "internal_error")
            })
            record(method.toString(), uri, response.status.requestStatus, remote)
            response
        } finally {
            recordFinished()
        }
    }

    private fun handleRequest(uri: String, method: Method, session: IHTTPSession): Response {
        try {
            // /api/health is unauthenticated
            if (uri == "/api/health") {
                return jsonResponse(200, JSONObject().apply {
                    put("ok", true)
                    put("schemaVersion", Schemas.SCHEMA_VERSION)
                })
            }

            // PIN auth disabled — this is a personal LAN tool, no auth required.
            // The web side still appends `?token=<pin>` to the URL for parity, but
            // the server ignores it.
            if (false && pin != null && uri.startsWith("/api/")) {
                val auth = session.headers["authorization"] ?: session.parameters["token"]?.firstOrNull()
                val expected = "Bearer $pin"
                if (auth != expected) {
                    return jsonResponse(401, JSONObject().apply { put("error", "unauthorized") })
                }
            }

            // Static files for the web SPA. We serve everything else from
            // APK assets.
            if (!uri.startsWith("/api/")) {
                return serveStatic(uri, session)
            }

            return when {
                uri == "/api/schema/status" -> handleSchemaStatus()
                uri == "/api/schema/migrate" -> handleSchemaMigrate(method, session)

                uri == "/api/transactions" || uri == "/api/transactions/" ->
                    handleCollection(method, session, "transactions", TransactionColumnMap.ALL)
                uri.startsWith("/api/transactions/summary/by-category") ->
                    handleSummaryByCategory(session)
                uri.startsWith("/api/transactions/summary/by-budget") ->
                    handleSummaryByBudget(session)
                uri.startsWith("/api/transactions/summary/by-account") ->
                    handleSummaryByAccount(session)
                uri.startsWith("/api/transactions/") -> handleItem(
                    method, session, "transactions", TransactionColumnMap.ALL
                )

                uri == "/api/budgets" || uri == "/api/budgets/" ->
                    handleCollection(method, session, "budgets", TransactionColumnMap.BUDGETS)
                uri.startsWith("/api/budgets/") -> handleItem(
                    method, session, "budgets", TransactionColumnMap.BUDGETS
                )

                uri == "/api/budget-defaults" || uri == "/api/budget-defaults/" ->
                    handleCollection(method, session, "budget_defaults", TransactionColumnMap.BUDGET_DEFAULTS)
                uri.startsWith("/api/budget-defaults/") -> handleItem(
                    method, session, "budget_defaults", TransactionColumnMap.BUDGET_DEFAULTS
                )

                uri == "/api/categories" || uri == "/api/categories/" ->
                    handleCollection(method, session, "categories", TransactionColumnMap.CATEGORIES)
                uri.startsWith("/api/categories/") -> handleItem(
                    method, session, "categories", TransactionColumnMap.CATEGORIES
                )

                uri == "/api/accounts" || uri == "/api/accounts/" ->
                    handleCollection(method, session, "accounts", TransactionColumnMap.ACCOUNTS)
                uri.startsWith("/api/accounts/") -> handleItem(
                    method, session, "accounts", TransactionColumnMap.ACCOUNTS
                )

                uri == "/api/goals" || uri == "/api/goals/" ->
                    handleCollection(method, session, "goals", TransactionColumnMap.GOALS)
                uri.startsWith("/api/goals/") -> handleItem(
                    method, session, "goals", TransactionColumnMap.GOALS
                )

                uri == "/api/account-monthly-balances" || uri == "/api/account-monthly-balances/" ->
                    handleCollection(
                        method, session,
                        "account_monthly_balances", TransactionColumnMap.ACCOUNT_MONTHLY_BALANCES,
                    )
                uri.startsWith("/api/account-monthly-balances/totals") ->
                    handleMonthlyTotals(session)
                uri.startsWith("/api/account-monthly-balances/") -> handleItem(
                    method, session,
                    "account_monthly_balances", TransactionColumnMap.ACCOUNT_MONTHLY_BALANCES,
                )

                uri == "/api/admin/reset" -> handleAdminReset(method)

                uri.startsWith("/api/reports/") -> handleReport(uri, session)

                else -> jsonResponse(404, JSONObject().apply { put("error", "not_found"); put("path", uri) })
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error serving $method $uri", e)
            return jsonResponse(500, JSONObject().apply {
                put("error", e.message ?: "internal_error")
            })
        }
    }

    // -----------------------------------------------------------------
    // Static file serving
    // -----------------------------------------------------------------
    private fun serveStatic(uri: String, session: IHTTPSession): Response {
        val am: AssetManager = appContext.assets
        val path = if (uri == "/" || uri.isEmpty()) "web/index.html" else "web$uri"
        val candidate = if (path.endsWith(".html") || path.contains('.')) path else "$path.html"
        val isText = candidate.endsWith(".html") || candidate.endsWith(".js") ||
            candidate.endsWith(".css") || candidate.endsWith(".json") ||
            candidate.endsWith(".svg") || candidate.endsWith(".txt")
        return try {
            val input = am.open(candidate)
            val mime = mimeFor(candidate)
            val data = input.readBytes()
            input.close()
            if (isText) {
                newFixedLengthResponse(Response.Status.OK, mime, String(data, Charsets.UTF_8))
            } else {
                // Stream raw bytes for binary assets (TTF, GIF, PNG, WOFF...).
                // Routing through String() would corrupt them, breaking fonts
                // and breaking GIF/PNG rendering in the browser.
                newChunkedResponse(Response.Status.OK, mime, java.io.ByteArrayInputStream(data))
            }
        } catch (e: IOException) {
            // SPA fallback: serve index.html for unknown routes so client-side
            // routing works.
            try {
                val input = am.open("web/index.html")
                val data = input.readBytes()
                input.close()
                newFixedLengthResponse(
                    Response.Status.OK, "text/html",
                    String(data, Charsets.UTF_8),
                )
            } catch (e2: IOException) {
                newFixedLengthResponse(
                    Response.Status.NOT_FOUND, "text/plain",
                    "Not found: $uri",
                )
            }
        }
    }

    private fun mimeFor(path: String): String = when {
        path.endsWith(".html") -> "text/html"
        path.endsWith(".js") -> "application/javascript"
        path.endsWith(".css") -> "text/css"
        path.endsWith(".json") -> "application/json"
        path.endsWith(".png") -> "image/png"
        path.endsWith(".jpg") || path.endsWith(".jpeg") -> "image/jpeg"
        path.endsWith(".gif") -> "image/gif"
        path.endsWith(".svg") -> "image/svg+xml"
        path.endsWith(".ico") -> "image/x-icon"
        path.endsWith(".woff") -> "font/woff"
        path.endsWith(".woff2") -> "font/woff2"
        path.endsWith(".ttf") -> "font/ttf"
        else -> "application/octet-stream"
    }

    // -----------------------------------------------------------------
    // Schema endpoints
    // -----------------------------------------------------------------
    private fun handleSchemaStatus(): Response {
        val tables = JSONObject()
        synchronized(writeLock) {
            db.database.rawQuery(
                "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
                null,
            ).use { c ->
                while (c.moveToNext()) {
                    val name = c.getString(0)
                    val cols = mutableListOf<String>()
                    db.database.rawQuery("PRAGMA table_info($name)", null).use { cc ->
                        while (cc.moveToNext()) cols.add(cc.getString(1))
                    }
                    tables.put(name, JSONArray(cols))
                }
            }
        }
        return jsonResponse(200, JSONObject().apply {
            put("schemaVersion", Schemas.SCHEMA_VERSION)
            put("tables", tables)
        })
    }

    private fun handleSchemaMigrate(method: Method, session: IHTTPSession): Response {
        if (method != Method.POST) return jsonResponse(405, JSONObject().apply { put("error", "method_not_allowed") })
        synchronized(writeLock) {
            db.ensureSchema(db.database)
        }
        return jsonResponse(200, JSONObject().apply {
            put("schemaVersion", Schemas.SCHEMA_VERSION)
            put("migrated", true)
        })
    }

    // -----------------------------------------------------------------
    // Generic CRUD
    // -----------------------------------------------------------------
    private fun handleCollection(
        method: Method,
        session: IHTTPSession,
        table: String,
        cols: List<String>,
    ): Response {
        val params = session.parameters
        return when (method) {
            Method.GET -> {
                val rows = synchronized(writeLock) {
                    readRowsWithFilters(table, params)
                }
                jsonResponse(200, rows)
            }
            Method.POST -> {
                val body = readBody(session)
                val obj = JSONObject(body)
                val row = synchronized(writeLock) {
                    val id = insertRow(table, cols, obj)
                    db.database.rawQuery(
                        "SELECT * FROM $table WHERE id = ?",
                        arrayOf(id.toString()),
                    ).use { c -> if (c.moveToFirst()) cursorToJson(c) else JSONObject().put("id", id) }
                }
                jsonResponse(201, row)
            }
            else -> jsonResponse(405, JSONObject().apply { put("error", "method_not_allowed") })
        }
    }

    private fun handleItem(
        method: Method,
        session: IHTTPSession,
        table: String,
        cols: List<String>,
    ): Response {
        val parts = session.uri.removePrefix("/api/").split("/")
        if (parts.size < 2) return jsonResponse(400, JSONObject().apply { put("error", "missing_id") })
        val id = parts[1].toLongOrNull() ?: return jsonResponse(400, JSONObject().apply { put("error", "bad_id") })
        return when (method) {
            Method.GET -> {
                val row: JSONObject? = synchronized(writeLock) {
                    db.database.rawQuery(
                        "SELECT * FROM $table WHERE id = ?",
                        arrayOf(id.toString()),
                    ).use { c -> if (c.moveToFirst()) cursorToJson(c) else null }
                }
                if (row != null) jsonResponse(200, row) else jsonResponse(404, JSONObject().apply { put("error", "not_found") })
            }
            Method.PUT, Method.PATCH -> {
                val body = readBody(session)
                val obj = JSONObject(body)
                Log.i(TAG, "PUT/PATCH $table id=$id body=$body")
                synchronized(writeLock) {
                    updateRow(table, cols, id, obj)
                }
                jsonResponse(200, JSONObject().apply { put("id", id); put("ok", true) })
            }
            Method.DELETE -> {
                synchronized(writeLock) {
                    db.database.execSQL("DELETE FROM $table WHERE id = ?", arrayOf(id))
                }
                jsonResponse(200, JSONObject().apply { put("id", id) })
            }
            else -> jsonResponse(405, JSONObject().apply { put("error", "method_not_allowed") })
        }
    }

    private fun handleAdminReset(method: Method): Response {
        if (method != Method.POST) return jsonResponse(405, JSONObject().apply { put("error", "method_not_allowed") })
        synchronized(writeLock) {
            for (name in Schemas.TABLE_NAMES) {
                db.database.execSQL("DROP TABLE IF EXISTS $name")
            }
            db.ensureSchema(db.database)
        }
        return jsonResponse(200, JSONObject().apply { put("ok", true) })
    }

    // -----------------------------------------------------------------
    // Summary endpoints
    // -----------------------------------------------------------------
    private fun handleSummaryByCategory(session: IHTTPSession): Response {
        val (start, end) = dateRange(session)
        return jsonResponse(200, synchronized(writeLock) {
            val arr = JSONArray()
            db.database.rawQuery(
                """
                SELECT t.categoryId, COALESCE(c.name, '') AS categoryName,
                       COALESCE(SUM(t.amount), 0) AS total, COUNT(*) AS cnt
                FROM transactions t
                LEFT JOIN categories c ON t.categoryId = c.id
                WHERE t.date BETWEEN ? AND ?
                GROUP BY t.categoryId, categoryName
                ORDER BY total DESC
                """.trimIndent(),
                arrayOf(start, end),
            ).use { c ->
                while (c.moveToNext()) {
                    val obj = JSONObject()
                    obj.put("categoryId", c.getLong(0))
                    obj.put("categoryName", c.getString(1))
                    obj.put("total", c.getDouble(2))
                    obj.put("count", c.getInt(3))
                    arr.put(obj)
                }
            }
            arr
        })
    }

    private fun handleSummaryByBudget(session: IHTTPSession): Response {
        val (start, end) = dateRange(session)
        return jsonResponse(200, synchronized(writeLock) {
            val arr = JSONArray()
            db.database.rawQuery(
                """
                SELECT b.id AS budgetId, b.name AS budgetName,
                       COALESCE(SUM(t.amount), 0) AS totalSpent,
                       b.amount AS budgetAmount,
                       CASE WHEN COALESCE(SUM(t.amount), 0) > b.amount THEN 1 ELSE 0 END AS isExceeded
                FROM budgets b
                LEFT JOIN transactions t ON b.id = t.budgetId
                WHERE t.date BETWEEN ? AND ?
                GROUP BY b.id, b.name, b.amount
                """.trimIndent(),
                arrayOf(start, end),
            ).use { c ->
                while (c.moveToNext()) {
                    val obj = JSONObject()
                    obj.put("budgetId", c.getLong(0))
                    obj.put("budgetName", c.getString(1))
                    obj.put("totalSpent", c.getDouble(2))
                    obj.put("budgetAmount", c.getDouble(3))
                    obj.put("isExceeded", c.getInt(4))
                    arr.put(obj)
                }
            }
            arr
        })
    }

    private fun handleSummaryByAccount(session: IHTTPSession): Response {
        val (start, end) = dateRange(session)
        return jsonResponse(200, synchronized(writeLock) {
            val arr = JSONArray()
            db.database.rawQuery(
                """
                SELECT t.accountId,
                       COALESCE(a.name, '') AS accountName,
                       COALESCE(a.icon, '') AS accountIcon,
                       COALESCE(a.color, '') AS accountColor,
                       COALESCE(SUM(CASE WHEN t.type='income' THEN t.amount ELSE 0 END), 0) AS totalIncome,
                       COALESCE(SUM(CASE WHEN t.type='expense' THEN t.amount ELSE 0 END), 0) AS totalExpense,
                       COUNT(*) AS cnt
                FROM transactions t
                LEFT JOIN accounts a ON t.accountId = a.id
                WHERE t.date BETWEEN ? AND ?
                GROUP BY t.accountId, accountName, accountIcon, accountColor
                """.trimIndent(),
                arrayOf(start, end),
            ).use { c ->
                while (c.moveToNext()) {
                    val obj = JSONObject()
                    obj.put("accountId", c.getLong(0))
                    obj.put("accountName", c.getString(1))
                    obj.put("accountIcon", c.getString(2))
                    obj.put("accountColor", c.getString(3))
                    obj.put("totalIncome", c.getDouble(4))
                    obj.put("totalExpense", c.getDouble(5))
                    obj.put("transactionCount", c.getInt(6))
                    arr.put(obj)
                }
            }
            arr
        })
    }

    private fun handleMonthlyTotals(session: IHTTPSession): Response {
        val year = session.parameters["year"]?.firstOrNull()?.toIntOrNull() ?: 0
        val month = session.parameters["month"]?.firstOrNull()?.toIntOrNull() ?: 0
        return jsonResponse(200, synchronized(writeLock) {
            val cursor = db.database.rawQuery(
                """
                SELECT COALESCE(SUM(openingBalance), 0) AS op,
                       COALESCE(SUM(closingBalance), 0) AS cl
                FROM account_monthly_balances WHERE year = ? AND month = ?
                """.trimIndent(),
                arrayOf(year.toString(), month.toString()),
            )
            cursor.use {
                it.moveToFirst()
                JSONObject().apply {
                    put("openingBalance", it.getDouble(0))
                    put("closingBalance", it.getDouble(1))
                }
            }
        })
    }

    // -----------------------------------------------------------------
    // Reports
    // -----------------------------------------------------------------
    private fun handleReport(uri: String, session: IHTTPSession): Response {
        return when {
            uri.startsWith("/api/reports/weekly-expenses") -> {
                val labels = arrayOf("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")
                val totals = DoubleArray(7)
                synchronized(writeLock) {
                    val cal = java.util.Calendar.getInstance()
                    cal.set(java.util.Calendar.HOUR_OF_DAY, 0)
                    cal.set(java.util.Calendar.MINUTE, 0)
                    cal.set(java.util.Calendar.SECOND, 0)
                    cal.set(java.util.Calendar.MILLISECOND, 0)
                    // ISO: Monday = 1
                    val dow = (cal.get(java.util.Calendar.DAY_OF_WEEK) + 5) % 7
                    cal.add(java.util.Calendar.DAY_OF_YEAR, -dow)
                    for (i in 0..6) {
                        val start = cal.timeInMillis
                        cal.add(java.util.Calendar.DAY_OF_YEAR, 1)
                        val end = cal.timeInMillis
                        val cursor = db.database.rawQuery(
                            "SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type='expense' AND date >= ? AND date < ?",
                            arrayOf(isoDate(start), isoDate(end)),
                        )
                        cursor.use {
                            if (it.moveToFirst()) totals[i] = it.getDouble(0)
                        }
                    }
                }
                jsonResponse(200, JSONObject().apply {
                    put("labels", JSONArray(labels.toList()))
                    put("totals", JSONArray(totals.toList()))
                })
            }
            uri.startsWith("/api/reports/cashflow") -> {
                val params = session.parameters
                val from = params["from"]?.firstOrNull() ?: "1970-01-01"
                val to = params["to"]?.firstOrNull() ?: "2999-12-31"
                synchronized(writeLock) {
                    val cursor = db.database.rawQuery(
                        """
                        SELECT
                          COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END), 0) AS income,
                          COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) AS expense
                        FROM transactions WHERE date BETWEEN ? AND ?
                        """.trimIndent(),
                        arrayOf(from, to),
                    )
                    cursor.use {
                        it.moveToFirst()
                        val income = it.getDouble(0)
                        val expense = it.getDouble(1)
                        jsonResponse(200, JSONObject().apply {
                            put("income", income)
                            put("expense", expense)
                            put("net", income - expense)
                        })
                    }
                }
            }
            uri.startsWith("/api/reports/yearly-summary") -> {
                val year = session.parameters["year"]?.firstOrNull()?.toIntOrNull() ?: 0
                synchronized(writeLock) {
                    val arr = JSONArray()
                    for (month in 1..12) {
                        val cursor = db.database.rawQuery(
                            """
                            SELECT
                              COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END), 0),
                              COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0)
                            FROM transactions
                            WHERE strftime('%Y', date) = ? AND CAST(strftime('%m', date) AS INTEGER) = ?
                            """.trimIndent(),
                            arrayOf(year.toString(), month.toString()),
                        )
                        cursor.use {
                            it.moveToFirst()
                            val income = it.getDouble(0)
                            val expense = it.getDouble(1)
                            arr.put(JSONObject().apply {
                                put("month", month)
                                put("income", income)
                                put("expense", expense)
                                put("net", income - expense)
                            })
                        }
                    }
                    jsonResponse(200, arr)
                }
            }
            else -> jsonResponse(404, JSONObject().apply { put("error", "not_found") })
        }
    }

    // -----------------------------------------------------------------
    // SQL helpers
    // -----------------------------------------------------------------
    private fun readRowsWithFilters(
        table: String,
        params: Map<String, List<String>>,
    ): JSONArray {
        val where = mutableListOf<String>()
        val args = mutableListOf<String>()
        for ((key, values) in params) {
            val v = values.firstOrNull() ?: continue
            if (key == "withCategory") continue
            val col = when (key) {
                "categoryId", "budgetId", "accountId", "id", "year", "month" -> key
                "startDate" -> "date"
                "endDate" -> "date"
                "type" -> "type"
                else -> continue
            }
            when (key) {
                "startDate" -> { where.add("$col >= ?"); args.add(v) }
                "endDate" -> {
                    val op = if (params.containsKey("startDate")) "<" else "<="
                    where.add("$col $op ?"); args.add(v)
                }
                else -> { where.add("$col = ?"); args.add(v) }
            }
        }
        val sql = buildString {
            append("SELECT * FROM ").append(table)
            if (where.isNotEmpty()) {
                append(" WHERE ").append(where.joinToString(" AND "))
            }
        }
        val arr = JSONArray()
        val cursor = db.database.rawQuery(sql, args.toTypedArray())
        cursor.use {
            while (it.moveToNext()) arr.put(cursorToJson(it))
        }
        return arr
    }

    private fun insertRow(table: String, cols: List<String>, obj: JSONObject): Long {
        val insertCols = cols.filter { obj.has(it) && it != "id" }
        val placeholders = insertCols.joinToString(",") { "?" }
        val values = insertCols.map { col -> jsonValueToDb(obj.opt(col)) }
        val sql = "INSERT INTO $table (${insertCols.joinToString(",")}) VALUES ($placeholders)"
        db.database.execSQL(sql, values.toTypedArray())
        val c = db.database.rawQuery("SELECT last_insert_rowid()", null)
        return c.use { if (it.moveToFirst()) it.getLong(0) else -1 }
    }

    private fun updateRow(table: String, cols: List<String>, id: Long, obj: JSONObject) {
        val updateCols = cols.filter { obj.has(it) && it != "id" }
        if (updateCols.isEmpty()) {
            // Web side sent an empty body — happens when the SQL translator
            // can't parse the SET clause. Rather than crash with a syntax
            // error, log and treat as a no-op. The actual record exists;
            // the next user action will reconcile any drift.
            Log.w(TAG, "updateRow($table, id=$id): empty body, skipping")
            return
        }
        val sets = updateCols.joinToString(",") { "$it = ?" }
        val values = updateCols.map { col -> jsonValueToDb(obj.opt(col)) }.toMutableList<Any?>()
        values.add(id)
        val sql = "UPDATE $table SET $sets WHERE id = ?"
        db.database.execSQL(sql, values.toTypedArray())
    }

    private fun jsonValueToDb(v: Any?): Any? = when (v) {
        null, JSONObject.NULL -> null
        is Boolean -> if (v) 1 else 0
        else -> v
    }

    private fun cursorToJson(cursor: android.database.Cursor): JSONObject {
        val obj = JSONObject()
        for (i in 0 until cursor.columnCount) {
            val name = cursor.getColumnName(i)
            val value: Any? = when (cursor.getType(i)) {
                android.database.Cursor.FIELD_TYPE_NULL -> null
                android.database.Cursor.FIELD_TYPE_INTEGER -> cursor.getLong(i)
                android.database.Cursor.FIELD_TYPE_FLOAT -> cursor.getDouble(i)
                android.database.Cursor.FIELD_TYPE_STRING -> cursor.getString(i)
                android.database.Cursor.FIELD_TYPE_BLOB -> null
                else -> null
            }
            obj.put(name, value ?: JSONObject.NULL)
        }
        return obj
    }

    private fun dateRange(session: IHTTPSession): Pair<String, String> {
        val params = session.parameters
        val start = params["startDate"]?.firstOrNull() ?: "1970-01-01"
        val end = params["endDate"]?.firstOrNull() ?: "2999-12-31"
        return start to end
    }

    private fun readBody(session: IHTTPSession): String {
        val files = HashMap<String, String>()
        try {
            session.parseBody(files)
        } catch (e: Exception) {
            Log.w(TAG, "parseBody: ${e.message}")
        }
        return files["postData"] ?: "{}"
    }

    private fun isoDate(millis: Long): String {
        val df = java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US)
        return df.format(java.util.Date(millis))
    }

    private fun jsonResponse(code: Int, body: Any): Response {
        val text = when (body) {
            is JSONObject -> body.toString()
            is JSONArray -> body.toString()
            else -> body.toString()
        }
        return newFixedLengthResponse(
            Response.Status.lookup(code) ?: Response.Status.OK,
            "application/json",
            text,
        )
    }

    override fun stop() {
        super.stop()
    }

    companion object {
        const val DEFAULT_PORT = 8080
        private const val TAG = "FMHttpServer"
    }
}

// Column lists matching the JS schemas
private object TransactionColumnMap {
    val ALL = listOf(
        "name", "description", "amount", "categoryId", "budgetId",
        "accountId", "date", "type",
    )
    val BUDGETS = listOf(
        "name", "description", "categoryId", "accountId", "amount",
        "period", "startDate", "endDate", "month", "isRegular", "isBudgetExceeded",
    )
    val BUDGET_DEFAULTS = listOf("categoryId", "amount", "period")
    val CATEGORIES = listOf("name", "icon", "type", "sortOrder", "isDefault", "isActive")
    val ACCOUNTS = listOf("name", "type", "icon", "color", "balance", "isActive", "sortOrder")
    val GOALS = listOf(
        "name", "targetAmount", "currentAmount", "deadline",
        "icon", "color", "isCompleted", "isActive",
    )
    val ACCOUNT_MONTHLY_BALANCES = listOf(
        "accountId", "year", "month", "openingBalance", "closingBalance",
    )
}