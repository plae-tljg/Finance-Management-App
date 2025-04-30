export interface PersonalAsset {
  id: string;
  name: string;
  typeId: string;  // 关联到 AssetType
  purchaseDate: Date;
  purchasePrice: number;
  currentValue: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class PersonalAssetEntity implements PersonalAsset {
  id: string;
  name: string;
  typeId: string;
  purchaseDate: Date;
  purchasePrice: number;
  currentValue: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: PersonalAsset) {
    this.id = data.id;
    this.name = data.name;
    this.typeId = data.typeId;
    this.purchaseDate = data.purchaseDate;
    this.purchasePrice = data.purchasePrice;
    this.currentValue = data.currentValue;
    this.description = data.description;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static create(data: Omit<PersonalAsset, 'id' | 'createdAt' | 'updatedAt'>): PersonalAssetEntity {
    return new PersonalAssetEntity({
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  update(data: Partial<Omit<PersonalAsset, 'id' | 'createdAt' | 'updatedAt'>>): void {
    Object.assign(this, {
      ...data,
      updatedAt: new Date(),
    });
  }
}
