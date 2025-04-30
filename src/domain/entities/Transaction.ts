export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  name: string;
  description?: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class TransactionEntity implements Transaction {
  id: string;
  name: string;
  description?: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Transaction) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.amount = data.amount;
    this.type = data.type;
    this.categoryId = data.categoryId;
    this.date = data.date;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static create(data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): TransactionEntity {
    return new TransactionEntity({
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  update(data: Partial<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>>): void {
    Object.assign(this, {
      ...data,
      updatedAt: new Date(),
    });
  }
} 