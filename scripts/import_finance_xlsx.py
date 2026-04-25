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

        def col_letter_to_index(col: str) -> int:
            """Convert column letter to 0-based index."""
            result = 0
            for char in col:
                result = result * 26 + (ord(char) - ord('A') + 1)
            return result - 1

        def get_cell_value(row_cells: List, col_idx: int) -> str:
            """Get cell value by column index."""
            if col_idx < len(row_cells):
                cell = row_cells[col_idx]
                cell_type = cell.get('t')
                value_elem = cell.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
                if value_elem is None or value_elem.text is None:
                    return ''
                if cell_type == 's':
                    idx = int(value_elem.text)
                    return shared_strings[idx] if idx < len(shared_strings) else ''
                return value_elem.text
            return ''

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


def extract_categories(sheets: Dict[str, List[Dict]]) -> Tuple[List[Dict], Dict]:
    """Extract categories from param sheet. Returns (categories, xlsx_counts)."""
    categories = []
    xlsx_counts = {'categories': 0}

    if 'param' not in sheets:
        print(f"  WARNING: 'param' sheet not found. Available sheets: {list(sheets.keys())}")
        return categories, xlsx_counts

    for row in sheets['param']:
        name = get_cell_value(row, 'name')
        if not name:
            continue
        cat_type = get_cell_value(row, 'type')
        if cat_type == '1':
            cat_type = 'income'
        elif cat_type == '0' or not cat_type:
            cat_type = 'expense'

        categories.append({
            'name': name,
            'icon': get_cell_value(row, 'icon') or '📦',
            'type': cat_type,
            'sortOrder': parse_amount(get_cell_value(row, 'sortOrder')) or 0,
            'isDefault': get_cell_value(row, 'isDefault') in ('1', 'true', 'True'),
            'isActive': get_cell_value(row, 'isActive') in ('1', 'true', 'True'),
        })

    xlsx_counts['categories'] = len(categories)
    return categories, xlsx_counts


