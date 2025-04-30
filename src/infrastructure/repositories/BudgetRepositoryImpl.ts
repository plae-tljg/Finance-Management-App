import { Budget } from '../../domain/entities/Budget';
import { BaseRepository } from './BaseRepository';
import { BudgetEntity } from '../database/entities/BudgetEntity';
import { TransactionEntity } from '../database/entities/TransactionEntity';

export class BudgetRepositoryImpl extends BaseRepository<Budget> {
  async findAll(): Promise<Budget[]> {
    const rows = await this.executeQuery<any>(`SELECT * FROM ${BudgetEntity.TABLE_NAME}`);
    return rows.map(BudgetEntity.toDomain);
  }

  async findById(id: string): Promise<Budget | null> {
    const rows = await this.executeQuery<any>(
      `SELECT * FROM ${BudgetEntity.TABLE_NAME} WHERE id = ?`,
      [id]
    );
    return rows.length > 0 ? BudgetEntity.toDomain(rows[0]) : null;
  }

  async create(budget: Budget): Promise<void> {
    const data = BudgetEntity.toPersistence(budget);
    await this.executeUpdate(
      `INSERT INTO ${BudgetEntity.TABLE_NAME} (id, name, description, category_id, amount, period, start_date, end_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.id,
        data.name,
        data.description,
        data.category_id,
        data.amount,
        data.period,
        data.start_date,
        data.end_date,
        data.created_at,
        data.updated_at
      ]
    );
  }

  async update(budget: Budget): Promise<void> {
    const data = BudgetEntity.toPersistence(budget);
    await this.executeUpdate(
      `UPDATE ${BudgetEntity.TABLE_NAME}
       SET name = ?, description = ?, category_id = ?, amount = ?, period = ?, start_date = ?, end_date = ?, updated_at = ?
       WHERE id = ?`,
      [
        data.name,
        data.description,
        data.category_id,
        data.amount,
        data.period,
        data.start_date,
        data.end_date,
        data.updated_at,
        data.id
      ]
    );
  }

  async delete(id: string): Promise<void> {
    await this.executeUpdate(
      `DELETE FROM ${BudgetEntity.TABLE_NAME} WHERE id = ?`,
      [id]
    );
  }

  async findByCategory(categoryId: string): Promise<Budget[]> {
    const rows = await this.executeQuery<any>(
      `SELECT * FROM ${BudgetEntity.TABLE_NAME} WHERE category_id = ?`,
      [categoryId]
    );
    return rows.map(BudgetEntity.toDomain);
  }

  async findActive(): Promise<Budget[]> {
    const now = new Date().toISOString();
    const rows = await this.executeQuery<any>(
      `SELECT * FROM ${BudgetEntity.TABLE_NAME} WHERE start_date <= ? AND end_date >= ?`,
      [now, now]
    );
    return rows.map(BudgetEntity.toDomain);
  }

  async findByCategoryId(categoryId: string): Promise<Budget[]> {
    const rows = await this.executeQuery<any>(
      `SELECT * FROM ${BudgetEntity.TABLE_NAME} WHERE category_id = ?`,
      [categoryId]
    );
    return rows.map(BudgetEntity.toDomain);
  }

  async save(budget: Budget): Promise<void> {
    await this.create(budget);
  }

  async getTotalBudgetAmount(): Promise<number> {
    const rows = await this.executeQuery<any>(
      `SELECT SUM(amount) as total FROM ${BudgetEntity.TABLE_NAME}`
    );
    return rows[0]?.total || 0;
  }

  async getTotalBudgetAmountByCategory(categoryId: string): Promise<number> {
    const rows = await this.executeQuery<any>(
      `SELECT SUM(amount) as total FROM ${BudgetEntity.TABLE_NAME} WHERE category_id = ?`,
      [categoryId]
    );
    return rows[0]?.total || 0;
  }

  async getTotalSpentAmountByCategory(categoryId: string): Promise<number> {
    const rows = await this.executeQuery<any>(
      `SELECT SUM(amount) as total FROM ${TransactionEntity.TABLE_NAME} 
       WHERE category_id = ? AND type = 'expense'`,
      [categoryId]
    );
    return rows[0]?.total || 0;
  }
} 