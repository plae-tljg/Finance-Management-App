import { Category } from '../../../domain/entities/Category';
import SQLite from 'react-native-sqlite-storage';

export class CategoryEntity {
  static readonly TABLE_NAME = 'categories';
  
  static readonly CREATE_TABLE_SQL = `
    CREATE TABLE IF NOT EXISTS ${CategoryEntity.TABLE_NAME} (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `;

  static readonly SAMPLE_DATA: Category[] = [
    {
      id: '1',
      name: '餐饮',
      description: '日常饮食支出',
      type: 'expense',
      icon: 'restaurant',
      color: '#FF6B6B',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      name: '交通',
      description: '公共交通和私家车支出',
      type: 'expense',
      icon: 'directions_car',
      color: '#4ECDC4',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '3',
      name: '购物',
      description: '日常用品和衣物购买',
      type: 'expense',
      icon: 'shopping_cart',
      color: '#FFD93D',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '4',
      name: '工资',
      description: '月薪收入',
      type: 'income',
      icon: 'work',
      color: '#95E1D3',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '5',
      name: '投资',
      description: '股票、基金等投资收益',
      type: 'income',
      icon: 'trending_up',
      color: '#6C5CE7',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  static toDomain(row: any): Category {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      type: row.type,
      icon: row.icon,
      color: row.color,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  static toPersistence(category: Category): any {
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      type: category.type,
      icon: category.icon,
      color: category.color,
      created_at: category.createdAt.toISOString(),
      updated_at: category.updatedAt.toISOString()
    };
  }

  static async insertSampleData(db: SQLite.SQLiteDatabase): Promise<void> {
    const [result] = await db.executeSql(
      `SELECT COUNT(*) as count FROM ${CategoryEntity.TABLE_NAME}`
    );
    const count = result.rows.item(0).count;

    if (count === 0) {
      for (const category of CategoryEntity.SAMPLE_DATA) {
        const data = CategoryEntity.toPersistence(category);
        await db.executeSql(
          `INSERT INTO ${CategoryEntity.TABLE_NAME} (id, name, description, type, icon, color, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [data.id, data.name, data.description, data.type, data.icon, data.color, data.created_at, data.updated_at]
        );
      }
    }
  }
} 