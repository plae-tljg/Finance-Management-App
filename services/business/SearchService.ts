import { TransactionRepository } from '../database/repositories/TransactionRepository';
import { BudgetRepository } from '../database/repositories/BudgetRepository';
import { CategoryRepository } from '../database/repositories/CategoryRepository';
import { DatabaseService } from '../database/DatabaseService';

export interface TransactionFilter {
  searchText?: string;
  categoryIds?: number[];
  type?: 'income' | 'expense' | null;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  budgetIds?: number[];
}

export interface BudgetFilter {
  categoryIds?: number[];
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
  month?: string;
  isRegular?: boolean | null;
  isBudgetExceeded?: boolean | null;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  transactionCount: number;
  averageTransactionAmount: number;
}

export interface CategorySummary {
  categoryId: number;
  categoryName: string;
  categoryIcon: string;
  total: number;
  count: number;
  percentage: number;
  type: 'income' | 'expense';
}

export function createSearchService(databaseService: DatabaseService) {
  const transactionRepo = new TransactionRepository(databaseService);
  const budgetRepo = new BudgetRepository(databaseService);
  const categoryRepo = new CategoryRepository(databaseService);

  const searchTransactions = async (filter: TransactionFilter): Promise<any[]> => {
    let transactions = await transactionRepo.findAllWithCategory();

    if (filter.searchText) {
      const searchLower = filter.searchText.toLowerCase();
      transactions = transactions.filter(t =>
        t.description?.toLowerCase().includes(searchLower) ||
        t.categoryName?.toLowerCase().includes(searchLower)
      );
    }

    if (filter.categoryIds && filter.categoryIds.length > 0) {
      transactions = transactions.filter(t => filter.categoryIds!.includes(t.categoryId));
    }

    if (filter.type) {
      transactions = transactions.filter(t => t.type === filter.type);
    }

    if (filter.startDate) {
      transactions = transactions.filter(t => t.date >= filter.startDate!);
    }

    if (filter.endDate) {
      transactions = transactions.filter(t => t.date <= filter.endDate!);
    }

    if (filter.minAmount !== undefined) {
      transactions = transactions.filter(t => t.amount >= filter.minAmount!);
    }

    if (filter.maxAmount !== undefined) {
      transactions = transactions.filter(t => t.amount <= filter.maxAmount!);
    }

    if (filter.budgetIds && filter.budgetIds.length > 0) {
      transactions = transactions.filter(t => filter.budgetIds!.includes(t.budgetId));
    }

    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const searchBudgets = async (filter: BudgetFilter): Promise<any[]> => {
    let budgets = await budgetRepo.findAllWithCategory();

    if (filter.categoryIds && filter.categoryIds.length > 0) {
      budgets = budgets.filter(b => filter.categoryIds!.includes(b.categoryId));
    }

    if (filter.period) {
      budgets = budgets.filter(b => b.period === filter.period);
    }

    if (filter.month) {
      budgets = budgets.filter(b => b.month === filter.month);
    }

    if (filter.isRegular !== null && filter.isRegular !== undefined) {
      budgets = budgets.filter(b => b.isRegular === filter.isRegular);
    }

    if (filter.isBudgetExceeded !== null && filter.isBudgetExceeded !== undefined) {
      budgets = budgets.filter(b => b.isBudgetExceeded === filter.isBudgetExceeded);
    }

    return budgets;
  };

  const getTransactionSummary = async (filter?: TransactionFilter): Promise<TransactionSummary> => {
    let transactions = filter
      ? await searchTransactions(filter)
      : await transactionRepo.findAll();

    const income = transactions.filter(t => t.type === 'income');
    const expense = transactions.filter(t => t.type === 'expense');

    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = expense.reduce((sum, t) => sum + t.amount, 0);
    const transactionCount = transactions.length;
    const averageTransactionAmount = transactionCount > 0
      ? (totalIncome + totalExpense) / transactionCount
      : 0;

    return {
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
      transactionCount,
      averageTransactionAmount,
    };
  };

  const getCategoryBreakdown = async (
    startDate?: string,
    endDate?: string,
    type?: 'income' | 'expense'
  ): Promise<CategorySummary[]> => {
    const filter: TransactionFilter = { type: type || 'expense' };
    if (startDate) filter.startDate = startDate;
    if (endDate) filter.endDate = endDate;

    const transactions = await searchTransactions(filter);
    const categories = await categoryRepo.findAll();

    const categoryMap = new Map(categories.map(c => [c.id, c]));

    const categoryTotals = new Map<number, { total: number; count: number }>();

    for (const t of transactions) {
      const existing = categoryTotals.get(t.categoryId) || { total: 0, count: 0 };
      categoryTotals.set(t.categoryId, {
        total: existing.total + t.amount,
        count: existing.count + 1,
      });
    }

    const grandTotal = transactions.reduce((sum, t) => sum + t.amount, 0);

    const breakdown: CategorySummary[] = [];

    for (const [categoryId, data] of categoryTotals) {
      const category = categoryMap.get(categoryId);
      if (category) {
        breakdown.push({
          categoryId,
          categoryName: category.name,
          categoryIcon: category.icon,
          total: data.total,
          count: data.count,
          percentage: grandTotal > 0 ? (data.total / grandTotal) * 100 : 0,
          type: category.type,
        });
      }
    }

    return breakdown.sort((a, b) => b.total - a.total);
  };

  const getMonthlyTrend = async (months: number = 6): Promise<{
    month: string;
    income: number;
    expense: number;
    balance: number;
  }[]> => {
    const trends: { month: string; income: number; expense: number; balance: number }[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = date.toISOString().substring(0, 7);
      const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1).toISOString();

      const transactions = await transactionRepo.findByDateRangeWithCategory(
        date.toISOString(),
        nextMonth
      );

      const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

      trends.push({
        month: monthStr,
        income,
        expense,
        balance: income - expense,
      });
    }

    return trends;
  };

  return {
    searchTransactions,
    searchBudgets,
    getTransactionSummary,
    getCategoryBreakdown,
    getMonthlyTrend,
  };
}

export type SearchService = ReturnType<typeof createSearchService>;