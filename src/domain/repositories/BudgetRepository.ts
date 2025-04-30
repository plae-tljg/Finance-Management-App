import { Budget } from '../entities/Budget';

export interface BudgetRepository {
  findById(id: string): Promise<Budget | null>;
  findAll(): Promise<Budget[]>;
  findByCategoryId(categoryId: string): Promise<Budget[]>;
  findActive(): Promise<Budget[]>;
  save(budget: Budget): Promise<void>;
  update(budget: Budget): Promise<void>;
  delete(id: string): Promise<void>;
  getTotalBudgetAmount(): Promise<number>;
  getTotalBudgetAmountByCategory(categoryId: string): Promise<number>;
  getTotalSpentAmountByCategory(categoryId: string): Promise<number>;
} 