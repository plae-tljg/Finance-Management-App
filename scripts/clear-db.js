import SQLite from 'expo-sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function clearDatabase() {
  console.log('开始清理数据库...');
  
  // 创建新的数据库连接
  const db = SQLite.openDatabase('FinanceManager.db');

  try {
    // 获取所有表名
    db.transaction(tx => {
      tx.executeSql(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT IN ('sqlite_sequence', 'sqlite_master')",
        [],
        (_, { rows: { _array } }) => {
          // 禁用外键约束
          tx.executeSql('PRAGMA foreign_keys = OFF;');

          // 删除所有表
          _array.forEach(table => {
            console.log(`删除表: ${table.name}`);
            tx.executeSql(`DROP TABLE IF EXISTS ${table.name};`);
          });

          // 重新启用外键约束
          tx.executeSql('PRAGMA foreign_keys = ON;');
          
          console.log('数据库清理完成');
        }
      );
    });
  } catch (error) {
    console.error('清理数据库失败:', error);
    process.exit(1);
  }
}

// 执行清理
clearDatabase(); 