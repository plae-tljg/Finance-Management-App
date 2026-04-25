#!/usr/bin/env python3
"""
Batch XLSX to SQLite Converter for Finance Management App
Processes multiple xlsx files and produces a single SQLite database.
Usage: python import_finance_xlsx.py [output_db_path]
"""

import sqlite3
import zipfile
import xml.etree.ElementTree as ET
import re
import os
import sys
import calendar
from typing import Dict, List, Tuple, Optional


def parse_xlsx(filepath: str) -> Dict[str, List[Dict]]:
    """Parse xlsx file and return dict of sheet_name -> list of row dicts (using header row as keys)."""
    sheets = {}

    with zipfile.ZipFile(filepath, 'r') as zf:
        workbook_xml = zf.read('xl/workbook.xml')
        tree = ET.fromstring(workbook_xml)

        ns = {'ns': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
              'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}

        sheet_ids = {}
        for sheet in tree.findall('.//ns:sheet', ns):
            name = sheet.get('name')
            rel_id = sheet.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
            sheet_ids[name] = rel_id

        rels_xml = zf.read('xl/_rels/workbook.xml.rels')
        rels_tree = ET.fromstring(rels_xml)
        rels_ns = {'r': 'http://schemas.openxmlformats.org/package/2006/relationships'}

        id_to_target = {}
        for rel in rels_tree.findall('r:Relationship', rels_ns):
            id_to_target[rel.get('Id')] = rel.get('Target')

        shared_strings = []
        if 'xl/sharedStrings.xml' in zf.namelist():
            ss_xml = zf.read('xl/sharedStrings.xml')
            ss_tree = ET.fromstring(ss_xml)
            for si in ss_tree.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si'):
                text_parts = []
                for t in si.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t'):
                    if t.text:
                        text_parts.append(t.text)
                shared_strings.append(''.join(text_parts))

        for sheet_name, rel_id in sheet_ids.items():
            if rel_id not in id_to_target:
                continue
            target = id_to_target[rel_id]
            if not target.startswith('xl/'):
                target = 'xl/' + target

            if target not in zf.namelist():
                continue

            sheet_xml = zf.read(target)
            sheet_tree = ET.fromstring(sheet_xml)

            rows_data = []
            col_to_header = {}

            def get_cell_value_by_col(row_cells: List, col_letter: str) -> str:
                """Get cell value by column letter."""
                for cell in row_cells:
                    ref = cell.get('r', '')
                    if re.match(r'^' + col_letter, ref):
                        t = cell.get('t')
                        v = cell.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
                        if v is None or v.text is None:
                            return ''
                        if t == 's':
                            idx = int(v.text)
                            return shared_strings[idx] if idx < len(shared_strings) else ''
                        return v.text
                return ''

            for row in sheet_tree.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row'):
                row_cells = row.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c')
                if not row_cells:
                    continue

                if not col_to_header:
                    for cell in row_cells:
                        ref = cell.get('r', '')
                        col_match = re.match(r'([A-Z]+)', ref)
                        if not col_match:
                            continue
                        col = col_match.group(1)
                        # Only use columns A-I for transaction data (ignore J-T which are for grouping display)
                        if col > 'I':
                            continue
                        val = get_cell_value_by_col(row_cells, col)
                        col_to_header[col] = val if val else col
                    continue

                row_dict = {}
                for cell in row_cells:
                    ref = cell.get('r', '')
                    col_match = re.match(r'([A-Z]+)', ref)
                    if not col_match:
                        continue
                    col = col_match.group(1)
                    # Only use columns A-I for transaction data
                    if col > 'I':
                        continue
                    if col in col_to_header:
                        header = col_to_header[col]
                        val = get_cell_value_by_col(row_cells, col)
                        row_dict[header] = val.strip() if val else ''

                if row_dict:
                    rows_data.append(row_dict)

            sheets[sheet_name] = rows_data

    return sheets


def get_cell_value(row: Dict, col: str) -> str:
    """Get cell value safely."""
    return (row.get(col) or '').strip()


def get_last_day_of_month(year: int, month: int) -> str:
    """Get the last day of a month as YYYY-MM-DD string."""
    last_day = calendar.monthrange(year, month)[1]
    return f"{year}-{month:02d}-{last_day:02d}"


def parse_amount(amount_str: str) -> Optional[float]:
    """Parse amount safely."""
    try:
        return float(amount_str)
    except:
        return None


def is_income_row(row: Dict) -> bool:
    """Check if this row represents an income transaction."""
    income_val = get_cell_value(row, 'income')
    return income_val == '1' or income_val == 'True' or income_val == 'true'


def get_hardcoded_categories() -> List[Dict]:
    """Return hardcoded categories based on user's specification."""
    return [
        {'id': 1, 'name': '餐饮', 'icon': '🍜', 'type': 'expense', 'sortOrder': 1, 'isDefault': 0, 'isActive': 1},
        {'id': 2, 'name': '交通', 'icon': '🚗', 'type': 'expense', 'sortOrder': 2, 'isDefault': 0, 'isActive': 1},
        {'id': 3, 'name': '购物', 'icon': '🛒', 'type': 'expense', 'sortOrder': 3, 'isDefault': 0, 'isActive': 1},
        {'id': 4, 'name': '工资', 'icon': '💰', 'type': 'income', 'sortOrder': 4, 'isDefault': 0, 'isActive': 1},
        {'id': 5, 'name': '家用', 'icon': '🏠', 'type': 'expense', 'sortOrder': 5, 'isDefault': 0, 'isActive': 1},
        {'id': 6, 'name': '账单', 'icon': '📄', 'type': 'expense', 'sortOrder': 6, 'isDefault': 0, 'isActive': 1},
        {'id': 7, 'name': '医疗', 'icon': '🏥', 'type': 'expense', 'sortOrder': 7, 'isDefault': 0, 'isActive': 1},
        {'id': 8, 'name': '零星', 'icon': '⭐', 'type': 'expense', 'sortOrder': 8, 'isDefault': 0, 'isActive': 1},
    ]


def init_categories_in_db(conn: sqlite3.Connection) -> Dict[str, int]:
    """Initialize hardcoded categories in DB and return id->name mapping."""
    categories = get_hardcoded_categories()
    cursor = conn.cursor()
    name_to_id = {}
    for cat in categories:
        cursor.execute('''
            INSERT OR IGNORE INTO categories (id, name, icon, type, sortOrder, isDefault, isActive)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (cat['id'], cat['name'], cat['icon'], cat['type'], cat['sortOrder'], cat['isDefault'], cat['isActive']))
        name_to_id[cat['name']] = cat['id']
    conn.commit()
    return name_to_id


def parse_date(date_str: str) -> Optional[str]:
    """Convert date format like 260101-0800 to 2026-01-01 08:00:00."""
    if not date_str or len(date_str) < 7:
        return None
    try:
        year_prefix = date_str[:2]
        year = f"20{year_prefix}" if int(year_prefix) < 50 else f"19{year_prefix}"
        month = date_str[2:4]
        day = date_str[4:6]
        time_part = date_str[7:11] if len(date_str) > 7 else "0000"
        hour = time_part[:2]
        minute = time_part[2:4]
        return f"{year}-{month}-{day} {hour}:{minute}:00"
    except:
        return None


def extract_transactions(sheets: Dict[str, List[Dict]]) -> Tuple[List[Dict], Dict]:
    """
    Extract transactions from all *_full sheets.
    - Column B = category_id (1-8)
    - Column C = general_name (transaction name)
    - Column D = description
    - Column E = amount
    - Column F = income flag, Column G = expense flag
    - Column H = created_at (date)
    Returns (transactions, xlsx_counts).
    """
    transactions = []
    xlsx_counts = {'transactions': 0, 'skipped_no_id': 0, 'skipped_no_amount': 0, 'skipped_invalid_category': 0}

    for sheet_name, rows in sheets.items():
        if not sheet_name.endswith('_full'):
            continue

        sheet_tx_count = 0
        for row in rows:
            # Column A = id (must be numeric for real transaction)
            id_val = get_cell_value(row, 'id')
            if not id_val:
                xlsx_counts['skipped_no_id'] += 1
                continue
            try:
                int(id_val)
            except:
                xlsx_counts['skipped_no_id'] += 1
                continue

            # Column B = category_id
            category_id_str = get_cell_value(row, 'category_id')
            try:
                cat_id = int(category_id_str)
                if cat_id < 1 or cat_id > 8:
                    xlsx_counts['skipped_invalid_category'] += 1
                    continue
            except:
                xlsx_counts['skipped_invalid_category'] += 1
                continue

            # Column E = amount
            amount_str = get_cell_value(row, 'amount')
            amount = parse_amount(amount_str)
            if amount is None or amount == 0:
                xlsx_counts['skipped_no_amount'] += 1
                continue

            # Column C = general_name (transaction name)
            name = get_cell_value(row, 'general_name')
            if not name:
                name = 'Unknown'

            # Column D = description
            description = get_cell_value(row, 'description')
            if not description:
                description = name

            # Column H = created_at (date)
            date_str = get_cell_value(row, 'created_at')
            parsed_date = parse_date(date_str)
            if not parsed_date:
                xlsx_counts['skipped_no_id'] += 1
                continue

            # Column F = income flag, Column G = expense flag
            income = is_income_row(row)
            tx_type = 'income' if income else 'expense'

            transactions.append({
                'name': name,
                'amount': abs(amount),
                'categoryId': cat_id,
                'description': description,
                'date': parsed_date,
                'type': tx_type,
            })
            sheet_tx_count += 1

        xlsx_counts[sheet_name] = sheet_tx_count
        xlsx_counts['transactions'] += sheet_tx_count

    skip_total = xlsx_counts['skipped_no_id'] + xlsx_counts['skipped_no_amount'] + xlsx_counts['skipped_invalid_category']
    if skip_total > 0:
        print(f"  Skipped: {skip_total} rows (no_id={xlsx_counts['skipped_no_id']}, no_amount={xlsx_counts['skipped_no_amount']}, invalid_category={xlsx_counts['skipped_invalid_category']})")

    return transactions, xlsx_counts


def parse_rep_sheet(filepath: str, sheet_index: int) -> Dict[str, str]:
    """Parse a _rep sheet directly using column letters."""
    result = {}

    with zipfile.ZipFile(filepath, 'r') as zf:
        shared_strings = []
        if 'xl/sharedStrings.xml' in zf.namelist():
            ss_xml = zf.read('xl/sharedStrings.xml')
            ss_tree = ET.fromstring(ss_xml)
            for si in ss_tree.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si'):
                text_parts = []
                for t in si.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t'):
                    if t.text:
                        text_parts.append(t.text)
                shared_strings.append(''.join(text_parts))

        target = f'xl/worksheets/sheet{sheet_index}.xml'
        if target not in zf.namelist():
            return result

        sheet_xml = zf.read(target)
        sheet_tree = ET.fromstring(sheet_xml)

        for row in sheet_tree.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row'):
            row_num = row.get('r')
            cells = row.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c')

            row_data = {}
            for cell in cells:
                ref = cell.get('r', '')
                col_match = re.match(r'([A-Z]+)', ref)
                if not col_match:
                    continue
                col = col_match.group(1)
                t = cell.get('t')
                v = cell.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
                if v is not None and v.text is not None:
                    if t == 's':
                        idx = int(v.text)
                        val = shared_strings[idx] if idx < len(shared_strings) else ''
                    else:
                        val = v.text
                else:
                    val = ''
                row_data[col] = val

            result[f'row{row_num}'] = row_data

    return result


def extract_budgets_and_balances(xlsx_files: List[str], category_name_to_id: Dict[str, int]) -> Tuple[List[Dict], List[Dict], Dict]:
    """
    Extract budgets and monthly account balances from *_rep sheets.
    Returns (budgets, account_monthly_balances, xlsx_counts).
    """
    budgets = []
    account_monthly_balances = []
    xlsx_counts = {'budgets': 0, 'account_monthly_balances': 0}

    for xlsx_file in xlsx_files:
        sheets_raw = {}

        with zipfile.ZipFile(xlsx_file, 'r') as zf:
            workbook_xml = zf.read('xl/workbook.xml')
            tree = ET.fromstring(workbook_xml)
            ns = {'ns': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
                  'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}

            rels_xml = zf.read('xl/_rels/workbook.xml.rels')
            rels_tree = ET.fromstring(rels_xml)
            id_to_target = {}
            for rel in rels_tree:
                id_to_target[rel.get('Id')] = rel.get('Target')

            for sheet in tree.findall('.//ns:sheet', ns):
                name = sheet.get('name')
                if name.endswith('_rep'):
                    rid = sheet.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
                    target = id_to_target.get(rid, '')
                    if not target.startswith('xl/'):
                        target = 'xl/' + target
                    match = re.search(r'sheet(\d+)\.xml', target)
                    sheet_num = int(match.group(1)) if match else 0
                    sheets_raw[name] = (target, sheet_num)

        for sheet_name, (target, sheet_num) in sheets_raw.items():
            raw_data = parse_rep_sheet(xlsx_file, sheet_num)

            sheet_month_match = re.match(r'^(\d{4})', sheet_name)
            if not sheet_month_match:
                continue
            sheet_month_str = sheet_month_match.group(1)
            year = int(f"20{sheet_month_str[:2]}")
            month = int(sheet_month_str[2:4])

            in_budget_section = False
            sheet_budget_count = 0
            for row_key in sorted(raw_data.keys(), key=lambda x: int(x.replace('row', ''))):
                row = raw_data[row_key]
                a_val = row.get('A', '')
                b_val = row.get('B', '')
                c_val = row.get('C', '')

                if 'budget_info' in (a_val or '').lower():
                    in_budget_section = True
                    continue
                elif a_val:
                    in_budget_section = False
                    continue

                if in_budget_section and b_val and b_val.isdigit():
                    cat_id = int(b_val) if b_val.isdigit() else None
                    budget_name = row.get('D', '')  # Column D = budget_name
                    description = row.get('E', '')  # Column E = description
                    budget_amount = parse_amount(row.get('F', ''))  # Column F = amount

                    if cat_id and budget_amount:
                        start_date = f"{year}-{month:02d}-01"
                        end_date = get_last_day_of_month(year, month)

                        budgets.append({
                            'name': budget_name if budget_name else c_val,
                            'description': description if description else budget_name,
                            'categoryId': cat_id,
                            'accountId': 2,  # bank account
                            'amount': abs(budget_amount),
                            'period': 'monthly',
                            'startDate': start_date,
                            'endDate': end_date,
                            'month': f"{year}-{month:02d}",
                            'isRegular': 1,
                            'isBudgetExceeded': 0,
                        })
                        sheet_budget_count += 1

                # Extract bank balance (opening/closing balance) from _rep sheet
                if not a_val and b_val and len(b_val) == 4 and b_val.isdigit():
                    c_val_num = parse_amount(row.get('C', ''))
                    d_val_num = parse_amount(row.get('D', ''))
                    if c_val_num is not None and d_val_num is not None:
                        account_monthly_balances.append({
                            'accountId': 2,  # bank account
                            'year': year,
                            'month': month,
                            'openingBalance': c_val_num,
                            'closingBalance': d_val_num,
                        })

            xlsx_counts[sheet_name + '_budgets'] = sheet_budget_count
            xlsx_counts['budgets'] += sheet_budget_count

    xlsx_counts['account_monthly_balances'] = len(account_monthly_balances)
    return budgets, account_monthly_balances, xlsx_counts


def create_database(db_path: str) -> sqlite3.Connection:
    """Create and initialize database schema matching the app's schema."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            icon TEXT NOT NULL DEFAULT '📦',
            type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
            sortOrder INTEGER DEFAULT 0,
            isDefault INTEGER DEFAULT 0,
            isActive INTEGER DEFAULT 1,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT NOT NULL CHECK(type IN ('cash', 'bank', 'digital_wallet', 'savings', 'other')),
            icon TEXT NOT NULL DEFAULT '💵',
            color TEXT NOT NULL DEFAULT '#34C759',
            balance DECIMAL(10,2) DEFAULT 0,
            isActive INTEGER DEFAULT 1,
            sortOrder INTEGER DEFAULT 0,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    cursor.execute('''
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
    ''')

    cursor.execute('''
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
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS account_monthly_balances (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            accountId INTEGER NOT NULL,
            year INTEGER NOT NULL,
            month INTEGER NOT NULL,
            openingBalance DECIMAL(10,2) NOT NULL,
            closingBalance DECIMAL(10,2) NOT NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(accountId, year, month),
            FOREIGN KEY (accountId) REFERENCES accounts(id)
        )
    ''')

    # Insert default accounts
    cursor.execute('INSERT OR IGNORE INTO accounts (name, type, icon, color, balance) VALUES (?, ?, ?, ?, ?)',
                   ('现金', 'cash', '💵', '#34C759', 0))
    cursor.execute('INSERT OR IGNORE INTO accounts (name, type, icon, color, balance) VALUES (?, ?, ?, ?, ?)',
                   ('银行账户', 'bank', '🏦', '#007AFF', 0))
    cursor.execute('INSERT OR IGNORE INTO accounts (name, type, icon, color, balance) VALUES (?, ?, ?, ?, ?)',
                   ('数字钱包', 'digital_wallet', '📱', '#5856D6', 0))

    conn.commit()
    return conn


def get_sqlite_row_counts(conn: sqlite3.Connection) -> Dict[str, int]:
    """Get row counts for each table in SQLite."""
    cursor = conn.cursor()
    counts = {}
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    for (table_name,) in cursor.fetchall():
        if table_name.startswith('sqlite_'):
            continue
        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        counts[table_name] = cursor.fetchone()[0]
    return counts


def print_comparison(xlsx_counts: Dict[str, int], sqlite_counts: Dict[str, int], sqlite_conn: sqlite3.Connection = None):
    """Print comparison of XLSX vs SQLite row counts."""
    print(f"\n{'='*60}")
    print("XLSX vs SQLite ROW COUNT COMPARISON")
    print(f"{'='*60}")

    direct_compare_tables = ['categories', 'transactions', 'budgets', 'account_monthly_balances', 'accounts']

    print("\n--- Direct Table Comparison ---")
    for table in direct_compare_tables:
        xlsx_count = xlsx_counts.get(table, 0)
        sqlite_count = sqlite_counts.get(table, 0)
        status = "✓ MATCH" if xlsx_count == sqlite_count else "✗ MISMATCH"
        print(f"  {table:30} XLSX={xlsx_count:5}  SQLite={sqlite_count:5}  [{status}]")

    print("\n--- Per-Sheet XLSX Breakdown (for debugging) ---")
    sheet_keys = sorted([k for k in xlsx_counts.keys() if k not in direct_compare_tables])
    for key in sheet_keys:
        print(f"  {key:30} XLSX={xlsx_counts[key]:5}")

    if sqlite_conn:
        print("\n--- Transactions per Month (SQLite) ---")
        cursor = sqlite_conn.cursor()
        try:
            cursor.execute('''
                SELECT strftime('%Y-%m', date) as month, COUNT(*) as count
                FROM transactions
                GROUP BY month
                ORDER BY month
            ''')
            for row in cursor.fetchall():
                print(f"  {row[0]}: {row[1]} transactions")
        except:
            pass

    print(f"{'='*60}\n")


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    assets_dir = os.path.join(script_dir, '..', 'assets', 'records')
    output_db = os.path.join(script_dir, '..', 'finance_imported.db')

    if len(sys.argv) > 1:
        output_db = sys.argv[1]

    xlsx_files = sorted([
        os.path.join(assets_dir, f)
        for f in os.listdir(assets_dir)
        if f.endswith('.xlsx') and f.startswith('finance_record')
    ])

    if not xlsx_files:
        print("No xlsx files found in assets directory.")
        return

    print(f"Found {len(xlsx_files)} xlsx files:")
    for f in xlsx_files:
        print(f"  - {os.path.basename(f)}")

    if os.path.exists(output_db):
        os.remove(output_db)
        print(f"Removed existing output file: {output_db}")

    conn = create_database(output_db)
    cursor = conn.cursor()

    total_categories = 0
    total_transactions = 0
    total_budgets = 0
    total_balances = 0
    all_transactions = []
    all_budgets = []
    all_account_monthly_balances = []

    total_xlsx_counts = {}

    # Step 1: Initialize hardcoded categories
    name_to_id = init_categories_in_db(conn)
    total_categories = len(name_to_id)
    total_xlsx_counts['categories'] = total_categories
    print(f"\nInitialized {total_categories} hardcoded categories: {name_to_id}")

    # Step 2: Extract budgets first (before transactions, so we can match budgetId)
    print("\n" + "="*50)
    print("Extracting budgets and monthly balances...")
    budgets, account_monthly_balances, xlsx_counts = extract_budgets_and_balances(xlsx_files, name_to_id)
    for k, v in xlsx_counts.items():
        total_xlsx_counts[k] = total_xlsx_counts.get(k, 0) + v

    print(f"  Found {len(budgets)} budgets, {len(account_monthly_balances)} account monthly balances")

    all_budgets.extend(budgets)
    all_account_monthly_balances.extend(account_monthly_balances)

    # Build categoryId -> budgetId mapping for later use
    category_month_to_budget_id = {}
    print("\nInserting budgets...")
    for budget in all_budgets:
        if budget['categoryId'] is None:
            continue
        try:
            cursor.execute('''
                INSERT INTO budgets (name, description, categoryId, accountId, amount, period, startDate, endDate, month, isRegular, isBudgetExceeded)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (budget['name'], budget['description'], budget['categoryId'], budget['accountId'],
                  budget['amount'], budget['period'], budget['startDate'], budget['endDate'],
                  budget['month'], budget['isRegular'], budget['isBudgetExceeded']))
            budget_id = cursor.lastrowid
            key = (budget['categoryId'], budget['month'])
            category_month_to_budget_id[key] = budget_id
            total_budgets += 1
        except Exception as e:
            print(f"    Budget insert error: {e}")

    conn.commit()
    print(f"  Inserted {total_budgets} budgets")

    # Get default budget ID (category 3 - purchasing)
    DEFAULT_BUDGET_ID = category_month_to_budget_id.get((3, None), 1)
    print(f"  Default budget ID for unmatched: {DEFAULT_BUDGET_ID}")

    # Step 3: Extract transactions with budget matching
    print("\n" + "="*50)
    print("Extracting transactions...")
    for xlsx_file in xlsx_files:
        sheets = parse_xlsx(xlsx_file)
        transactions, tx_counts = extract_transactions(sheets)
        for k, v in tx_counts.items():
            total_xlsx_counts[k] = total_xlsx_counts.get(k, 0) + v

        print(f"  Found {len(transactions)} transactions from {os.path.basename(xlsx_file)}")
        all_transactions.extend(transactions)

    # Step 4: Insert transactions with matched budgetId
    print(f"\nInserting transactions...")
    for tx in all_transactions:
        tx_date = tx['date']
        tx_month = tx_date[:7]  # 'YYYY-MM'
        budget_id = category_month_to_budget_id.get((tx['categoryId'], tx_month), DEFAULT_BUDGET_ID)

        try:
            cursor.execute('''
                INSERT INTO transactions (name, description, amount, categoryId, budgetId, accountId, date, type)
                VALUES (?, ?, ?, ?, ?, 2, ?, ?)
            ''', (tx['name'], tx['description'], tx['amount'], tx['categoryId'], budget_id, tx['date'], tx['type']))
            total_transactions += 1
        except Exception as e:
            print(f"    Transaction insert error: {e}")

    print(f"  Inserted {total_transactions} transactions")

    # Step 5: Insert account monthly balances
    print(f"\nInserting account monthly balances...")
    for balance in all_account_monthly_balances:
        try:
            cursor.execute('''
                INSERT OR REPLACE INTO account_monthly_balances (accountId, year, month, openingBalance, closingBalance)
                VALUES (?, ?, ?, ?, ?)
            ''', (balance['accountId'], balance['year'], balance['month'],
                  balance['openingBalance'], balance['closingBalance']))
            total_balances += 1
        except Exception as e:
            print(f"    Balance insert error: {e}")

    conn.commit()

    print(f"\n{'='*50}")
    print(f"Import completed!")
    print(f"Output database: {output_db}")
    print(f"Categories imported: {total_categories}")
    print(f"Transactions imported: {total_transactions}")
    print(f"Budgets imported: {total_budgets}")
    print(f"Account monthly balances imported: {total_balances}")

    sqlite_counts = get_sqlite_row_counts(conn)
    print_comparison(total_xlsx_counts, sqlite_counts, conn)

    conn.close()


if __name__ == '__main__':
    main()