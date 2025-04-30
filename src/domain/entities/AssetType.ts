export interface AssetType {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class AssetTypeEntity implements AssetType {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: AssetType) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static create(data: Omit<AssetType, 'id' | 'createdAt' | 'updatedAt'>): AssetTypeEntity {
    return new AssetTypeEntity({
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  update(data: Partial<Omit<AssetType, 'id' | 'createdAt' | 'updatedAt'>>): void {
    Object.assign(this, {
      ...data,
      updatedAt: new Date(),
    });
  }

}