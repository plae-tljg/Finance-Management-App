import { BudgetPeriod } from '../enums/enum';

export interface Budget {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  amount: number;
  period: BudgetPeriod;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class BudgetEntity implements Budget {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  amount: number;
  period: BudgetPeriod;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Budget) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.categoryId = data.categoryId;
    this.amount = data.amount;
    this.period = data.period;
    this.startDate = data.startDate;
    this.endDate = data.endDate;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static create(data: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>): BudgetEntity {
    return new BudgetEntity({
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  update(data: Partial<Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>>): void {
    Object.assign(this, {
      ...data,
      updatedAt: new Date(),
    });
  }

  isActive(): boolean {
    const now = new Date();
    return now >= this.startDate && now <= this.endDate;
  }

  getRemainingAmount(spentAmount: number): number {
    return this.amount - spentAmount;
  }
} 