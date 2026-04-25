# 数据库设计

## 数据库概述

应用使用 SQLite 作为本地数据库，通过 `expo-sqlite` 实现。

**数据库文件：**
- `FinanceManager.db` - 应用运行时数据库
- `finance_imported.db` - XLSX 导入生成的数据库

## ER 图

```
┌─────────────────┐       ┌─────────────────┐
│   categories    │       │    accounts     │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ name            │       │ name            │
│ icon            │       │ type            │
│ type            │       │ icon            │
│ sortOrder       │       │ color           │
│ isDefault       │       │ balance         │
│ isActive        │       │ isActive        │
│ createdAt       │       │ sortOrder       │
│ updatedAt       │       │ createdAt       │
└────────┬────────┘       │ updatedAt       │
         │                └─────────────────┘
         │
         ▼
┌─────────────────┐ ┌──────────────┴────────┐       ┌─────────────────────────────┐
│  transactions   │ │      budgets         │       │ account_monthly_balances │
├─────────────────┤ ├─────────────────────┤       ├─────────────────────────────┤
│ id (PK)         │ │ id (PK)              │       │ id (PK)                    │
│ name            ││ name                  │       │ accountId (FK)             │
│ description     ││ description           │◄──────│ year, month               │
│ amount          ││ categoryId (FK)        │       │ openingBalance              │
│ categoryId (FK) ││ accountId (FK, NULL)  │       │ closingBalance              │
│ budgetId (FK)   ││ amount               │       │ createdAt                   │
│ accountId (FK)  ││ period               │       │ updatedAt                   │
│ date            ││ startDate, endDate   │       └─────────────────────────────┘
│ type            ││ month (YYYY-MM)      │
│ createdAt       ││ isRegular            │
│ updatedAt       ││ isBudgetExceeded     │
└─────────────────┘│ createdAt, updatedAt │
                   └─────────────────────┘
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
- 1: 餐饮 🍜 (expense)
- 2: 交通 🚌 (expense)
- 3: 购物 🛍️ (expense)
- 4: 工资 💰 (income)
- 5: 家用 🏠 (expense)
- 6: 账单 🧾 (expense)
- 7: 医疗 🏥 (expense)
- 8: 零星 ⭐ (expense)

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
- 1: 现金 💵 (cash)
- 2: 银行账户 🏦 (bank)
- 3: 数字钱包 📱 (digital_wallet)

### transactions (交易表)

存储所有交易记录。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| name | TEXT | 交易名称 |
| description | TEXT | 描述/备注 |
| amount | REAL | 金额（正数） |
| categoryId | INTEGER | 外键 -> categories.id |
| budgetId | INTEGER | 外键 -> budgets.id |
| accountId | INTEGER | 外键 -> accounts.id |
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
| description | TEXT | 预算描述 |
| categoryId | INTEGER | 外键 -> categories.id |
| accountId | INTEGER | 外键 -> accounts.id (NULL表示全局预算) |
| amount | DECIMAL | 预算金额 |
| period | TEXT | 'daily', 'weekly', 'monthly', 'yearly' |
| startDate | TEXT | 开始日期 (YYYY-MM-DD) |
| endDate | TEXT | 结束日期 (YYYY-MM-DD) |
| month | TEXT | 所属月份 (YYYY-MM) |
| isRegular | BOOLEAN | 是否固定预算 |
| isBudgetExceeded | BOOLEAN | 是否超支 |
| createdAt | DATETIME | 创建时间 |
| updatedAt | DATETIME | 更新时间 |

**注意：** `accountId` 为 NULL 时表示全局预算，分配到所有账户。

### account_monthly_balances (账户月度余额表)

存储每个账户每月的余额快照。通过汇总各账户余额可得到月度总余额。

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

### 获取月度账户总余额

```sql
SELECT
  year,
  month,
  SUM(openingBalance) as totalOpeningBalance,
  SUM(closingBalance) as totalClosingBalance
FROM account_monthly_balances
GROUP BY year, month
ORDER BY year DESC, month DESC;
```

## 数据库迁移

当表结构需要变更时，使用 ALTER TABLE 迁移：

```sql
-- 示例：为 budgets 表添加新字段
ALTER TABLE budgets ADD COLUMN isRegular INTEGER DEFAULT 0;
ALTER TABLE budgets ADD COLUMN isBudgetExceeded INTEGER DEFAULT 0;
```

## XLSX 导入

详细导入说明请参考 [IMPORT_SCRIPT.md](./IMPORT_SCRIPT.md)

### 导入文件结构

**文件名格式：** `finance_record_YYMM.xlsx`
- `YY` = 年份后两位（25 = 2025）
- `MM` = 月份（01-12）
- 例如：`finance_record_2505.xlsx` = 2025年5月

**每个文件包含多个月份的数据**

### XLSX 导入简述

1. **transactions** - 从 `*_full` sheet 导入
   - name = C列 (general_name)
   - description = D列
   - categoryId = B列 (1-8)
   - accountId = 2 (银行账户)

2. **budgets** - 从 `*_rep` sheet 导入
   - name = D列 (budget_name)
   - description = E列
   - categoryId = B列 (1-8)
   - accountId = 2 (银行账户)
   - startDate = 月初
   - endDate = 月末

3. **account_monthly_balances** - 从 `*_rep` sheet 导入
   - accountId = 2 (银行账户)
   - openingBalance/closingBalance = C列/D列

详细映射见 [IMPORT_SCRIPT.md](./IMPORT_SCRIPT.md)