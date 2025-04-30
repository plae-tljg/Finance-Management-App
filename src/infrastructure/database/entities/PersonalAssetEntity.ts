import { PersonalAsset } from '../../../domain/entities/PeronsalAsset';

export class PersonalAssetEntity {
  static readonly TABLE_NAME = 'personal_assets';
  
  static readonly CREATE_TABLE_SQL = `
    CREATE TABLE IF NOT EXISTS ${PersonalAssetEntity.TABLE_NAME} (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type_id TEXT NOT NULL,
      purchase_date TEXT NOT NULL,
      purchase_price REAL NOT NULL,
      current_value REAL NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (type_id) REFERENCES asset_types (id)
    );
  `;

  static toDomain(row: any): PersonalAsset {
    return {
      id: row.id,
      name: row.name,
      typeId: row.type_id,
      purchaseDate: new Date(row.purchase_date),
      purchasePrice: row.purchase_price,
      currentValue: row.current_value,
      description: row.description,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  static toPersistence(asset: PersonalAsset): any {
    return {
      id: asset.id,
      name: asset.name,
      type_id: asset.typeId,
      purchase_date: asset.purchaseDate.toISOString(),
      purchase_price: asset.purchasePrice,
      current_value: asset.currentValue,
      description: asset.description,
      created_at: asset.createdAt.toISOString(),
      updated_at: asset.updatedAt.toISOString()
    };
  }
} 