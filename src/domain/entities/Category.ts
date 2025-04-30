import { TransactionType } from './Transaction';

export interface Category {
  id: string;
  name: string;
  description?: string;
  type: TransactionType;
  icon: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CategoryEntity implements Category {
  id: string;
  name: string;
  description?: string;
  type: TransactionType;
  icon: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Category) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.type = data.type;
    this.icon = data.icon;
    this.color = data.color;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static create(data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): CategoryEntity {
    return new CategoryEntity({
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  update(data: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>): void {
    Object.assign(this, {
      ...data,
      updatedAt: new Date(),
    });
  }
} 