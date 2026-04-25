import { BaseRepository } from './BaseRepository';
import { QueryExecutor } from '../types';
import {
  RecurringTransaction,
  RecurringTransactionWithCategory,
  RecurringTransactionQueries,
} from '../schemas/RecurringTransaction';

export class RecurringTransactionRepository implements BaseRepository<RecurringTransaction> {
  constructor(private db: QueryExecutor) {}

  getDatabase(): QueryExecutor {
    return this.db;
  }

  async findById(id: number): Promise<RecurringTransaction | null> {
    const result = await this.db.executeQuery<RecurringTransaction>(
      RecurringTransactionQueries.FIND_BY_ID,
      [id]
    );
    return result.rows._array[0] || null;
  }

  async findAll(): Promise<RecurringTransactionWithCategory[]> {
    const result = await this.db.executeQuery<RecurringTransactionWithCategory>(
      RecurringTransactionQueries.FIND_ALL_WITH_CATEGORY
    );
    return result.rows._array;
  }

  async findAllActive(): Promise<RecurringTransactionWithCategory[]> {
    const result = await this.db.executeQuery<RecurringTransactionWithCategory>(
      RecurringTransactionQueries.FIND_ALL_ACTIVE
    );
    return result.rows._array;
  }

  async findDueForGeneration(): Promise<RecurringTransaction[]> {
    const result = await this.db.executeQuery<RecurringTransaction>(
      RecurringTransactionQueries.FIND_DUE_FOR_GENERATION
    );
    return result.rows._array;
  }

  async create(
    data: Omit<RecurringTransaction, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<RecurringTransaction> {
    const result = await this.db.executeQuery<RecurringTransaction>(
      RecurringTransactionQueries.INSERT,
      [
        data.name,
        data.amount,
        data.categoryId,
        data.budgetId,
        data.description,
        data.type,
        data.recurrenceType,
        data.recurrenceDay,
        data.startDate,
        data.endDate,
        data.lastGeneratedDate,
        data.nextDueDate,
        data.isActive ? 1 : 0,
      ]
    );

    const lastInsertId = result.insertId;
    if (!lastInsertId) {
      throw new Error('Failed to create recurring transaction');
    }

    const created = await this.findById(lastInsertId);
    if (!created) {
      throw new Error('Failed to retrieve created recurring transaction');
    }

    return created;
  }

  async update(
    id: number,
    data: Partial<RecurringTransaction>
  ): Promise<boolean> {
    const result = await this.db.executeQuery<RecurringTransaction>(
      RecurringTransactionQueries.UPDATE,
      [
        data.name,
        data.amount,
        data.categoryId,
        data.budgetId,
        data.description,
        data.type,
        data.recurrenceType,
        data.recurrenceDay,
        data.startDate,
        data.endDate,
        data.lastGeneratedDate,
        data.nextDueDate,
        data.isActive !== undefined ? (data.isActive ? 1 : 0) : null,
        id,
      ]
    );
    return (result.changes ?? 0) > 0;
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db.executeQuery<RecurringTransaction>(
      RecurringTransactionQueries.DELETE,
      [id]
    );
    return (result.changes ?? 0) > 0;
  }

  async count(): Promise<number> {
    const result = await this.db.executeQuery<{ count: number }>(
      RecurringTransactionQueries.COUNT_ALL
    );
    return result.rows._array[0]?.count ?? 0;
  }

  async countDue(): Promise<number> {
    const result = await this.db.executeQuery<{ count: number }>(
      RecurringTransactionQueries.COUNT_DUE
    );
    return result.rows._array[0]?.count ?? 0;
  }

  async findByIdWithCategory(id: number): Promise<RecurringTransactionWithCategory | null> {
    const result = await this.db.executeQuery<RecurringTransactionWithCategory>(
      RecurringTransactionQueries.FIND_BY_ID_WITH_CATEGORY,
      [id]
    );
    return result.rows._array[0] || null;
  }

  async findByCategoryId(categoryId: number): Promise<RecurringTransaction[]> {
    const result = await this.db.executeQuery<RecurringTransaction>(
      RecurringTransactionQueries.FIND_BY_CATEGORY_ID,
      [categoryId]
    );
    return result.rows._array;
  }

  async updateLastGenerated(id: number, generatedDate: string, nextDueDate: string): Promise<boolean> {
    const result = await this.db.executeQuery(
      `UPDATE recurring_transactions
       SET lastGeneratedDate = ?, nextDueDate = ?, updatedAt = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [generatedDate, nextDueDate, id]
    );
    return (result.changes ?? 0) > 0;
  }
}