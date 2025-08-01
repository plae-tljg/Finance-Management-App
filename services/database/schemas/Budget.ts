export interface Budget {
  id: number;
  name: string;          // 预算名称
  categoryId: number;    // 关联的类别ID
  amount: number;        // 预算金额
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';  // 预算周期
  startDate: string;     // 预算开始日期
  endDate: string;       // 预算结束日期
  month: string;         // 格式: YYYY-MM
  createdAt: string;     // 创建时间
  updatedAt: string;     // 更新时间
  isRegular: boolean;    // 是否为固定预算
  isBudgetExceeded: boolean;   // 是否超出预算
}

export interface BudgetWithCategory extends Budget {
  categoryName: string;
  categoryIcon: string;
  spent: number;
}

// 可选：添加一些默认预算, sample data to insert
export const DEFAULT_BUDGETS: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: '餐饮',
    categoryId: 1,
    amount: 2000,
    period: 'monthly',
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    month: '2024-01',
    isRegular: true,
    isBudgetExceeded: false
  }
];

export const BudgetFields = {
  UPDATABLE: ['name', 'categoryId', 'amount', 'period', 'startDate', 'endDate', 'month'] as const,
} as const;

export type UpdatableFields = typeof BudgetFields.UPDATABLE[number];

export const BudgetQueries = {
  CREATE_TABLE: `
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      categoryId INTEGER NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      period TEXT NOT NULL CHECK(period IN ('daily', 'weekly', 'monthly', 'yearly')),
      startDate TEXT NOT NULL,
      endDate TEXT NOT NULL,
      month TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (categoryId) REFERENCES categories(id)
    )
  `,

  INSERT: `
    INSERT INTO budgets (name, categoryId, amount, period, startDate, endDate, month) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `,

  UPDATE: `
    UPDATE budgets 
    SET name = COALESCE(?, name),
        categoryId = COALESCE(?, categoryId),
        amount = COALESCE(?, amount),
        period = COALESCE(?, period),
        startDate = COALESCE(?, startDate),
        endDate = COALESCE(?, endDate),
        month = COALESCE(?, month),
        updatedAt = CURRENT_TIMESTAMP
    WHERE id = ?
  `,

  DELETE: 'DELETE FROM budgets WHERE id = ?',

  FIND_BY_ID: 'SELECT * FROM budgets WHERE id = ?',

  FIND_ALL: 'SELECT * FROM budgets ORDER BY month DESC, categoryId ASC',

  FIND_BY_CATEGORY_ID: 'SELECT * FROM budgets WHERE categoryId = ? ORDER BY month DESC',

  FIND_BY_CATEGORY_AND_MONTH: 'SELECT * FROM budgets WHERE categoryId = ? AND month = ? ORDER BY id ASC',

  FIND_BY_DATE_RANGE: `
    SELECT * FROM budgets 
    WHERE startDate <= ? AND endDate >= ?
  `,

  FIND_BY_PERIOD: 'SELECT * FROM budgets WHERE period = ?',

  FIND_BY_MONTH: `
    SELECT * FROM budgets 
    WHERE month = ?
    ORDER BY categoryId ASC
  `,

  FIND_BY_MONTH_WITH_CATEGORY: `
    SELECT b.*, c.name as categoryName, c.type as categoryType
    FROM budgets b
    LEFT JOIN categories c ON b.categoryId = c.id
    WHERE b.month = ?
    ORDER BY b.categoryId ASC
  `,

  FIND_ACTIVE: `
    SELECT * FROM budgets 
    WHERE month >= ?
    ORDER BY month DESC, categoryId ASC
  `,

  FIND_ALL_WITH_CATEGORY: `
    SELECT b.*, c.name as categoryName, c.type as categoryType
    FROM budgets b
    LEFT JOIN categories c ON b.categoryId = c.id
    ORDER BY b.month DESC, b.categoryId ASC
  `,

  FIND_BY_ID_WITH_CATEGORY: `
    SELECT b.*, c.name as categoryName, c.type as categoryType
    FROM budgets b
    LEFT JOIN categories c ON b.categoryId = c.id
    WHERE b.id = ?
  `,

  COUNT_ALL: 'SELECT COUNT(*) as count FROM budgets',

  // 添加一个函数来生成动态 UPDATE 查询
  generateUpdateQuery: (fields: string[]): string => {
    const setClause = fields.map(field => {
      // 转换 camelCase 到 snake_case
      const dbField = field.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      return `${dbField} = ?`;
    }).join(', ');
    
    return `UPDATE budgets SET ${setClause}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`;
  },
} as const; 