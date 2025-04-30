import SQLite from 'react-native-sqlite-storage';
import { DatabaseInitializer } from '../database/DatabaseInitializer';

export abstract class BaseRepository<T> {
  protected db: SQLite.SQLiteDatabase;

  constructor() {
    this.db = DatabaseInitializer.getInstance().getDatabase();
  }

  protected async executeQuery<T>(sql: string, params: any[] = []): Promise<T[]> {
    try {
      const [results] = await this.db.executeSql(sql, params);
      const items: T[] = [];
      for (let i = 0; i < results.rows.length; i++) {
        items.push(results.rows.item(i));
      }
      return items;
    } catch (error) {
      console.error('执行查询失败:', error);
      throw error;
    }
  }

  protected async executeUpdate(sql: string, params: any[] = []): Promise<void> {
    try {
      await this.db.executeSql(sql, params);
    } catch (error) {
      console.error('执行更新失败:', error);
      throw error;
    }
  }

  protected async executeTransaction<T>(callback: (tx: SQLite.Transaction) => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.db.transaction(
        async (tx) => {
          try {
            const result = await callback(tx);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        },
        (error) => {
          console.error('事务执行失败:', error);
          reject(error);
        }
      );
    });
  }
} 