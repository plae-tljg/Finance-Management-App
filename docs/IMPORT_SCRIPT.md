# Finance Data Import Script

## Overview

`import_finance_xlsx.py` is a Python script that batch imports financial data from multiple XLSX files into a SQLite database. It processes finance records exported from the app and creates a database compatible with the Finance Management App.

## Usage

```bash
# Basic usage - outputs to finance_imported.db in project root
python3 scripts/import_finance_xlsx.py

# Custom output path
python3 scripts/import_finance_xlsx.py /path/to/output.db
```

## Excel File Format

### File Naming
- Files must be named `finance_record_*.xlsx` (e.g., `finance_record_25_2.xlsx`, `finance_record_26_1.xlsx`)
- Located in `assets/records/` directory

### Required Sheets

#### 1. `*_full` Sheet (Transaction Records)

Contains individual transaction records. Multiple `*_full` sheets per file are supported.

| Column | Header | Description | Example |
|--------|--------|-------------|---------|
| A | id | Unique transaction ID (numeric) | 1, 2, 3... |
| B | category_id | Category ID (1-8) | 1=餐饮, 2=交通, 3=购物, 4=工资, 5=家用, 6=账单, 7=医疗, 8=零星 |
| C | general_name | Transaction name | 餐饮, 购物, 工资 |
| D | description | Detailed description | 午饭, 淘宝衣物, 晚饭 |
| E | amount | Transaction amount (negative for expense) | -450, 19950 |
| F | income | Income flag (1=true) | 1 or empty |
| G | expense | Expense flag (1=true) | 1 or empty |
| H | created_at | Date/time (YYMMDD-HHMM format) | 250516-1937 |

**Note:** Columns J-T contain visual grouping data and are ignored.

#### 2. `*_rep` Sheet (Monthly Report)

Contains monthly budget and balance information.

**Bank Balance Section (Row 1-2):**
| Column | Header | Description |
|--------|--------|-------------|
| B | month | Month code | 2505, 2506 |
| C | opening_balance | Opening balance |
| D | closing_balance | Closing balance |

**Budget Section (starts at row with `budget_info`):**
| Column | Header | Description |
|--------|--------|-------------|
| B | category_id | Category ID |
| C | category_name | Category name (informational) |
| D | budget_name | Budget name |
| E | description | Budget description |
| F | amount | Budget amount |
| G | total_spent | Total spent (informational) |
| H | remaining | Remaining (informational) |

#### 3. `param` Sheet (Optional - Not Used)

Category definitions are hardcoded in the script, so this sheet is not used.

## Categories (Hardcoded)

The script uses these 8 predefined categories:

| ID | Name | Type |
|----|------|------|
| 1 | 餐饮 | expense |
| 2 | 交通 | expense |
| 3 | 购物 | expense |
| 4 | 工资 | income |
| 5 | 家用 | expense |
| 6 | 账单 | expense |
| 7 | 医疗 | expense |
| 8 | 零星 | expense |

## Output Database Schema

The script creates a SQLite database with these tables:

### categories
```sql
id, name, icon, type, sortOrder, isDefault, isActive, createdAt, updatedAt
```

### accounts
```sql
id, name, type, icon, color, balance, isActive, sortOrder, createdAt, updatedAt
```
- Pre-populated with: 现金 (cash), 银行账户 (bank), 数字钱包 (digital_wallet)

### transactions
```sql
id, name, description, amount, categoryId, budgetId, accountId, date, type, createdAt, updatedAt
```
- `accountId` = 2 (bank account) for all imported transactions
- `budgetId` matched by category and month, defaults to category 3's budget

### budgets
```sql
id, name, description, categoryId, accountId, amount, period, startDate, endDate, month, isRegular, isBudgetExceeded, createdAt, updatedAt
```
- `accountId` = 2 (bank account)
- `startDate` = first day of month
- `endDate` = last day of month

### account_monthly_balances
```sql
id, accountId, year, month, openingBalance, closingBalance, createdAt, updatedAt
```
- `accountId` = 2 (bank account)

## Debugging Output

The script prints a comparison table showing XLSX row counts vs SQLite row counts:

```
============================================================
XLSX vs SQLite ROW COUNT COMPARISON
============================================================
--- Direct Table Comparison ---
  categories                     XLSX=    8  SQLite=    8  [✓ MATCH]
  transactions                   XLSX=  414  SQLite=  414  [✓ MATCH]
  budgets                        XLSX=   73  SQLite=   73  [✓ MATCH]
  account_monthly_balances       XLSX=   24  SQLite=   12  [✗ MISMATCH]
  accounts                       XLSX=    0  SQLite=    3  [✗ MISMATCH]

--- Per-Sheet XLSX Breakdown (for debugging) ---
  2505_full                      XLSX=   37
  2505_rep_budgets               XLSX=    6
  ...
```

## Troubleshooting

### Mismatch: account_monthly_balances
- XLSX shows 24 but SQLite shows 12
- This is normal - duplicate months across multiple XLSX files are merged via `INSERT OR REPLACE`

### Skipped Transactions
The script reports skipped rows:
- `no_id`: Rows without numeric ID (grouping rows)
- `no_amount`: Rows with empty or zero amount
- `invalid_category`: Rows with category_id outside 1-8 range

### All transactions have accountId=2 (bank)
This is by design - all imported transactions are assigned to the bank account.
