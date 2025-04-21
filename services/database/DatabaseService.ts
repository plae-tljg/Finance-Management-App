import { SQLiteDatabase, SQLiteRunResult } from 'expo-sqlite';
import { QueryExecutor, DatabaseQueryResult } from './types';
import { BankBalanceQueries } from './schemas/BankBalance';

export type DatabaseEvent = 'transaction_updated' | 'budget_updated' | 'category_updated';

class DatabaseService implements QueryExecutor {
  private static instance: DatabaseService | null = null;
  private database: SQLiteDatabase | null = null;
  private eventListeners: Map<DatabaseEvent, Set<() => void>> = new Map();
  private isResetting = false;

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public initialize(db: SQLiteDatabase): void {
    this.database = db;
  }

  async executeQuery<T>(
    query: string, 
    params: any[] = []
  ): Promise<DatabaseQueryResult<T>> {
    if (!this.database) {
      throw new Error('数据库未初始化');
    }

    try {
      if (!query.trim().toUpperCase().startsWith('SELECT')) {
        const result = await this.database.runAsync(query, params);
        
        if (query.includes('transactions')) {
          this.emit('transaction_updated');
        } else if (query.includes('budgets')) {
          this.emit('budget_updated');
        } else if (query.includes('categories')) {
          this.emit('category_updated');
        }
        
        return {
          rows: {
            _array: [],
            length: 0
          },
          changes: result.changes,
          insertId: result.lastInsertRowId
        };
      } else {
        const result = await this.database.getAllAsync(query, params);
        return {
          rows: {
            _array: result as T[],
            length: result.length
          }
        };
      }
    } catch (error) {
      console.error('执行查询失败:', error);
      throw error;
    }
  }

  public on(event: DatabaseEvent, callback: () => void): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
    
    return () => {
      this.eventListeners.get(event)?.delete(callback);
    };
  }

  private emit(event: DatabaseEvent): void {
    this.eventListeners.get(event)?.forEach(callback => callback());
  }

  async executeTransaction<T>(
    queries: Array<{ query: string; params?: any[] }>
  ): Promise<T[]> {
    if (!this.database) {
      throw new Error('数据库未初始化');
    }

    try {
      const results: T[] = [];
      
      for (const { query, params = [] } of queries) {
        const result = await this.executeQuery<T>(query, params);
        results.push(result as T);
      }
      
      return results;
    } catch (error) {
      console.error('事务执行失败:', error);
      throw error;
    }
  }

  async executeBatch<T>(
    query: string, 
    paramsList: any[][]
  ): Promise<DatabaseQueryResult<T>[]> {
    if (!this.database) {
      throw new Error('数据库未初始化');
    }

    try {
      const results: DatabaseQueryResult<T>[] = [];
      
      for (const params of paramsList) {
        const result = await this.executeQuery<T>(query, params);
        results.push(result);
      }
      
      return results;
    } catch (error) {
      console.error('批量执行失败:', error);
      throw error;
    }
  }

  async tableExists(tableName: string): Promise<boolean> {
    const result = await this.executeQuery<{ count: number }>(
      `SELECT COUNT(*) as count 
       FROM sqlite_master 
       WHERE type='table' AND name=?`,
      [tableName]
    );
    return result.rows._array[0]?.count > 0;
  }

  async getTableSchema(tableName: string): Promise<string> {
    const result = await this.executeQuery<{ sql: string }>(
      `SELECT sql FROM sqlite_master WHERE type='table' AND name=?`,
      [tableName]
    );
    return result.rows._array[0]?.sql ?? '';
  }

  async reset(): Promise<void> {
    if (!this.database) {
      throw new Error('数据库未初始化');
    }

    if (this.isResetting) {
      throw new Error('数据库正在重置中，请稍后再试');
    }

    this.isResetting = true;

    try {
      // 执行重置操作
      const { resetDatabase } = require('./initialize');
      await resetDatabase(this.database);
      
      this.emit('transaction_updated');
      this.emit('budget_updated');
      this.emit('category_updated');
    } catch (error) {
      console.error('重置数据库失败:', error);
      throw error;
    } finally {
      this.isResetting = false;
    }
  }

  async close(): Promise<void> {
    if (!this.database) {
      throw new Error('数据库未初始化');
    }

    try {
      await this.database.closeAsync();
      this.eventListeners.clear();
      this.database = null;
    } catch (error) {
      console.error('关闭数据库失败:', error);
      throw error;
    }
  }

  async transaction<T>(callback: (tx: QueryExecutor) => Promise<T>): Promise<T> {
    if (!this.database) {
      throw new Error('数据库未初始化');
    }

    try {
      await this.database.execAsync('BEGIN TRANSACTION');
      const result = await callback(this);
      await this.database.execAsync('COMMIT');
      return result;
    } catch (error) {
      await this.database.execAsync('ROLLBACK');
      throw error;
    }
  }
}

// 导出单例实例
export const databaseService = DatabaseService.getInstance();

// 导出类型定义
export type { DatabaseService };

// 添加初始化方法
export async function initializeDatabase(db: SQLiteDatabase) {
  if (!databaseService) {
    throw new Error('DatabaseService 未初始化');
  }
  databaseService.initialize(db);
}

// // 测试代码
// if (require.main === module) {
//   async function test() {
//     console.log('开始测试 DatabaseService...');

//     // 创建一个模拟的 SQLiteDatabase
//     const mockDb = {
//       getAllAsync: async () => [],
//       runAsync: async () => ({ changes: 0, lastInsertRowId: 0 }),
//       execAsync: async () => {},
//       closeAsync: async () => {}
//     } as unknown as SQLiteDatabase;

//     try {
//       // 初始化数据库服务
//       const db = new DatabaseService();
//       console.log('数据库服务初始化成功');

//       // 测试事件监听
//       let eventFired = false;
//       db.on('transaction_updated', () => {
//         eventFired = true;
//         console.log('事件监听器工作正常');
//       });

//       // 测试查询执行
//       await db.executeQuery('INSERT INTO transactions (amount) VALUES (?)', [100]);
//       console.log('查询执行成功');
//       console.log('事件触发状态:', eventFired);

//       // 测试数据库关闭
//       await db.close();
//       console.log('数据库关闭成功');

//       console.log('所有测试通过!');
//     } catch (error) {
//       console.error('测试失败:', error);
//     }
//   }

//   test();
// }
