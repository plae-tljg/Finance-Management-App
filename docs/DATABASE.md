# 数据库设计

## 数据库概述

应用使用 SQLite 作为本地数据库，通过 `expo-sqlite` 实现。

**数据库文件：**
- `FinanceManager.db` - 应用运行时数据库
- `finance_imported.db` - XLSX 导入生成的数据库

## ER 图

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────────┐
│   categories    │       │    accounts     │       │  account_balances  │
├─────────────────┤       ├─────────────────┤       ├─────────────────────┤
│ id (PK)         │       │ id (PK)         │◄──────│ accountId (FK)     │
│ name            │       │ name            │       │ year, month        │
│ icon            │       │ type            │       │ openingBalance      │
│ type            │       │ icon            │       │ closingBalance      │
│ sortOrder       │       │ color           │       └─────────────────────┘
│ isDefault       │       │ balance         │
│ isActive        │       │ isActive        │                ▲
│ createdAt       │       │ sortOrder       │                │
│ updatedAt       │       │ createdAt        │       ┌────────┴────────┐
└────────┬────────┘       │ updatedAt       │       │  grand_balances  │
         │                └─────────────────┘       ├─────────────────────┤
         │                         │                │ year, month         │
         │                         │                │ openingBalance      │
         ▼                         │                │ closingBalance      │
┌─────────────────┐ ┌──────────────┴────────┐       └─────────────────────┘
│  transactions   │ │      budgets         │
├─────────────────┤ ├─────────────────────┤
│ id (PK)         │ │ id (PK)              │
│ amount          │◄│ categoryId (FK)      │
│ categoryId (FK) │ │ accountId (FK, NULL) │
│ budgetId (FK)   │ │ amount               │
│ accountId (FK)  │ │ period               │
│ description     │ │ startDate, endDate   │
│ date            │ │ month (YYYY-MM)      │
│ type            │ │ isRegular, isBudgetExceeded
│ createdAt       │ │ createdAt, updatedAt  │
└─────────────────┘ └─────────────────────┘
```

## 表结构详解

### categories (分类表)

存储收入和支出分类。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| name | TEXT | 分类名称 |
| icon | TEXT | 图标（emoji） |
| type | TEXT | 'income' 或 'expense' |
| sortOrder | INTEGER | 排序顺序 |
| isDefault | BOOLEAN | 是否默认分类 |
| isActive | BOOLEAN | 是否启用 |
| createdAt | DATETIME | 创建时间 |
| updatedAt | DATETIME | 更新时间 |

**默认分类：**
- 餐饮 🍚 (expense)
- 交通 🚌 (expense)
- 购物 🛍️ (expense)
- 工资 💰 (income)
- 家用 🧓 (expense)
- 账单 🧾 (expense)
- 医疗 (expense)
- 零星 (expense)

### accounts (账户表)

存储账户信息。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| name | TEXT | 账户名称 |
| type | TEXT | 'cash', 'bank', 'digital_wallet', 'savings', 'other' |
| icon | TEXT | 图标（emoji） |
| color | TEXT | 颜色代码 |
| balance | DECIMAL | 余额 |
| isActive | BOOLEAN | 是否启用 |
| sortOrder | INTEGER | 排序顺序 |
| createdAt | DATETIME | 创建时间 |
| updatedAt | DATETIME | 更新时间 |

**默认账户：**
- 现金 💵 (cash)
- 银行账户 🏦 (bank)
- 数字钱包 📱 (digital_wallet)

### transactions (交易表)

存储所有交易记录。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| amount | REAL | 金额（正数） |
| categoryId | INTEGER | 外键 -> categories.id |
| budgetId | INTEGER | 外键 -> budgets.id |
| accountId | INTEGER | 外键 -> accounts.id |
| description | TEXT | 描述/备注 |
| date | DATETIME | 交易日期 |
| type | TEXT | 'income' 或 'expense' |
| createdAt | DATETIME | 创建时间 |
| updatedAt | DATETIME | 更新时间 |

**索引：**
- `idx_transactions_date` - 按日期索引
- `idx_transactions_categoryId` - 按分类索引
- `idx_transactions_budgetId` - 按预算索引
- `idx_transactions_accountId` - 按账户索引
- `idx_transactions_type` - 按类型索引

### budgets (预算表)

存储预算信息。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| name | TEXT | 预算名称 |
| categoryId | INTEGER | 外键 -> categories.id |
| accountId | INTEGER | 外键 -> accounts.id (NULL表示全局预算) |
| amount | DECIMAL | 预算金额 |
| period | TEXT | 'daily', 'weekly', 'monthly', 'yearly' |
| startDate | TEXT | 开始日期 |
| endDate | TEXT | 结束日期 |
| month | TEXT | 所属月份 (YYYY-MM) |
| isRegular | BOOLEAN | 是否固定预算 |
| isBudgetExceeded | BOOLEAN | 是否超支 |
| createdAt | DATETIME | 创建时间 |
| updatedAt | DATETIME | 更新时间 |

**注意：** `accountId` 为 NULL 时表示全局预算，分配到所有账户。

### grand_balances (总体余额表)

存储每月所有账户的总余额快照。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| year | INTEGER | 年份 |
| month | INTEGER | 月份 |
| openingBalance | DECIMAL | 月初总余额（所有账户之和） |
| closingBalance | DECIMAL | 月末总余额 |
| createdAt | DATETIME | 创建时间 |
| updatedAt | DATETIME | 更新时间 |

**唯一约束：** `(year, month)` 唯一

### account_balances (账户余额表)

存储每个账户每月的余额快照。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| accountId | INTEGER | 外键 -> accounts.id |
| year | INTEGER | 年份 |
| month | INTEGER | 月份 |
| openingBalance | DECIMAL | 月初余额 |
| closingBalance | DECIMAL | 月末余额 |
| createdAt | DATETIME | 创建时间 |
| updatedAt | DATETIME | 更新时间 |

**唯一约束：** `(accountId, year, month)` 唯一

## SQL 查询示例

### 统计某月支出

```sql
SELECT COALESCE(SUM(amount), 0) as total
FROM transactions
WHERE type = 'expense'
  AND date BETWEEN '2026-01-01' AND '2026-01-31';
