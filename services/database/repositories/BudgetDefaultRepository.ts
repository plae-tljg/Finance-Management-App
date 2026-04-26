import { BudgetDefault, BudgetDefaultQueries, BudgetDefaultWithCategory } from '../schemas/BudgetDefault';
import { BaseRepository } from './BaseRepository';
import { QueryExecutor } from '../types';

export class BudgetDefaultRepository implements BaseRepository<BudgetDefault> {
  constructor(private db: QueryExecutor) {}

  async create(data: Omit<BudgetDefault, 'id' | 'createdAt' | 'updatedAt'>): Promise<BudgetDefault> {
    const result = await this.db.executeQuery<BudgetDefault>(
      BudgetDefaultQueries.INSERT,
      [data.categoryId, data.amount, data.period]
    );
    return {
      ...data,
      id: result.insertId!,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  async findAll(): Promise<BudgetDefaultWithCategory[]> {
    const result = await this.db.executeQuery<BudgetDefaultWithCategory>(
      BudgetDefaultQueries.FIND_ALL
    );
    return result.rows._array;
  }

  async findById(id: number): Promise<BudgetDefault | null> {
    const result = await this.db.executeQuery<BudgetDefault>(
      BudgetDefaultQueries.FIND_BY_ID,
      [id]
    );
    return result.rows._array[0] || null;
  }

  async findByCategoryId(categoryId: number): Promise<BudgetDefault | null> {
    const result = await this.db.executeQuery<BudgetDefault>(
      BudgetDefaultQueries.FIND_BY_CATEGORY_ID,
      [categoryId]
    );
    return result.rows._array[0] || null;
  }

  async update(id: number, data: Partial<BudgetDefault>): Promise<boolean> {
    const result = await this.db.executeQuery(
      BudgetDefaultQueries.UPDATE,
      [data.amount, data.period, id]
    );
    return (result.changes ?? 0) > 0;
  }

  async upsert(data: Omit<BudgetDefault, 'id' | 'createdAt' | 'updatedAt'>): Promise<BudgetDefault> {
    const existing = await this.findByCategoryId(data.categoryId);
    if (existing) {
      await this.update(existing.id, data);
      return { ...existing, ...data };
    } else {
      return await this.create(data);
    }
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db.executeQuery(
      BudgetDefaultQueries.DELETE,
      [id]
    );
    return (result.changes ?? 0) > 0;
  }

  async count(): Promise<number> {
    const result = await this.db.executeQuery<{count: number}>(
      BudgetDefaultQueries.COUNT_ALL
    );
    return result.rows._array[0]?.count ?? 0;
  }
}