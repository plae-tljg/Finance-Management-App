import { BudgetDefaultRepository } from '../database/repositories/BudgetDefaultRepository';
import { BudgetDefault } from '../database/schemas/BudgetDefault';
import { DatabaseService } from '../database/DatabaseService';
import { BudgetRepository } from '../database/repositories/BudgetRepository';

export function useBudgetDefaultService(databaseService: DatabaseService) {
  const repository = new BudgetDefaultRepository(databaseService);
  const budgetRepository = new BudgetRepository(databaseService);

  const getAllDefaults = async () => {
    return await repository.findAll();
  };

  const getDefaultByCategoryId = async (categoryId: number) => {
    return await repository.findByCategoryId(categoryId);
  };

  const updateDefault = async (categoryId: number, amount: number, period: string = 'monthly') => {
    return await repository.upsert({ categoryId, amount, period: period as any });
  };

  const deleteDefault = async (categoryId: number) => {
    return await repository.delete(categoryId);
  };

  const createMonthlyBudgetsFromDefaults = async (year: number, month: number) => {
    const defaults = await repository.findAll();
    const monthStr = `${year}-${month.toString().padStart(2, '0')}`;
    const startDate = `${monthStr}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${monthStr}-${lastDay.toString().padStart(2, '0')}`;

    const results = [];
    for (const defaultItem of defaults) {
      const existingBudgets = await budgetRepository.findByCategoryAndMonth(defaultItem.categoryId, monthStr);
      if (existingBudgets.length === 0) {
        const budgetName = defaultItem.categoryName ? `预算-${defaultItem.categoryName}` : `预算`;
        const newBudget = await budgetRepository.create({
          name: budgetName,
          description: '由默认设置创建',
          categoryId: defaultItem.categoryId,
          accountId: null,
          amount: defaultItem.amount,
          period: 'monthly',
          startDate,
          endDate,
          month: monthStr,
          isRegular: true,
          isBudgetExceeded: false
        });
        results.push(newBudget);
      }
    }
    return results;
  };

  return {
    getAllDefaults,
    getDefaultByCategoryId,
    updateDefault,
    deleteDefault,
    createMonthlyBudgetsFromDefaults
  };
}