def extract_transactions(sheets: Dict[str, List[Dict]], category_name_to_id: Dict[str, int], debug: bool = False) -> Tuple[List[Dict], Dict]:
    """Extract transactions from all *_full sheets. Returns (transactions, xlsx_counts)."""
    transactions = []
    xlsx_counts = {'transactions': 0}
    skip_reasons = {'no_amount': 0, 'no_category': 0, 'category_not_found': 0, 'no_date': 0, 'bad_id': 0}

    for sheet_name, rows in sheets.items():
        if not sheet_name.endswith('_full'):
            continue

        sheet_tx_count = 0
        for row in rows:
            id_val = get_cell_value(row, 'id')
            if id_val and not id_val.startswith('row'):
                try:
                    int(id_val)
                except:
                    skip_reasons['bad_id'] += 1
                    if debug:
                        print(f"    SKIP bad_id: {id_val}")
                    continue

            amount_str = get_cell_value(row, 'amount')
            amount = parse_amount(amount_str)
            if amount is None or amount == 0:
                skip_reasons['no_amount'] += 1
                if debug:
                    print(f"    SKIP no_amount: {amount_str}")
                continue

            category_name = get_cell_value(row, 'general_name')
            if not category_name:
                skip_reasons['no_category'] += 1
                if debug:
                    print(f"    SKIP no_category")
                continue

            cat_id = category_name_to_id.get(category_name)
            if cat_id is None:
                skip_reasons['category_not_found'] += 1
                if debug:
                    print(f"    SKIP category_not_found: '{category_name}' not in {category_name_to_id}")
                continue

            date_str = get_cell_value(row, 'created_at')
            parsed_date = parse_date(date_str)
            if not parsed_date:
                skip_reasons['no_date'] += 1
                if debug:
                    print(f"    SKIP no_date: '{date_str}'")
                continue

            income = is_income_row(row)
            tx_type = 'income' if income else 'expense'

            description = get_cell_value(row, 'description')
            if not description:
                description = category_name

            transactions.append({
                'amount': abs(amount),
                'categoryId': cat_id,
                'description': description,
                'date': parsed_date,
                'type': tx_type,
            })
            sheet_tx_count += 1

        xlsx_counts[sheet_name] = sheet_tx_count
        xlsx_counts['transactions'] += sheet_tx_count

    if skip_reasons['no_amount'] or skip_reasons['no_category'] or skip_reasons['category_not_found'] or skip_reasons['no_date'] or skip_reasons['bad_id']:
        print(f"  Skip reasons: {skip_reasons}")

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
    """Extract budgets and monthly account balances from *_rep sheets. Returns (budgets, account_monthly_balances, xlsx_counts)."""
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
                f_val = row.get('F', '')

                if 'budget_info' in (a_val or '').lower():
                    in_budget_section = True
                    continue
                elif a_val:
                    in_budget_section = False
                    continue

                if in_budget_section and b_val and b_val.isdigit():
                    cat_name = c_val
                    budget_amount = parse_amount(f_val)

                    if cat_name and budget_amount:
                        cat_id = category_name_to_id.get(cat_name)

                        start_date = f"{year}-{month:02d}-01"
                        if month == 12:
                            end_date = f"{year+1}-01-01"
                        else:
                            end_date = f"{year}-{month+1:02d}-01"

                        budgets.append({
                            'name': cat_name,
                            'categoryId': cat_id,
                            'amount': abs(budget_amount),
                            'period': 'monthly',
                            'startDate': start_date,
                            'endDate': end_date,
                            'month': f"{year}-{month:02d}",
                            'isRegular': 1,
                            'isBudgetExceeded': 0,
                        })
                        sheet_budget_count += 1

                if not a_val and b_val and len(b_val) == 4 and b_val.isdigit():
                    c_val_num = parse_amount(row.get('C', ''))
                    d_val_num = parse_amount(row.get('D', ''))
                    if c_val_num is not None and d_val_num is not None:
                        account_monthly_balances.append({
                            'accountId': 0,  # Will be replaced with actual bank account ID during insert
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
            amount REAL NOT NULL,
            categoryId INTEGER NOT NULL,
            budgetId INTEGER DEFAULT 1,
            accountId INTEGER DEFAULT 1,
            description TEXT,
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

    cursor.execute('INSERT OR IGNORE INTO accounts (name, type, icon, color, balance) VALUES (?, ?, ?, ?, ?)',
                   ('现金', 'cash', '💵', '#34C759', 0))
    cursor.execute('INSERT OR IGNORE INTO accounts (name, type, icon, color, balance) VALUES (?, ?, ?, ?, ?)',
                   ('银行账户', 'bank', '🏦', '#007AFF', 0))
    cursor.execute('INSERT OR IGNORE INTO accounts (name, type, icon, color, balance) VALUES (?, ?, ?, ?, ?)',
                   ('数字钱包', 'digital_wallet', '📱', '#5856D6', 0))

    conn.commit()
    return conn


def get_bank_account_id(conn: sqlite3.Connection) -> int:
    """Get or create bank account ID for imported balances."""
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM accounts WHERE type = 'bank' LIMIT 1")
    row = cursor.fetchone()
    if row:
        return row[0]
    cursor.execute('INSERT INTO accounts (name, type, icon, color, balance) VALUES (?, ?, ?, ?, ?)',
                   ('银行账户', 'bank', '🏦', '#007AFF', 0))
    return cursor.lastrowid


def check_duplicate_transaction(conn: sqlite3.Connection, tx: Dict) -> bool:
    """Check if transaction already exists."""
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id FROM transactions
        WHERE date = ? AND amount = ? AND description = ? AND type = ?
        LIMIT 1
    ''', (tx['date'], tx['amount'], tx['description'], tx['type']))
    return cursor.fetchone() is not None


def merge_categories(conn: sqlite3.Connection, new_categories: List[Dict], existing_category_names: set) -> Dict[str, int]:
    """Merge new categories, return name -> id mapping."""
    cursor = conn.cursor()
    name_to_id = {}

    for cat in new_categories:
        name = cat['name']
        if name in existing_category_names:
            cursor.execute('SELECT id FROM categories WHERE name = ?', (name,))
            row = cursor.fetchone()
            if row:
                name_to_id[name] = row[0]
        else:
            cursor.execute('''
                INSERT INTO categories (name, icon, type, sortOrder, isDefault, isActive)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (name, cat['icon'], cat['type'], cat['sortOrder'], cat['isDefault'], cat['isActive']))
            name_to_id[name] = cursor.lastrowid
            existing_category_names.add(name)

    conn.commit()
    return name_to_id


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

    # Tables that should be compared directly
    direct_compare_tables = ['categories', 'transactions', 'budgets', 'account_monthly_balances', 'accounts']

    print("\n--- Direct Table Comparison ---")
    for table in direct_compare_tables:
        xlsx_count = xlsx_counts.get(table, 0)
        sqlite_count = sqlite_counts.get(table, 0)
        status = "✓ MATCH" if xlsx_count == sqlite_count else "✗ MISMATCH"
        print(f"  {table:30} XLSX={xlsx_count:5}  SQLite={sqlite_count:5}  [{status}]")

    # Show per-sheet breakdown for debugging
    print("\n--- Per-Sheet XLSX Breakdown (for debugging) ---")
    sheet_keys = sorted([k for k in xlsx_counts.keys() if k not in direct_compare_tables])
    for key in sheet_keys:
        print(f"  {key:30} XLSX={xlsx_counts[key]:5}")

    # Transaction details if SQLite available
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

    all_category_names = set()
    cursor = conn.cursor()
    cursor.execute('SELECT name FROM categories')
    for row in cursor.fetchall():
        all_category_names.add(row[0])

    total_categories = 0
    total_transactions = 0
    total_budgets = 0
    total_balances = 0
    all_transactions = []
    all_budgets = []
    all_account_monthly_balances = []

    total_xlsx_counts = {}

    name_to_id = {}
    for xlsx_file in xlsx_files:
        print(f"\nProcessing: {xlsx_file}")
        sheets = parse_xlsx(xlsx_file)
        print(f"  Available sheets: {list(sheets.keys())}")

        categories, xlsx_counts = extract_categories(sheets)
        for k, v in xlsx_counts.items():
            total_xlsx_counts[k] = total_xlsx_counts.get(k, 0) + v

        name_to_id = merge_categories(conn, categories, all_category_names)
        total_categories += len(categories)
        print(f"  Categories: {len(categories)}, name_to_id mapping: {name_to_id}")

        transactions, tx_counts = extract_transactions(sheets, name_to_id)
        for k, v in tx_counts.items():
            total_xlsx_counts[k] = total_xlsx_counts.get(k, 0) + v

        print(f"  Found {len(transactions)} transactions")

        all_transactions.extend(transactions)

    print("\nExtracting budgets and monthly balances...")
    budgets, account_monthly_balances, xlsx_counts = extract_budgets_and_balances(xlsx_files, name_to_id)
    for k, v in xlsx_counts.items():
        total_xlsx_counts[k] = total_xlsx_counts.get(k, 0) + v

    print(f"  Found {len(budgets)} budgets, {len(account_monthly_balances)} account monthly balances")

    all_budgets.extend(budgets)
    all_account_monthly_balances.extend(account_monthly_balances)

    print(f"\nInserting transactions...")
    for tx in all_transactions:
        if not check_duplicate_transaction(conn, tx):
            try:
                cursor.execute('''
                    INSERT INTO transactions (amount, categoryId, budgetId, accountId, description, date, type)
                    VALUES (?, ?, 1, 1, ?, ?, ?)
                ''', (tx['amount'], tx['categoryId'], tx['description'], tx['date'], tx['type']))
                total_transactions += 1
            except Exception as e:
                pass

    print(f"Inserting budgets...")
    seen_budgets = set()
    for budget in all_budgets:
        if budget['categoryId'] is None:
            continue
        key = (budget['name'], budget['categoryId'], budget['month'], budget.get('accountId'))
        if key in seen_budgets:
            continue
        seen_budgets.add(key)
        try:
            cursor.execute('''
                INSERT OR IGNORE INTO budgets (name, categoryId, accountId, amount, period, startDate, endDate, month, isRegular, isBudgetExceeded)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (budget['name'], budget['categoryId'], budget.get('accountId'), budget['amount'], budget['period'],
                  budget['startDate'], budget['endDate'], budget['month'], budget['isRegular'], budget['isBudgetExceeded']))
            if cursor.rowcount > 0:
                total_budgets += 1
        except Exception as e:
            pass

    print(f"Inserting account monthly balances...")
    bank_account_id = get_bank_account_id(conn)
    print(f"  Using bank account ID: {bank_account_id}")
    for balance in all_account_monthly_balances:
        try:
            cursor.execute('''
                INSERT OR REPLACE INTO account_monthly_balances (accountId, year, month, openingBalance, closingBalance)
                VALUES (?, ?, ?, ?, ?)
            ''', (bank_account_id, balance['year'], balance['month'], balance['openingBalance'], balance['closingBalance']))
            total_balances += 1
        except Exception as e:
            pass

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