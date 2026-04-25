# XLSX 数据导入工具

## 概述

本工具用于将历史财务数据（存储在 Excel XLSX 文件中）批量导入到应用的 SQLite 数据库中。

**脚本位置：** `scripts/import_finance_xlsx.py`

## 功能特点

- 批量处理多个 XLSX 文件
- 自动合并分类（如果新文件中有新的分类，不会遗漏）
- 跳过重复交易记录
- 支持预算和银行余额导入
- 纯 Python 实现，无外部依赖（仅使用标准库）

## XLSX 文件结构

### 文件命名规则

```
finance_record_YY_S.xlsx
```

| 缩写 | 含义 | 示例 |
|------|------|------|
| YY | 年份（2位） | 26 = 2026年 |
| S | 季度 | 1=Q1 (1-3月), 2=Q2 (4-6月) |

### 工作表结构

每个 XLSX 文件包含以下工作表：

| 工作表名 | 内容 | 导入目标 |
|----------|------|----------|
| `param` | 分类定义 | categories 表 |
| `YYMM_full` | 该月完整交易记录 | transactions 表 |
| `YYMM_rep` | 该月报表（预算+余额） | budgets + bank_balances 表 |

### param 工作表格式

```
category_id | name | icon | type | sortOrder | isDefault | isActive
1          | 餐饮  |      | expense | 1      | 1        | 1
2          | 交通  |      | expense | 2      | 1        | 1
3          | 购物  |      | expense | 3      | 1        | 1
4          | 工资  |      | income  | 1      | 1        | 1
...
```

### YYMM_full 工作表格式

```
id | category_id | general_name | description | amount | income | expense | created_at
1  | 4          | 工资        | 工资        | 19950  | 1      |         | 260101-0800
2  | 5          | 家用        | 家用        | -7000  |        | 1       | 260101-0800
3  | 2          | 交通        | 交通        | -1244  |        | 1       | 260101-0800
...
```

**列说明：**
- `general_name`: 分类名称（用于映射到 categoryId）
- `description`: 交易描述
- `amount`: 金额（正数=收入，负数=支出）
- `income`: 1 表示这笔是收入
- `expense`: 1 表示这笔是支出
- `created_at`: 日期时间，格式 `YYMMDD-HHMM`

### YYMM_rep 工作表格式

```
bank_account_info | month | opening_balance | closing_balance | balance_at_the_moment | ...
                  | 2601  | 87708.12        | 97170.96        | 97170.96             | ...

budget_info | category_id | category_name | budget_name | description | amount | total_spent | remaining
            | 1          | 餐饮          | 2601饭钱    | 2601饭钱    | -1900  | -1494       | 406
            | 2          | 交通          | 2601交通    | 2601交通    | -1500.4| -1244       | 256.4
...
```

## 使用方法

### 基本用法

```bash
# 进入项目目录
cd /path/to/Finance-Management-App

# 运行导入脚本
python3 scripts/import_finance_xlsx.py
```

### 指定输出文件

```bash
python3 scripts/import_finance_xlsx.py custom_output.db
```

### 输出文件位置

默认输出文件位于项目根目录：
- `finance_imported.db`

## 处理逻辑

### 1. 分类合并

```python
for xlsx_file in xlsx_files:
    categories = extract_categories(sheets)
    name_to_id = merge_categories(conn, categories, existing_category_names)
```

**规则：**
- 如果分类名称已存在，跳过
- 如果分类名称不存在，插入新分类
- 使用分类名称作为唯一标识

### 2. 交易导入

```python
for tx in all_transactions:
    if not check_duplicate_transaction(conn, tx):
        cursor.execute(INSERT ...)
```

**规则：**
- 交易必须满足以下条件才能导入：
  - `amount` 不为 0
  - `general_name` 对应的分类存在
  - `created_at` 日期格式正确
- 重复判断基于：日期 + 金额 + 描述 + 类型

### 3. 预算导入

```python
for budget in all_budgets:
    key = (budget['name'], budget['categoryId'], budget['month'])
    if key not in seen_budgets:
        cursor.execute(INSERT OR IGNORE ...)
```

**规则：**
- 同一分类同一月份的预算只导入一次
- 使用 `INSERT OR IGNORE` 避免重复

### 4. 余额导入

