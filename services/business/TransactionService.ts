import { TransactionRepository } from '../database/repositories/TransactionRepository';
import type { Transaction } from '../database/schemas/Transaction';
import { DatabaseService } from '../database/DatabaseService';

export function useTransactionService(databaseService: DatabaseService) {
  const repository = new TransactionRepository(databaseService);
  
  const getTransactions = async () => {
    return await repository.findAll();
  };

  const getTransactionById = async (id: number) => {
    return await repository.findById(id);
  };
  
  const createTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    return await repository.create(transaction);
  };
  
  const updateTransaction = async (id: number, transaction: Partial<Transaction>) => {
    return await repository.update(id, transaction);
  };
  
  const deleteTransaction = async (id: number) => {
    return await repository.delete(id);
  };
  
  const getTotalIncome = async () => {
    return await repository.getTotalIncome();
  };
  
  const getTotalExpense = async () => {
    return await repository.getTotalExpense();
  };

  const getTransactionsByDateRange = async (startDate: string, endDate: string) => {
    return await repository.findByDateRange(startDate, endDate);
  };
  
  const getTransactionsWithCategory = async () => {
    try {
      console.log('开始获取交易记录...');
      const transactions = await repository.findAllWithCategory();
      console.log('获取到的交易记录:', transactions);
      return transactions;
    } catch (error) {
      console.error('获取交易记录失败:', error);
      return [];
    }
  };

  const getTransactionWithCategory = async (id: number) => {
    return await repository.findByIdWithCategory(id);
  };

  const getTransactionsByDateRangeWithCategory = async (startDate: string, endDate: string) => {
    return await repository.findByDateRangeWithCategory(startDate, endDate);
  };

  const getTransactionsByCategoryId = async (categoryId: number) => {
    return await repository.findByCategoryId(categoryId);
  };

  const getTransactionsByBudgetId = async (budgetId: number) => {
    return await repository.findByBudgetId(budgetId);
  };

  const getTransactionsSummaryByCategory = async (startDate: string, endDate: string) => {
    return await repository.getSummaryByCategory(startDate, endDate);
  };

  const getTransactionsSummaryByBudget = async (startDate: string, endDate: string) => {
    return await repository.getSummaryByBudget(startDate, endDate);
  };

  const getRecentTransactions = async (limit: number) => {
    const transactions = await repository.findAllWithCategory();
    return transactions.slice(0, limit);
  };

  const getTransactionsByMonth = async (year: number, month: number): Promise<Transaction[]> => {
    const allTransactions = await repository.findAll();
    return allTransactions.filter(t => {
      const date = new Date(t.date);
      return date.getFullYear() === year && date.getMonth() + 1 === month;
    });
  };

  return {
    getTransactions,
    getTransactionById,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    getTotalIncome,
    getTotalExpense,
    getTransactionsByDateRange,
    getTransactionsWithCategory,
    getTransactionWithCategory,
    getTransactionsByDateRangeWithCategory,
    getTransactionsByCategoryId,
    getTransactionsByBudgetId,
    getTransactionsSummaryByCategory,
    getTransactionsSummaryByBudget,
    getRecentTransactions,
    getTransactionsByMonth
  };
} 