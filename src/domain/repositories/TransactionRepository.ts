import { Transaction } from '../entities/Transaction';

export interface TransactionRepository {
  findById(id: string): Promise<Transaction | null>;
  findAll(): Promise<Transaction[]>;
  findByCategoryId(categoryId: string): Promise<Transaction[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]>;
  save(transaction: Transaction): Promise<void>;
  update(transaction: Transaction): Promise<void>;
  delete(id: string): Promise<void>;
  getTotalAmountByType(type: 'income' | 'expense'): Promise<number>;
  getTotalAmountByCategory(categoryId: string): Promise<number>;
} 