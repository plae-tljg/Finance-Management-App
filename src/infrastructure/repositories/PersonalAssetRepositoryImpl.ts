import { PersonalAsset } from '../../domain/entities/PeronsalAsset';
import { BaseRepository } from './BaseRepository';
import { PersonalAssetEntity } from '../database/entities/PersonalAssetEntity';

export class PersonalAssetRepositoryImpl extends BaseRepository<PersonalAsset> {
  async findAll(): Promise<PersonalAsset[]> {
    const rows = await this.executeQuery<any>(`SELECT * FROM ${PersonalAssetEntity.TABLE_NAME}`);
    return rows.map(PersonalAssetEntity.toDomain);
  }

  async findById(id: string): Promise<PersonalAsset | null> {
    const rows = await this.executeQuery<any>(
      `SELECT * FROM ${PersonalAssetEntity.TABLE_NAME} WHERE id = ?`,
      [id]
    );
    return rows.length > 0 ? PersonalAssetEntity.toDomain(rows[0]) : null;
  }

  async create(asset: PersonalAsset): Promise<void> {
    const data = PersonalAssetEntity.toPersistence(asset);
    await this.executeUpdate(
      `INSERT INTO ${PersonalAssetEntity.TABLE_NAME} (id, name, type_id, purchase_date, purchase_price, current_value, description, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.id,
        data.name,
        data.type_id,
        data.purchase_date,
        data.purchase_price,
        data.current_value,
        data.description,
        data.created_at,
        data.updated_at
      ]
    );
  }

  async update(asset: PersonalAsset): Promise<void> {
    const data = PersonalAssetEntity.toPersistence(asset);
    await this.executeUpdate(
      `UPDATE ${PersonalAssetEntity.TABLE_NAME}
       SET name = ?, type_id = ?, purchase_date = ?, purchase_price = ?, current_value = ?, description = ?, updated_at = ?
       WHERE id = ?`,
      [
        data.name,
        data.type_id,
        data.purchase_date,
        data.purchase_price,
        data.current_value,
        data.description,
        data.updated_at,
        data.id
      ]
    );
  }

  async delete(id: string): Promise<void> {
    await this.executeUpdate(
      `DELETE FROM ${PersonalAssetEntity.TABLE_NAME} WHERE id = ?`,
      [id]
    );
  }

  async findByType(typeId: string): Promise<PersonalAsset[]> {
    const rows = await this.executeQuery<any>(
      `SELECT * FROM ${PersonalAssetEntity.TABLE_NAME} WHERE type_id = ?`,
      [typeId]
    );
    return rows.map(PersonalAssetEntity.toDomain);
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<PersonalAsset[]> {
    const rows = await this.executeQuery<any>(
      `SELECT * FROM ${PersonalAssetEntity.TABLE_NAME} WHERE purchase_date BETWEEN ? AND ?`,
      [startDate.toISOString(), endDate.toISOString()]
    );
    return rows.map(PersonalAssetEntity.toDomain);
  }
} 