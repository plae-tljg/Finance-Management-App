import { CategoryRepository } from '../database/repositories/CategoryRepository';
import { DEFAULT_CATEGORIES, type Category } from '../database/schemas/Category';
import { DatabaseServiceType } from '../database/DatabaseService';

export function useCategoryService(databaseService: DatabaseServiceType) {
  const repository = new CategoryRepository(databaseService);

  const getCategories = async () => {
    return await repository.findAll();
  };

  // Picker / quick-pick surfaces should only see active categories. The
  // "categories management" page calls findAll() directly so the user can
  // see (and re-activate) retired rows.
  const getActiveCategories = async () => {
    return await repository.findActive();
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

  /**
   * Bring the categories table back to the DEFAULT_CATEGORIES set:
   *   - Soft-delete any existing row whose name is NOT in DEFAULT_CATEGORIES
   *     (sets isActive = 0; preserves history so old transactions.categoryId
   *     still resolves to a row that renders its old name).
   *   - Re-activate any default row that is currently isActive = 0
   *     (lets the user undo a previous reset).
   *   - Insert any default that's missing entirely.
   *
   * Idempotent and safe to re-run.
   */
  const resetToDefaults = async () => {
    const existing = await repository.findAll();
    const existingByName = new Map(existing.map(c => [c.name, c]));
    const defaultNames = new Set(DEFAULT_CATEGORIES.map(c => c.name));

    let deactivated = 0;
    let reactivated = 0;
    let inserted = 0;

    // Walk every existing row, decide its fate.
    for (const row of existing) {
      if (defaultNames.has(row.name)) {
        // It's a default — make sure it's active.
        if (!row.isActive) {
          await repository.update(row.id, { isActive: true });
          reactivated += 1;
        }
      } else {
        // Not a default — soft-delete.
        if (row.isActive) {
          await repository.update(row.id, { isActive: false });
          deactivated += 1;
        }
      }
    }

    // Walk every default, insert any that doesn't exist.
    for (const def of DEFAULT_CATEGORIES) {
      if (!existingByName.has(def.name)) {
        await repository.create(def);
        inserted += 1;
      }
    }

    return { inserted, deactivated, reactivated };
  };

  return {
    getCategories,
    getActiveCategories,
    getCategoryById,
    getCategoriesByType,
    getCategoriesWithType,
    createCategory,
    updateCategory,
    deleteCategory,
    resetToDefaults,
  };
}