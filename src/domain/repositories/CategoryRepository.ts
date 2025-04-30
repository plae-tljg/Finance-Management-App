import { Category } from '../entities/Category';
import { TransactionType } from '../entities/Transaction';

export interface CategoryRepository {
  findById(id: string): Promise<Category | null>;
  findAll(): Promise<Category[]>;
  findByType(type: TransactionType): Promise<Category[]>;
  save(category: Category): Promise<void>;
  update(category: Category): Promise<void>;
  delete(id: string): Promise<void>;
  getDefaultCategories(): Promise<Category[]>;
} 