export interface Category {
  id: number;
  name: string;         // 类别名称
  icon: string;         // 图标
  type: 'income' | 'expense';  // 类别类型
  sortOrder: number;    // 排序顺序
  isDefault: boolean;   // 是否为默认类别
  isActive: boolean;    // 是否激活
  createdAt: string;    // 创建时间
  updatedAt: string;    // 更新时间
}

// 默认类别数据
// 6 个一级类别。如果想加细分类别，请用 `transaction_templates`（transaction
// 模板）来快速录入同样的组合，不要把类别拆细——类别一多反而选择困难。
// 排序约定：1xx = 餐饮，2xx = 交通，3xx = 购物，4xx = 居家，6xx = 账单，9xx = 收入。
export const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: '餐饮',
    icon: '🍚',
    type: 'expense',
    sortOrder: 100,
    isDefault: true,
    isActive: true,
  },
  {
    name: '交通',
    icon: '🚌',
    type: 'expense',
    sortOrder: 200,
    isDefault: true,
    isActive: true
  },
  {
    name: '购物',
    icon: '🛍️',
    type: 'expense',
    sortOrder: 300,
    isDefault: true,
    isActive: true
  },
  {
    name: '家用',
    icon: '🧓',
    type: 'expense',
    sortOrder: 400,
    isDefault: true,
    isActive: true
  },
  {
    name: '账单',
    icon: '🧾',
    type: 'expense',
    sortOrder: 600,
    isDefault: true,
    isActive: true
  },
  {
    name: '工资',
    icon: '💰',
    type: 'income',
    sortOrder: 900,
    isDefault: true,
    isActive: true
  },
];

export const CategoryFields = {
  UPDATABLE: ['name', 'icon', 'type', 'sortOrder', 'isDefault', 'isActive'] as const,
  REQUIRED: ['name', 'icon', 'type'] as const,
  OPTIONAL: ['sortOrder', 'isDefault', 'isActive'] as const
} as const;

export type UpdatableFields = typeof CategoryFields.UPDATABLE[number];
export type RequiredFields = typeof CategoryFields.REQUIRED[number];

export const CategoryQueries = {
  CREATE_TABLE: `
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      sortOrder INTEGER DEFAULT 0,
      isDefault BOOLEAN DEFAULT 0,
      isActive BOOLEAN DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,

  CREATE_INDEXES: `
    CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
    CREATE INDEX IF NOT EXISTS idx_categories_isActive ON categories(isActive);
  `,
  
  INSERT: `
    INSERT INTO categories (
      name, 
      icon, 
      type, 
      sortOrder, 
      isDefault, 
      isActive
    ) VALUES (?, ?, ?, ?, ?, ?)
  `,
  
  UPDATE: `
    UPDATE categories 
    SET name = COALESCE(?, name),
        icon = COALESCE(?, icon),
        type = COALESCE(?, type),
        sortOrder = COALESCE(?, sortOrder),
        isDefault = COALESCE(?, isDefault),
        isActive = COALESCE(?, isActive),
        updatedAt = CURRENT_TIMESTAMP
    WHERE id = ?
  `,
  
  DELETE: 'DELETE FROM categories WHERE id = ?',
  
  FIND_BY_ID: 'SELECT * FROM categories WHERE id = ?',
  
  FIND_ALL: 'SELECT * FROM categories',

  FIND_ACTIVE: 'SELECT * FROM categories WHERE isActive = 1',
  
  FIND_BY_TYPE: 'SELECT * FROM categories WHERE type = ? AND isActive = 1',
  
  FIND_DEFAULT: 'SELECT * FROM categories WHERE isDefault = 1 AND isActive = 1',
  
  COUNT_ALL: 'SELECT COUNT(*) as count FROM categories',

  FIND_BY_TYPE_WITH_NAME: `
    SELECT *
    FROM categories 
    ORDER BY sortOrder
  `,

  generateUpdateQuery: (fields: string[]): string => {
    const setClause = fields.map(field => {
      const dbField = field.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      return `${dbField} = ?`;
    }).join(', ');
    
    return `UPDATE categories SET ${setClause}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`;
  }
} as const; 