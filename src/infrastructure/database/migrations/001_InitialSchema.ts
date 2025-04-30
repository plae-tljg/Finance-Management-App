import { Migration } from './DatabaseMigration';
import SQLite from 'react-native-sqlite-storage';
import { AssetTypeEntity } from '../entities/AssetTypeEntity';
import { PersonalAssetEntity } from '../entities/PersonalAssetEntity';
import { AccountEntity } from '../entities/AccountEntity';
import { CategoryEntity } from '../entities/CategoryEntity';
import { TransactionEntity } from '../entities/TransactionEntity';
import { BudgetEntity } from '../entities/BudgetEntity';

export const InitialSchema: Migration = {
  version: 1,
  up: async (db: SQLite.SQLiteDatabase) => {
    // 创建资产类型表
    await db.executeSql(AssetTypeEntity.CREATE_TABLE_SQL);

    // 创建个人资产表
    await db.executeSql(PersonalAssetEntity.CREATE_TABLE_SQL);

    // 创建账户表
    await db.executeSql(AccountEntity.CREATE_TABLE_SQL);

    // 创建分类表
    await db.executeSql(CategoryEntity.CREATE_TABLE_SQL);

    // 创建交易表
    await db.executeSql(TransactionEntity.CREATE_TABLE_SQL);

    // 创建预算表
    await db.executeSql(BudgetEntity.CREATE_TABLE_SQL);

    // 插入示例数据
    await insertSampleData(db);
  }
};

async function insertSampleData(db: SQLite.SQLiteDatabase): Promise<void> {
  // 插入资产类型示例数据
  for (const assetType of AssetTypeEntity.SAMPLE_DATA) {
    const data = AssetTypeEntity.toPersistence(assetType);
    await db.executeSql(
      `INSERT OR IGNORE INTO ${AssetTypeEntity.TABLE_NAME} (id, name, description, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [data.id, data.name, data.description, data.created_at, data.updated_at]
    );
  }

  // 插入分类示例数据
  for (const category of CategoryEntity.SAMPLE_DATA) {
    const data = CategoryEntity.toPersistence(category);
    await db.executeSql(
      `INSERT OR IGNORE INTO ${CategoryEntity.TABLE_NAME} (id, name, description, type, icon, color, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.id, data.name, data.description, data.type, data.icon, data.color, data.created_at, data.updated_at]
    );
  }
} 