```

### 按分类统计支出

```sql
SELECT
  t.categoryId,
  c.name as categoryName,
  COALESCE(SUM(t.amount), 0) as total,
  COUNT(*) as count
FROM transactions t
LEFT JOIN categories c ON t.categoryId = c.id
WHERE t.date BETWEEN '2026-01-01' AND '2026-01-31'
GROUP BY t.categoryId, c.name
ORDER BY total DESC;
```

### 预算执行情况

```sql
SELECT
  b.id as budgetId,
  b.name as budgetName,
  COALESCE(SUM(t.amount), 0) as totalSpent,
  b.amount as budgetAmount,
  CASE
    WHEN COALESCE(SUM(t.amount), 0) > b.amount THEN 1
    ELSE 0
  END as isExceeded
FROM budgets b
LEFT JOIN transactions t ON b.id = t.budgetId
WHERE t.date BETWEEN '2026-01-01' AND '2026-01-31'
GROUP BY b.id, b.name, b.amount;
```

### 账户收支统计

```sql
SELECT
  t.accountId,
  a.name as accountName,
  COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as totalIncome,
  COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as totalExpense,
  COUNT(*) as transactionCount
FROM transactions t
LEFT JOIN accounts a ON t.accountId = a.id
WHERE t.date BETWEEN '2026-01-01' AND '2026-01-31'
GROUP BY t.accountId, a.name, a.icon, a.color;
```

## 数据库迁移

当表结构需要变更时，使用 ALTER TABLE 迁移：

```sql
-- 示例：为 budgets 表添加新字段
ALTER TABLE budgets ADD COLUMN isRegular INTEGER DEFAULT 0;
ALTER TABLE budgets ADD COLUMN isBudgetExceeded INTEGER DEFAULT 0;
```

## XLSX 导入数据结构映射

### XLSX param sheet -> categories 表

| XLSX 列 | 数据库字段 |
|---------|-----------|
| category_id | (忽略，使用自动增量) |
| name | name |
| icon | icon (空则默认为 📦) |
| type | type (1=income, 0=expense) |
| sortOrder | sortOrder |
| isDefault | isDefault |
| isActive | isActive |

### XLSX YYMM_full sheet -> transactions 表

| XLSX 列 | 数据库字段 | 说明 |
|---------|-----------|------|
| id | (忽略) | XLSX内部ID |
| category_id | (忽略) | 来自旧系统 |
| general_name | (通过name映射) | 分类名称 -> categoryId |
| description | description | 交易描述 |
| amount | amount | 金额（负数为支出） |
| income | (用于判断) | 1=收入 |
| expense | (用于判断) | 1=支出 |
| created_at | date | 格式 260101-0800 -> 2026-01-01 08:00:00 |

### XLSX YYMM_rep sheet -> budgets + grand_balances / account_balances

**bank_account_info 部分 -> grand_balances + account_balances 表：**

| XLSX 位置 | 数据库字段 |
|----------|-----------|
| Sheet名 (如 2507) | year, month (从工作表名称提取) |
| C2 (opening_balance) | openingBalance |
| D2 (closing_balance) | closingBalance |

每个 `_rep` 工作表提供当月的总体余额，同时也会为默认账户(accountId=1)创建账户余额记录。

**budget_info 部分 -> budgets 表：**

| XLSX 位置 | 数据库字段 |
|----------|-----------|
| B列 (category_id) | (用于映射 categoryId) |
| C列 (category_name) | (通过name查找 categoryId) |
| F列 (amount) | amount |
| 月份 | month (YYYY-MM格式) |
