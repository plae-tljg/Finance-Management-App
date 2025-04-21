import { CategoryRepository } from '../database/repositories/CategoryRepository';
import type { Category } from '../database/schemas/Category';
import { DatabaseService } from '../database/DatabaseService';

export function useCategoryService(databaseService: DatabaseService) {
  const repository = new CategoryRepository(databaseService);
  
  const getCategories = async () => {
    return await repository.findAll();
  };

  const getCategoryById = async (id: number) => {
    return await repository.findById(id);
  };
  
  const getCategoriesByType = async (type: 'income' | 'expense') => {
    return await repository.findByType(type);
  };

  const getCategoriesWithType = async () => {
    return await repository.findAllWithType();
  };
  
  const createCategory = async (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => {
    return await repository.create(category);
  };
  
  const updateCategory = async (id: number, category: Partial<Category>) => {
    return await repository.update(id, category);
  };
  
  const deleteCategory = async (id: number) => {
    return await repository.delete(id);
  };
  
  return {
    getCategories,
    getCategoryById,
    getCategoriesByType,
    getCategoriesWithType,
    createCategory,
    updateCategory,
    deleteCategory
  };
} 