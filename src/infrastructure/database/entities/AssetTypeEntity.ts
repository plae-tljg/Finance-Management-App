import { AssetType } from '../../../domain/entities/AssetType';
import SQLite from 'react-native-sqlite-storage';

export class AssetTypeEntity {
  static readonly TABLE_NAME = 'asset_types';
  
  static readonly CREATE_TABLE_SQL = `
    CREATE TABLE IF NOT EXISTS ${AssetTypeEntity.TABLE_NAME} (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `;

  static readonly SAMPLE_DATA: AssetType[] = [
    {
      id: '1',
      name: '现金',
      description: '现金和活期存款',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      name: '定期存款',
      description: '银行定期存款',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '3',
      name: '股票',
      description: '股票投资',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '4',
      name: '基金',
      description: '基金投资',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '5',
      name: '房产',
      description: '房地产投资',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '6',
      name: '黄金',
      description: '黄金投资',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  static toDomain(row: any): AssetType {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  static toPersistence(assetType: AssetType): any {
    return {
      id: assetType.id,
      name: assetType.name,
      description: assetType.description,
      created_at: assetType.createdAt.toISOString(),
      updated_at: assetType.updatedAt.toISOString()
    };
  }

  static async insertSampleData(db: SQLite.SQLiteDatabase): Promise<void> {
    const [result] = await db.executeSql(
      `SELECT COUNT(*) as count FROM ${AssetTypeEntity.TABLE_NAME}`
    );
    const count = result.rows.item(0).count;

    if (count === 0) {
      for (const assetType of AssetTypeEntity.SAMPLE_DATA) {
        const data = AssetTypeEntity.toPersistence(assetType);
        await db.executeSql(
          `INSERT INTO ${AssetTypeEntity.TABLE_NAME} (id, name, description, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?)`,
          [data.id, data.name, data.description, data.created_at, data.updated_at]
        );
      }
    }
  }
} 