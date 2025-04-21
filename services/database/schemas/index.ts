import { CategoryQueries } from './Category';
import { TransactionQueries } from './Transaction';
import { BudgetQueries } from './Budget';
import { BankBalanceQueries } from './BankBalance';

// 集中管理数据库表结构
export const SCHEMA_VERSIONS = {
  v1: '1.0.0',
  // 未来版本在这里添加
};

// 按照依赖关系排序的表创建语句
export const SCHEMAS = {
  // 先创建没有外键依赖的表
  categories: CategoryQueries.CREATE_TABLE,
  budgets: BudgetQueries.CREATE_TABLE,
  bank_balances: BankBalanceQueries.CREATE_TABLE,
  // 最后创建有外键依赖的表
  transactions: TransactionQueries.CREATE_TABLE,
}; 