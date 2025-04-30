import { Category } from '../../domain/entities/Category';
import { BaseRepository } from './BaseRepository';
import { CategoryEntity } from '../database/entities/CategoryEntity';

export class CategoryRepositoryImpl extends BaseRepository<Category> {
  async findAll(): Promise<Category[]> {
    const rows = await this.executeQuery<any>(`SELECT * FROM ${CategoryEntity.TABLE_NAME}`);
    return rows.map(CategoryEntity.toDomain);
  }

  async findById(id: string): Promise<Category | null> {
    const rows = await this.executeQuery<any>(
      `SELECT * FROM ${CategoryEntity.TABLE_NAME} WHERE id = ?`,
      [id]
    );
    return rows.length > 0 ? CategoryEntity.toDomain(rows[0]) : null;
  }

  async create(category: Category): Promise<void> {
    const data = CategoryEntity.toPersistence(category);
    await this.executeUpdate(
      `INSERT INTO ${CategoryEntity.TABLE_NAME} (id, name, description, type, icon, color, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.id,
        data.name,
        data.description,
        data.type,
        data.icon,
        data.color,
        data.created_at,
        data.updated_at
      ]
    );
  }

  async update(category: Category): Promise<void> {
    const data = CategoryEntity.toPersistence(category);
    await this.executeUpdate(
      `UPDATE ${CategoryEntity.TABLE_NAME}
       SET name = ?, description = ?, type = ?, icon = ?, color = ?, updated_at = ?
       WHERE id = ?`,
      [
        data.name,
        data.description,
        data.type,
        data.icon,
        data.color,
        data.updated_at,
        data.id
      ]
    );
  }

  async delete(id: string): Promise<void> {
    await this.executeUpdate(
      `DELETE FROM ${CategoryEntity.TABLE_NAME} WHERE id = ?`,
      [id]
    );
  }

  async findByType(type: string): Promise<Category[]> {
    const rows = await this.executeQuery<any>(
      `SELECT * FROM ${CategoryEntity.TABLE_NAME} WHERE type = ?`,
      [type]
    );
    return rows.map(CategoryEntity.toDomain);
  }

  async save(category: Category): Promise<void> {
    await this.create(category);
  }

  async getDefaultCategories(): Promise<Category[]> {
    const rows = await this.executeQuery<any>(
      `SELECT * FROM ${CategoryEntity.TABLE_NAME} WHERE is_default = 1`
    );
    return rows.map(CategoryEntity.toDomain);
  }
} 