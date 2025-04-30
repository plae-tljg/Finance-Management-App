import { Platform } from 'react-native';
import SQLite from 'react-native-sqlite-storage';
import { AssetTypeEntity } from './entities/AssetTypeEntity';
import { CategoryEntity } from './entities/CategoryEntity';
import { AccountEntity } from './entities/AccountEntity';
import { TransactionEntity } from './entities/TransactionEntity';
import { BudgetEntity } from './entities/BudgetEntity';
import { PersonalAssetEntity } from './entities/PersonalAssetEntity';
import { AppConfig } from '../config/AppConfig';
import RNFS from 'react-native-fs';

export class DatabaseInitializer {
  private static instance: DatabaseInitializer;
  private initialized = false;
  private db: SQLite.SQLiteDatabase | null = null;

  private constructor() {}

  public static getInstance(): DatabaseInitializer {
    if (!DatabaseInitializer.instance) {
      DatabaseInitializer.instance = new DatabaseInitializer();
    }
    return DatabaseInitializer.instance;
  }

  private async ensureDirectory(path: string): Promise<void> {
    const dirExists = await RNFS.exists(path);
    if (!dirExists) {
      await RNFS.mkdir(path);
    }
  }

  private async performBackup(sourcePath: string, targetPath: string, addTimestamp: boolean = false): Promise<boolean> {
    try {
      const sourceExists = await RNFS.exists(sourcePath);
      if (!sourceExists) {
        return false;
      }

      const sourceStats = await RNFS.stat(sourcePath);
      if (sourceStats.size === 0) {
        return false;
      }

      let backupPath = targetPath;
      if (addTimestamp) {
        const now = new Date();
        const timestamp = now.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }).replace(/[/\s:,]/g, '-');
        backupPath = targetPath.replace('.db', `_${timestamp}.db`);
      }
      
      await RNFS.copyFile(sourcePath, backupPath);
      return true;
    } catch (error) {
      console.error('数据库备份失败:', error);
      return false;
    }
  }

  private async findAndBackupDatabase(addTimestamp: boolean = false): Promise<void> {
    if (Platform.OS !== 'android') {
      return;
    }

    const packageName = 'com.financemanagementapp';
    const possiblePaths = [
      `/data/data/${packageName}/databases/${AppConfig.DATABASE.name}`,
      `/data/user/0/${packageName}/databases/${AppConfig.DATABASE.name}`,
      `${RNFS.DocumentDirectoryPath}/databases/${AppConfig.DATABASE.name}`,
      `${RNFS.DocumentDirectoryPath}/${AppConfig.DATABASE.name}`
    ];

    await this.ensureDirectory(AppConfig.DATABASE.targetPath.substring(0, AppConfig.DATABASE.targetPath.lastIndexOf('/')));

    for (const path of possiblePaths) {
      if (await this.performBackup(path, AppConfig.DATABASE.targetPath, addTimestamp)) {
        return;
      }
    }
  }

  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      SQLite.enablePromise(true);
      
      this.db = await SQLite.openDatabase({
        name: AppConfig.DATABASE.name,
        location: AppConfig.DATABASE.location as SQLite.Location,
        createFromLocation: 0
      });

      await this.createTables();
      await this.insertSampleDataIfNeeded();

      if (this.db) {
        await this.db.close();
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      await this.findAndBackupDatabase();

      this.db = await SQLite.openDatabase({
        name: AppConfig.DATABASE.name,
        location: AppConfig.DATABASE.location as SQLite.Location,
        createFromLocation: 0
      });

      this.initialized = true;
    } catch (error) {
      console.error('数据库初始化失败:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error(AppConfig.ERROR_MESSAGES.DATABASE_NOT_INITIALIZED);

    try {
      await this.db.executeSql(AssetTypeEntity.CREATE_TABLE_SQL);
      await this.db.executeSql(PersonalAssetEntity.CREATE_TABLE_SQL);
      await this.db.executeSql(AccountEntity.CREATE_TABLE_SQL);
      await this.db.executeSql(CategoryEntity.CREATE_TABLE_SQL);
      await this.db.executeSql(TransactionEntity.CREATE_TABLE_SQL);
      await this.db.executeSql(BudgetEntity.CREATE_TABLE_SQL);
    } catch (error) {
      console.error('创建表失败:', error);
      throw error;
    }
  }

  private async insertSampleDataIfNeeded(): Promise<void> {
    if (!this.db) throw new Error(AppConfig.ERROR_MESSAGES.DATABASE_NOT_INITIALIZED);

    try {
      await AssetTypeEntity.insertSampleData(this.db);
      await CategoryEntity.insertSampleData(this.db);
    } catch (error) {
      console.error('插入示例数据失败:', error);
      throw error;
    }
  }

  public async backupDatabase(): Promise<void> {
    await this.findAndBackupDatabase(true);
  }

  public getDatabase(): SQLite.SQLiteDatabase {
    if (!this.db) {
      throw new Error(AppConfig.ERROR_MESSAGES.DATABASE_NOT_INITIALIZED);
    }
    return this.db;
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public async closeDatabase(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      this.initialized = false;
    }
  }
} 