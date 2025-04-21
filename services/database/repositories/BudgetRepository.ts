import { Budget, BudgetFields, UpdatableFields } from '../schemas/Budget';
import { BudgetQueries } from '../schemas/Budget';
import { BaseRepository } from './BaseRepository';
import { QueryExecutor } from '../types';

export interface BudgetWithCategory extends Budget {
  categoryName: string;
  categoryIcon: string;
  spent: number;
}

export class BudgetRepository implements BaseRepository<Budget> {
  constructor(private db: QueryExecutor) {}

  getDatabase(): QueryExecutor {
    return this.db;
  }

  async findById(id: number): Promise<Budget | null> {
    const result = await this.db.executeQuery<Budget>(
      BudgetQueries.FIND_BY_ID,
      [id]
    );
    return result.rows._array[0] || null;
  }

  async findAll(): Promise<BudgetWithCategory[]> {
    const result = await this.db.executeQuery<BudgetWithCategory>(
      BudgetQueries.FIND_ALL_WITH_CATEGORY
    );
    return result.rows._array;
  }

  async create(budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>): Promise<Budget> {
    try {
      // 执行插入操作
      const insertResult = await this.db.executeQuery<Budget>(
        BudgetQueries.INSERT,
        [
          budget.name,
          budget.categoryId,
          budget.amount,
          budget.period,
          budget.startDate,
          budget.endDate,
          budget.month
        ]
      );

      // 获取最后插入的记录的ID
      const lastInsertId = insertResult.insertId;
      if (!lastInsertId) {
        throw new Error('创建预算失败：无法获取插入的ID');
      }

      // 查询并返回插入的记录
      const createdBudget = await this.findById(lastInsertId);
      if (!createdBudget) {
        throw new Error('创建预算失败：无法获取创建的记录');
      }

      return createdBudget;
    } catch (error) {
      console.error('创建预算失败:', error);
      throw error;
    }
  }

  async update(id: number, budget: Partial<Budget>): Promise<boolean> {
    const result = await this.db.executeQuery<Budget>(
      BudgetQueries.UPDATE,
      [
        budget.name,
        budget.categoryId,
        budget.amount,
        budget.period,
        budget.startDate,
        budget.endDate,
        budget.month,
        id
      ]
    );
    return (result.changes ?? 0) > 0;
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db.executeQuery<Budget>(
      BudgetQueries.DELETE,
      [id]
    );
    return (result.changes ?? 0) > 0;
  }

  async count(): Promise<number> {
    const result = await this.db.executeQuery<{count: number}>(
      BudgetQueries.COUNT_ALL
    );
    return result.rows._array[0]?.count ?? 0;
  }

  async findByCategoryId(categoryId: number): Promise<Budget[]> {
    const result = await this.db.executeQuery<Budget>(
      BudgetQueries.FIND_BY_CATEGORY_ID,
      [categoryId]
    );
    return result.rows._array;
  }

  async findByDateRange(startDate: string, endDate: string): Promise<Budget[]> {
    const result = await this.db.executeQuery<Budget>(
      BudgetQueries.FIND_BY_DATE_RANGE,
      [startDate, endDate]
    );
    return result.rows._array;
  }

  async findByPeriod(period: Budget['period']): Promise<Budget[]> {
    const result = await this.db.executeQuery<Budget>(
      BudgetQueries.FIND_BY_PERIOD,
      [period]
    );
    return result.rows._array;
  }

  async findByMonth(month: string): Promise<Budget[]> {
    const result = await this.db.executeQuery<Budget>(
      BudgetQueries.FIND_BY_MONTH,
      [month]
    );
    return result.rows._array;
  }

  async getActiveBudgets(date: string): Promise<Budget[]> {
    const result = await this.db.executeQuery<Budget>(
      BudgetQueries.FIND_ACTIVE,
      [date]
    );
    return result.rows._array;
  }

  async findAllWithCategory(): Promise<BudgetWithCategory[]> {
    const result = await this.db.executeQuery<BudgetWithCategory>(
      BudgetQueries.FIND_ALL_WITH_CATEGORY
    );
    return result.rows._array;
  }

  async findByIdWithCategory(id: number): Promise<BudgetWithCategory | null> {
    const result = await this.db.executeQuery<BudgetWithCategory>(
      BudgetQueries.FIND_BY_ID_WITH_CATEGORY,
      [id]
    );
    return result.rows._array[0] || null;
  }
} 