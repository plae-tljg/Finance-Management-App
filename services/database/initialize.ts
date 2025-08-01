import { databaseService } from './DatabaseService';
import { CategoryRepository } from './repositories/CategoryRepository';
import { BudgetRepository } from './repositories/BudgetRepository';
import { TransactionRepository } from './repositories/TransactionRepository';
import { DEFAULT_CATEGORIES, Category } from './schemas/Category';
import { SCHEMAS } from './schemas';
import Constants from 'expo-constants';

// 在文件顶部添加类型声明
declare global {
  var DATA_CLEAR: boolean | undefined;
}

// 全局初始化标志
let globalIsInitializing = false;
let initializationPromise: Promise<any> | null = null;

export async function initializeDatabase(db: any) {
  // 如果正在初始化，等待初始化完成
  if (initializationPromise) {
    return initializationPromise;
  }

  // 如果已经初始化完成，直接返回
  if (globalIsInitializing) {
    return {
      db: databaseService,
      categories: new CategoryRepository(databaseService),
      budgets: new BudgetRepository(databaseService),
      transactions: new TransactionRepository(databaseService)
    };
  }

  globalIsInitializing = true;
  console.log('开始初始化数据库...');
  
  initializationPromise = (async () => {
    try {
      // 确保 databaseService 已初始化
      if (!databaseService) {
        throw new Error('DatabaseService 未初始化');
      }

      // 初始化 databaseService
      databaseService.initialize(db);

      // 检查是否需要清理数据库
      const shouldClearData = Constants.expoConfig?.extra?.DATA_CLEAR === true;
      console.log('环境变量配置:', {
        DATA_CLEAR: Constants.expoConfig?.extra?.DATA_CLEAR,
        shouldClearData
      });

      if (shouldClearData) {
        console.log('开始清理数据库...');
        // 获取所有表名
        const tables = await databaseService.executeQuery<{ name: string }>(
          "SELECT name FROM sqlite_master WHERE type='table' AND name NOT IN ('sqlite_sequence', 'sqlite_master')"
        );

        // 禁用外键约束
        await databaseService.executeQuery('PRAGMA foreign_keys = OFF;');

        // 删除所有表
        for (const table of tables.rows._array) {
          console.log(`删除表: ${table.name}`);
          await databaseService.executeQuery(`DROP TABLE IF EXISTS ${table.name};`);
        }

        // 重新启用外键约束
        await databaseService.executeQuery('PRAGMA foreign_keys = ON;');
        console.log('数据库清理完成');
      }
      
      // 检查表是否存在，如果不存在则创建
      console.log('开始创建数据库表...');
      const tableNames = ['categories', 'budgets', 'transactions', 'bank_balances'];
      for (const tableName of tableNames) {
        const exists = await databaseService.tableExists(tableName);
        if (!exists) {
          console.log(`创建表: ${tableName}`);
          await databaseService.executeQuery(SCHEMAS[tableName as keyof typeof SCHEMAS]);
        }
      }
      console.log('数据库表创建完成');
      
      // 初始化所有 repositories
      console.log('初始化 repositories...');
      const repositories = {
        categories: new CategoryRepository(databaseService),
        budgets: new BudgetRepository(databaseService),
        transactions: new TransactionRepository(databaseService)
      };

      // 初始化默认数据
      console.log('开始初始化默认数据...');
      await initializeDefaultData(repositories);
      console.log('默认数据初始化完成');

      console.log('数据库初始化完成');
      return {
        db: databaseService,
        ...repositories
      };
    } catch (error) {
      console.error('数据库初始化失败:', error);
      throw error;
    } finally {
      initializationPromise = null;
      globalIsInitializing = false;
    }
  })();

  return initializationPromise;
}

// 添加重置数据库的函数
export async function resetDatabase(db: any) {
  // 使用事务来执行重置操作
  await databaseService.executeTransaction([
    // 先禁用外键约束
    { query: 'PRAGMA foreign_keys = OFF;' },
    
    // 按照依赖关系的相反顺序删除表
    { query: 'DROP TABLE IF EXISTS transactions;' },
    { query: 'DROP TABLE IF EXISTS budgets;' },
    { query: 'DROP TABLE IF EXISTS categories;' },
    { query: 'DROP TABLE IF EXISTS bank_balances;' },
    
    // 按照依赖关系创建表
    { query: SCHEMAS.categories },
    { query: SCHEMAS.budgets },
    { query: SCHEMAS.transactions },
    { query: SCHEMAS.bank_balances },
    
    // 重新启用外键约束
    { query: 'PRAGMA foreign_keys = ON;' }
  ]);
  
  // 重新初始化默认数据
  const repositories = {
    categories: new CategoryRepository(databaseService),
    budgets: new BudgetRepository(databaseService),
    transactions: new TransactionRepository(databaseService)
  };
  
  await initializeDefaultData(repositories);

  return {
    db: databaseService,
    ...repositories
  };
}

async function initializeDefaultData(repositories: {
  categories: CategoryRepository;
  budgets: BudgetRepository;
  transactions: TransactionRepository;
}) {
  try {
    // 检查类别表是否有数据
    const existingCategories = await repositories.categories.findAll();
    if (existingCategories.length === 0) {
      console.log('初始化默认类别数据...');
      for (const category of DEFAULT_CATEGORIES) {
        // 检查是否已存在相同名称的类别
        const existingCategory = existingCategories.find((c: Category) => c.name === category.name);
        if (!existingCategory) {
          await repositories.categories.create(category);
        }
      }
    }

    // 这里可以添加其他表的默认数据初始化
    // 例如预算、交易等

  } catch (error) {
    console.error('初始化默认数据失败:', error);
    throw error;
  }
} 