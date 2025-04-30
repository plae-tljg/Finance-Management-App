import { Transaction } from '../../domain/entities/Transaction';
import { BaseRepository } from './BaseRepository';
import { TransactionEntity } from '../database/entities/TransactionEntity';

export class TransactionRepositoryImpl extends BaseRepository<Transaction> {
  async findAll(): Promise<Transaction[]> {
    const rows = await this.executeQuery<any>(`SELECT * FROM ${TransactionEntity.TABLE_NAME}`);
    return rows.map(TransactionEntity.toDomain);
  }

  async findById(id: string): Promise<Transaction | null> {
    const rows = await this.executeQuery<any>(
      `SELECT * FROM ${TransactionEntity.TABLE_NAME} WHERE id = ?`,
      [id]
    );
    return rows.length > 0 ? TransactionEntity.toDomain(rows[0]) : null;
  }

  async create(transaction: Transaction): Promise<void> {
    const data = TransactionEntity.toPersistence(transaction);
    await this.executeUpdate(
      `INSERT INTO ${TransactionEntity.TABLE_NAME} (id, name, description, amount, type, category_id, date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.id,
        data.name,
        data.description,
        data.amount,
        data.type,
        data.category_id,
        data.date,
        data.created_at,
        data.updated_at
      ]
    );
  }

  async update(transaction: Transaction): Promise<void> {
    const data = TransactionEntity.toPersistence(transaction);
    await this.executeUpdate(
      `UPDATE ${TransactionEntity.TABLE_NAME}
       SET name = ?, description = ?, amount = ?, type = ?, category_id = ?, date = ?, updated_at = ?
       WHERE id = ?`,
      [
        data.name,
        data.description,
        data.amount,
        data.type,
        data.category_id,
        data.date,
        data.updated_at,
        data.id
      ]
    );
  }

  async delete(id: string): Promise<void> {
    await this.executeUpdate(
      `DELETE FROM ${TransactionEntity.TABLE_NAME} WHERE id = ?`,
      [id]
    );
  }

  async findByCategory(categoryId: string): Promise<Transaction[]> {
    const rows = await this.executeQuery<any>(
      `SELECT * FROM ${TransactionEntity.TABLE_NAME} WHERE category_id = ?`,
      [categoryId]
    );
    return rows.map(TransactionEntity.toDomain);
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
    const rows = await this.executeQuery<any>(
      `SELECT * FROM ${TransactionEntity.TABLE_NAME} WHERE date BETWEEN ? AND ?`,
      [startDate.toISOString(), endDate.toISOString()]
    );
    return rows.map(TransactionEntity.toDomain);
  }

  async findByCategoryId(categoryId: string): Promise<Transaction[]> {
    return this.findByCategory(categoryId);
  }

  async save(transaction: Transaction): Promise<void> {
    await this.create(transaction);
  }

  async getTotalAmountByType(type: 'income' | 'expense'): Promise<number> {
    const rows = await this.executeQuery<any>(
      `SELECT SUM(amount) as total FROM ${TransactionEntity.TABLE_NAME} WHERE type = ?`,
      [type]
    );
    return rows[0]?.total || 0;
  }

  async getTotalAmountByCategory(categoryId: string): Promise<number> {
    const rows = await this.executeQuery<any>(
      `SELECT SUM(amount) as total FROM ${TransactionEntity.TABLE_NAME} WHERE category_id = ?`,
      [categoryId]
    );
    return rows[0]?.total || 0;
  }
} 