```python
for sheet_name, (target, sheet_num) in sheets_raw.items():
    # Month from sheet name (e.g., '2507' -> July 2025)
    sheet_month_str = sheet_month_match.group(1)
    year = int(f"20{sheet_month_str[:2]}")
    month = int(sheet_month_str[2:4])

    for row in raw_data:
        # Take FIRST row where B column is a 4-digit month code
        if not a_val and b_val and len(b_val) == 4 and b_val.isdigit():
            already_extracted = any(bb['year'] == year and bb['month'] == month for bb in grand_balances)
            if not already_extracted:
                # C and D are current month's opening/closing
                grand_balances.append({...})
                account_balances.append({...})  # For default account
```

**规则：**
- Month is derived from sheet name (e.g., `2507_rep` → July 2025)
- B column in the first data row contains previous month's closing as opening
- Each `_rep` sheet provides ONE grand balance (opening from C, closing from D)
- Same data is also inserted into `account_balances` for the default account (accountId=1)
- Uses `INSERT OR REPLACE` via SQLite to handle duplicates across files

## 已知限制

### 1. 收入检测问题

由于 XLSX 文件结构问题，部分收入记录可能未正确识别为 income 类型。

**原因：** 某些行使用了 `expense` 列标记，但实际是辅助行（用于显示预算信息等），导致：
- 原始 income 交易可能丢失
- 部分 expense 交易被错误标记

**影响范围：** 仅限于 `finance_record_26_2.xlsx` 文件

### 2. 日期解析限制

只支持 20XX 年的日期（通过 `20{year_prefix}` 转换）。

### 3. 分类图标

XLSX 文件中 `icon` 列为空，导入时默认使用 `📦`。

## 数据验证

导入完成后，建议进行以下验证：

### 检查导入数量

```bash
sqlite3 finance_imported.db "
SELECT 'Categories:', COUNT(*) FROM categories
UNION ALL SELECT 'Transactions:', COUNT(*) FROM transactions
UNION ALL SELECT 'Budgets:', COUNT(*) FROM budgets
UNION ALL SELECT 'Grand Balances:', COUNT(*) FROM grand_balances
UNION ALL SELECT 'Account Balances:', COUNT(*) FROM account_balances;
"
```

**预期结果（基于现有文件）：**
- Categories: 8
- Transactions: ~295
- Budgets: ~73
- Grand Balances: ~12
- Account Balances: ~12

### 检查交易分布

```bash
sqlite3 finance_imported.db "
SELECT type, COUNT(*) as count FROM transactions GROUP BY type;
"
```

**预期结果：**
- expense: 大部分交易
- income: 少量收入交易

### 检查最近交易

```bash
sqlite3 finance_imported.db "
SELECT date, type, amount, c.name as category, description
FROM transactions t
JOIN categories c ON t.categoryId = c.id
ORDER BY date DESC LIMIT 10;
"
```

## 集成到应用

### 方法 1：替换数据库

```bash
# 备份原数据库
cp FinanceManager.db FinanceManager.db.backup

# 替换为导入的数据库
cp finance_imported.db FinanceManager.db
```

### 方法 2：使用调试界面导入

1. 打开应用，进入调试页面
2. 使用 SQL Terminal 执行导入

### 方法 3：合并数据

如果应用已有数据需要保留，可以使用 SQL 合并：

```sql
-- 导入前先备份
-- 然后使用 INSERT ... SELECT 合并
INSERT INTO categories SELECT * FROM imported_db.categories WHERE name NOT IN (SELECT name FROM categories);
INSERT INTO transactions SELECT * FROM imported_db.transactions WHERE id NOT IN (SELECT id FROM transactions);
```

## 故障排除

### 脚本报错 "No xlsx files found"

**原因：** `assets` 目录中没有找到符合命名规则的文件

**解决：** 确保文件命名符合 `finance_record_*.xlsx` 模式

### 导入数量为 0

**可能原因：**
1. XLSX 文件结构不匹配
2. 日期格式不正确
3. 分类名称无法映射

**解决：** 使用 debug 模式检查脚本输出

### 重复数据过多

**原因：** 多次运行导入脚本

**解决：** 脚本已包含重复检测逻辑，检查是否使用了 `finance_imported.db` 而非新的空数据库
