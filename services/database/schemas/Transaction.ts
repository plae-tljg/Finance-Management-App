// 这个文件定义 TypeScript 接口，用于：
// 1. 类型检查
// 2. 代码提示
// 3. 定义业务层使用的属性名（通常是 camelCase）
export interface Transaction {
  id: number;
  amount: number;        // 金额
  categoryId: number;    // 关联的类别ID（如：餐饮、交通等）
  budgetId: number;      // 关联的预算ID
  description: string | null;
  date: string;         // 交易日期
  type: 'income' | 'expense';  // 类型：收入或支出
  createdAt: string;
  updatedAt: string;
}

// 可选：添加一些示例交易数据用于测试
export const SAMPLE_TRANSACTIONS: Omit<Transaction, 'id'>[] = [
  {
    amount: 30,
    categoryId: 1, // 对应餐饮类别
    budgetId: 1,   // 对应预算
    description: '午餐',
    date: new Date().toISOString(),
    type: 'expense',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  // 可以添加更多示例...
];

export const TransactionFields = {
  UPDATABLE: ['amount', 'categoryId', 'budgetId', 'description', 'date', 'type'] as const,
  REQUIRED: ['amount', 'categoryId', 'budgetId', 'date', 'type'] as const,
  OPTIONAL: ['description'] as const
} as const;

export type UpdatableFields = typeof TransactionFields.UPDATABLE[number];
export type RequiredFields = typeof TransactionFields.REQUIRED[number];

export const TransactionQueries = {
  CREATE_TABLE: `
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      categoryId INTEGER NOT NULL,
      budgetId INTEGER NOT NULL,
      description TEXT,
      date DATETIME NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (categoryId) REFERENCES categories(id),
      FOREIGN KEY (budgetId) REFERENCES budgets(id)
    )
  `,
  
  INSERT: `
    INSERT INTO transactions (
      amount, 
      categoryId, 
      budgetId, 
      description, 
      date, 
      type
    ) VALUES (?, ?, ?, ?, ?, ?)
  `,
  
  UPDATE: `
    UPDATE transactions 
    SET amount = COALESCE(?, amount),
        categoryId = COALESCE(?, categoryId),
        budgetId = COALESCE(?, budgetId),
        description = COALESCE(?, description),
        date = COALESCE(?, date),
        type = COALESCE(?, type),
        updatedAt = CURRENT_TIMESTAMP
    WHERE id = ?
  `,
  
  DELETE: 'DELETE FROM transactions WHERE id = ?',
  
  FIND_BY_ID: 'SELECT * FROM transactions WHERE id = ?',
  
  FIND_ALL: 'SELECT * FROM transactions ORDER BY date DESC',
  
  FIND_BY_CATEGORY_ID: 'SELECT * FROM transactions WHERE categoryId = ? ORDER BY date DESC',
  
  FIND_BY_BUDGET_ID: 'SELECT * FROM transactions WHERE budgetId = ? ORDER BY date DESC',
  
  FIND_BY_DATE_RANGE: 'SELECT * FROM transactions WHERE date BETWEEN ? AND ? ORDER BY date DESC',
  
  COUNT_ALL: 'SELECT COUNT(*) as count FROM transactions',

  FIND_ALL_WITH_CATEGORY: `
    SELECT t.*, c.name as categoryName, c.icon as categoryIcon
    FROM transactions t
    LEFT JOIN categories c ON t.categoryId = c.id
    ORDER BY t.date DESC
  `,

  FIND_BY_ID_WITH_CATEGORY: `
    SELECT t.*, c.name as categoryName, c.icon as categoryIcon
    FROM transactions t
    LEFT JOIN categories c ON t.categoryId = c.id
    WHERE t.id = ?
  `,

  FIND_BY_DATE_RANGE_WITH_CATEGORY: `
    SELECT t.*, c.name as categoryName, c.icon as categoryIcon
    FROM transactions t
    LEFT JOIN categories c ON t.categoryId = c.id
    WHERE t.date BETWEEN ? AND ?
    ORDER BY t.date DESC
  `,

  GET_TOTAL_BY_TYPE: `
    SELECT COALESCE(SUM(amount), 0) as total
    FROM transactions
    WHERE type = ?
  `,

  GET_SUMMARY_BY_CATEGORY: `
    SELECT 
      t.categoryId,
      c.name as categoryName,
      COALESCE(SUM(t.amount), 0) as total,
      COUNT(*) as count
    FROM transactions t
    LEFT JOIN categories c ON t.categoryId = c.id
    WHERE t.date BETWEEN ? AND ?
    GROUP BY t.categoryId, c.name
    ORDER BY total DESC
  `,

  GET_SUMMARY_BY_BUDGET: `
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
    WHERE t.date BETWEEN ? AND ?
    GROUP BY b.id, b.name, b.amount
  `,

  generateUpdateQuery: (fields: string[]): string => {
    const setClause = fields.map(field => {
      const dbField = field.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      return `${dbField} = ?`;
    }).join(', ');
    
    return `UPDATE transactions SET ${setClause}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`;
  }
} as const; 