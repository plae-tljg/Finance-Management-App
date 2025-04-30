import { AssetType } from '../../domain/entities/AssetType';
import { BaseRepository } from './BaseRepository';
import { AssetTypeEntity } from '../database/entities/AssetTypeEntity';

export class AssetTypeRepositoryImpl extends BaseRepository<AssetType> {
  async findAll(): Promise<AssetType[]> {
    const rows = await this.executeQuery<any>(`SELECT * FROM ${AssetTypeEntity.TABLE_NAME}`);
    return rows.map(AssetTypeEntity.toDomain);
  }

  async findById(id: string): Promise<AssetType | null> {
    const rows = await this.executeQuery<any>(
      `SELECT * FROM ${AssetTypeEntity.TABLE_NAME} WHERE id = ?`,
      [id]
    );
    return rows.length > 0 ? AssetTypeEntity.toDomain(rows[0]) : null;
  }

  async create(assetType: AssetType): Promise<void> {
    const data = AssetTypeEntity.toPersistence(assetType);
    await this.executeUpdate(
      `INSERT INTO ${AssetTypeEntity.TABLE_NAME} (id, name, description, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [
        data.id,
        data.name,
        data.description,
        data.created_at,
        data.updated_at
      ]
    );
  }

  async update(assetType: AssetType): Promise<void> {
    const data = AssetTypeEntity.toPersistence(assetType);
    await this.executeUpdate(
      `UPDATE ${AssetTypeEntity.TABLE_NAME}
       SET name = ?, description = ?, updated_at = ?
       WHERE id = ?`,
      [
        data.name,
        data.description,
        data.updated_at,
        data.id
      ]
    );
  }

  async delete(id: string): Promise<void> {
    await this.executeUpdate(
      `DELETE FROM ${AssetTypeEntity.TABLE_NAME} WHERE id = ?`,
      [id]
    );
  }
} 