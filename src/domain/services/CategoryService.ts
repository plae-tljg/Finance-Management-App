import { CategoryRepository } from '../repositories/CategoryRepository';
import { Category } from '../entities/Category';
import { TransactionType } from '../entities/Transaction';

export class CategoryService {
  constructor(private categoryRepository: CategoryRepository) {}

  async findAll(): Promise<Category[]> {
    return this.categoryRepository.findAll();
  }

  async findById(id: string): Promise<Category | null> {
    return this.categoryRepository.findById(id);
  }

  async findByType(type: TransactionType): Promise<Category[]> {
    return this.categoryRepository.findByType(type);
  }

  async save(category: Category): Promise<void> {
    return this.categoryRepository.save(category);
  }

  async update(category: Category): Promise<void> {
    return this.categoryRepository.update(category);
  }

  async delete(id: string): Promise<void> {
    return this.categoryRepository.delete(id);
  }

  async getDefaultCategories(): Promise<Category[]> {
    return this.categoryRepository.getDefaultCategories();
  }
} 