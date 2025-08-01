import { BudgetRepository } from '../database/repositories/BudgetRepository';
import type { Budget } from '../database/schemas/Budget';
import type { BudgetWithCategory } from '../database/repositories/BudgetRepository';
import { DatabaseService } from '../database/DatabaseService';

export function useBudgetService(databaseService: DatabaseService) {
  const repository = new BudgetRepository(databaseService);
  
  const getBudgets = async (): Promise<Budget[]> => {
    return await repository.findAll();
  };

  const getBudgetById = async (id: number): Promise<Budget | null> => {
    return await repository.findById(id);
  };
  
  const createBudget = async (
    budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Budget> => {
    return await repository.create(budget);
  };
  
  const updateBudget = async (
    id: number,
    budget: Partial<Budget>
  ): Promise<boolean> => {
    return await repository.update(id, budget);
  };
  
  const deleteBudget = async (id: number): Promise<boolean> => {
    return await repository.delete(id);
  };

  const getBudgetsByCategory = async (categoryId: number) => {
    return await repository.findByCategoryId(categoryId);
  };

  const getBudgetsByDateRange = async (startDate: string, endDate: string) => {
    return await repository.findByDateRange(startDate, endDate);
  };

  const getBudgetsByPeriod = async (period: Budget['period']) => {
    return await repository.findByPeriod(period);
  };

  const getActiveBudgets = async (date: string) => {
    return await repository.getActiveBudgets(date);
  };

  const getBudgetsWithCategory = async () => {
    try {
      console.log('开始获取预算记录...');
      const budgets = await repository.findAllWithCategory();
      console.log('获取到的预算记录:', budgets);
      return budgets;
    } catch (error) {
      console.error('获取预算记录失败:', error);
      return [];
    }
  };

  const getBudgetsByMonth = async (year: number, month: number): Promise<Budget[]> => {
    const monthStr = `${year}-${month.toString().padStart(2, '0')}`;
    return await repository.findByMonth(monthStr);
  };

  const getBudgetsByMonthWithCategory = async (year: number, month: number): Promise<BudgetWithCategory[]> => {
    const monthStr = `${year}-${month.toString().padStart(2, '0')}`;
    return await repository.findByMonthWithCategory(monthStr);
  };

  const getBudgetWithCategory = async (id: number): Promise<Budget | null> => {
    return await repository.findByIdWithCategory(id);
  };
  
  return {
    getBudgets,
    getBudgetById,
    createBudget,
    updateBudget,
    deleteBudget,
    getBudgetsByCategory,
    getBudgetsByDateRange,
    getBudgetsByPeriod,
    getActiveBudgets,
    getBudgetsWithCategory,
    getBudgetsByMonth,
    getBudgetsByMonthWithCategory,
    getBudgetWithCategory
  };
} 