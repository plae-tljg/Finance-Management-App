import { Transaction, TransactionFields, UpdatableFields } from '../schemas/Transaction';
import { TransactionQueries } from '../schemas/Transaction';
import { BaseRepository } from './BaseRepository';
import { QueryExecutor } from '../types';

export interface TransactionWithCategory extends Transaction {
  categoryName: string;
  categoryIcon: string;
  budgetName?: string;
}

export interface CategorySummary {
  categoryId: number;
  categoryName: string;
  total: number;
  count: number;
}

export interface BudgetSummary {
  budgetId: number;
  budgetName: string;
  totalSpent: number;
  budgetAmount: number;
  isExceeded: number;
}

export class TransactionRepository implements BaseRepository<Transaction> {
  constructor(private db: QueryExecutor) {}

  async create(data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    const result = await this.db.executeQuery<Transaction>(
      TransactionQueries.INSERT,
      [
        data.amount,
        data.categoryId,
        data.budgetId,
        data.description,
        data.date,
        data.type
      ]
    );
    
    return {
      ...data,
      id: result.insertId!,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  async findAll(): Promise<Transaction[]> {
    const result = await this.db.executeQuery<Transaction>(
      TransactionQueries.FIND_ALL
    );
    return result.rows._array;
  }

  async findAllWithCategory(): Promise<TransactionWithCategory[]> {
    try {
      console.log('开始获取交易记录...');
      const result = await this.db.executeQuery<TransactionWithCategory>(
        TransactionQueries.FIND_ALL_WITH_CATEGORY
      );
      console.log('获取到的交易记录数量:', result.rows._array.length);
      return result.rows._array;
    } catch (error) {
      console.error('获取交易记录失败:', error);
      return [];
    }
  }

  async findById(id: number): Promise<Transaction | null> {
    const result = await this.db.executeQuery<Transaction>(
      TransactionQueries.FIND_BY_ID,
      [id]
    );
    return result.rows._array[0] || null;
  }

  async findByIdWithCategory(id: number): Promise<TransactionWithCategory | null> {
    const result = await this.db.executeQuery<TransactionWithCategory>(
      TransactionQueries.FIND_BY_ID_WITH_CATEGORY,
      [id]
    );
    return result.rows._array[0] || null;
  }

  async update(id: number, data: Partial<Transaction>): Promise<boolean> {
    const result = await this.db.executeQuery(
      TransactionQueries.UPDATE,
      [
        data.amount,
        data.categoryId,
        data.budgetId,
        data.description,
        data.date,
        data.type,
        id
      ]
    );
    return (result.changes ?? 0) > 0;
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db.executeQuery(
      TransactionQueries.DELETE,
      [id]
    );
    return (result.changes ?? 0) > 0;
  }

  async count(): Promise<number> {
    const result = await this.db.executeQuery<{count: number}>(
      TransactionQueries.COUNT_ALL
    );
    return result.rows._array[0]?.count ?? 0;
  }

  async findByCategoryId(categoryId: number): Promise<Transaction[]> {
    const result = await this.db.executeQuery<Transaction>(
      TransactionQueries.FIND_BY_CATEGORY_ID,
      [categoryId]
    );
    return result.rows._array;
  }

  async findByBudgetId(budgetId: number): Promise<Transaction[]> {
    const result = await this.db.executeQuery<Transaction>(
      TransactionQueries.FIND_BY_BUDGET_ID,
      [budgetId]
    );
    return result.rows._array;
  }

  async findByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
    const result = await this.db.executeQuery<Transaction>(
      TransactionQueries.FIND_BY_DATE_RANGE,
      [startDate, endDate]
    );
    return result.rows._array;
  }

  async findByDateRangeWithCategory(startDate: string, endDate: string): Promise<TransactionWithCategory[]> {
    const result = await this.db.executeQuery<TransactionWithCategory>(
      TransactionQueries.FIND_BY_DATE_RANGE_WITH_CATEGORY,
      [startDate, endDate]
    );
    return result.rows._array;
  }

  async getTotalIncome(): Promise<number> {
    const result = await this.db.executeQuery<{total: number}>(
      TransactionQueries.GET_TOTAL_BY_TYPE,
      ['income']
    );
    return result.rows._array[0]?.total ?? 0;
  }

  async getTotalExpense(): Promise<number> {
    const result = await this.db.executeQuery<{total: number}>(
      TransactionQueries.GET_TOTAL_BY_TYPE,
      ['expense']
    );
    return result.rows._array[0]?.total ?? 0;
  }

  async getSummaryByCategory(startDate: string, endDate: string): Promise<CategorySummary[]> {
    const result = await this.db.executeQuery<CategorySummary>(
      TransactionQueries.GET_SUMMARY_BY_CATEGORY,
      [startDate, endDate]
    );
    return result.rows._array;
  }

  async getSummaryByBudget(startDate: string, endDate: string): Promise<BudgetSummary[]> {
    const result = await this.db.executeQuery<BudgetSummary>(
      TransactionQueries.GET_SUMMARY_BY_BUDGET,
      [startDate, endDate]
    );
    return result.rows._array;
  }
} 