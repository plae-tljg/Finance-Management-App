import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';
import { useTransactionService } from '@/services/business/TransactionService';
import { useBudgetService } from '@/services/business/BudgetService';
import { useCategoryService } from '@/services/business/CategoryService';
import { useAccountService } from '@/services/business/AccountService';
import { useGoalService } from '@/services/business/GoalService';
import { useAccountMonthlyBalanceService } from '@/services/business/AccountMonthlyBalanceService';
import { useTransactionUpdate, useBudgetUpdate, useCategoryUpdate } from '@/hooks/useDatabaseEvent';
import type { Transaction } from '@/services/database/schemas/Transaction';
import type { Budget } from '@/services/database/schemas/Budget';
import type { Category } from '@/services/database/schemas/Category';
import type { Account } from '@/services/database/schemas/Account';
import type { Goal } from '@/services/database/schemas/Goal';
import type { AccountMonthlyBalance } from '@/services/database/schemas/AccountMonthlyBalance';

interface FinanceContextType {
  isReady: boolean;
  error: Error | null;
  retry: () => Promise<void>;

  transactions: Transaction[];
  isLoadingTransactions: boolean;
  isRefreshingTransactions: boolean;
  loadTransactions: () => Promise<void>;
  refreshTransactions: () => Promise<void>;

  budgets: Budget[];
  isLoadingBudgets: boolean;
  loadBudgets: () => Promise<void>;

  categories: Category[];
  isLoadingCategories: boolean;
  loadCategories: () => Promise<void>;
  updateCategory: (id: number, category: Partial<Category>) => Promise<boolean>;
  createCategory: (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;

  accounts: Account[];
  isLoadingAccounts: boolean;
  loadAccounts: () => Promise<void>;

  goals: Goal[];
  isLoadingGoals: boolean;
  loadGoals: () => Promise<void>;

  accountMonthlyBalances: AccountMonthlyBalance[];
  isLoadingAccountMonthlyBalances: boolean;
  loadAccountMonthlyBalances: () => Promise<void>;
  getAccountMonthlyBalancesByAccount: (accountId: number) => Promise<AccountMonthlyBalance[]>;
  getAccountMonthlyBalancesByMonth: (year: number, month: number) => Promise<AccountMonthlyBalance[]>;
  getMonthlyTotalBalances: (year: number, month: number) => Promise<{ openingBalance: number; closingBalance: number }>;

  chartData: {
    labels: string[];
    datasets: { data: number[] }[];
  };

  refreshAllData: () => Promise<void>;
  loadInitialData: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { isReady, error, databaseService, retry } = useDatabaseSetup();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [isRefreshingTransactions, setIsRefreshingTransactions] = useState(false);

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoadingBudgets, setIsLoadingBudgets] = useState(true);

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);

  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoadingGoals, setIsLoadingGoals] = useState(true);

  const [accountMonthlyBalances, setAccountMonthlyBalances] = useState<AccountMonthlyBalance[]>([]);
  const [isLoadingAccountMonthlyBalances, setIsLoadingAccountMonthlyBalances] = useState(true);

  const [chartData, setChartData] = useState({
    labels: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"],
    datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }]
  });

  const isLoadingRef = useRef(false);
  const isRefreshingRef = useRef(false);

  const [transactionService] = useState(() => useTransactionService(databaseService));
  const [budgetService] = useState(() => useBudgetService(databaseService));
  const [categoryService] = useState(() => useCategoryService(databaseService));
  const [accountService] = useState(() => useAccountService(databaseService));
  const [goalService] = useState(() => useGoalService(databaseService));
  const [accountMonthlyBalanceService] = useState(() => useAccountMonthlyBalanceService(databaseService));

  const loadTransactions = useCallback(async () => {
    try {
      if (!isReady || !transactionService) return;
      setIsLoadingTransactions(true);
      const data = await transactionService.getTransactionsWithCategory();
      setTransactions(data);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setIsLoadingTransactions(false);
    }
  }, [isReady, transactionService]);

  const refreshTransactions = useCallback(async () => {
    if (!transactionService) return;

    try {
      setIsRefreshingTransactions(true);
      await loadTransactions();
    } finally {
      setIsRefreshingTransactions(false);
    }
  }, [transactionService, loadTransactions]);

  const loadBudgets = useCallback(async () => {
    if (!budgetService) return;

    try {
      setIsLoadingBudgets(true);
      const data = await budgetService.getBudgetsWithCategory();
      setBudgets(data);
    } catch (err) {
      console.error('Failed to load budgets:', err);
    } finally {
      setIsLoadingBudgets(false);
    }
  }, [budgetService]);

  const loadCategories = useCallback(async () => {
    if (!categoryService) return;

    try {
      setIsLoadingCategories(true);
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setIsLoadingCategories(false);
    }
  }, [categoryService]);

  const loadAccounts = useCallback(async () => {
    if (!accountService) return;

    try {
      setIsLoadingAccounts(true);
      const data = await accountService.getAccounts();
      setAccounts(data);
    } catch (err) {
      console.error('Failed to load accounts:', err);
    } finally {
      setIsLoadingAccounts(false);
    }
  }, [accountService]);

  const loadGoals = useCallback(async () => {
    if (!goalService) return;

    try {
      setIsLoadingGoals(true);
      const data = await goalService.getGoals();
      setGoals(data);
    } catch (err) {
      console.error('Failed to load goals:', err);
    } finally {
      setIsLoadingGoals(false);
    }
  }, [goalService]);

  const loadAccountMonthlyBalances = useCallback(async () => {
    if (!accountMonthlyBalanceService) return;

    try {
      setIsLoadingAccountMonthlyBalances(true);
      const data = await accountMonthlyBalanceService.getAllAccountBalances();
      setAccountMonthlyBalances(data);
    } catch (err) {
      console.error('Failed to load account monthly balances:', err);
    } finally {
      setIsLoadingAccountMonthlyBalances(false);
    }
  }, [accountMonthlyBalanceService]);

  const getAccountMonthlyBalancesByAccount = async (accountId: number): Promise<AccountMonthlyBalance[]> => {
    if (!accountMonthlyBalanceService) return [];
    return await accountMonthlyBalanceService.getAccountBalancesByAccount(accountId);
  };

  const getAccountMonthlyBalancesByMonth = async (year: number, month: number): Promise<AccountMonthlyBalance[]> => {
    if (!accountMonthlyBalanceService) return [];
    return await accountMonthlyBalanceService.getAccountBalancesByMonth(year, month);
  };

  const getMonthlyTotalBalances = async (year: number, month: number): Promise<{ openingBalance: number; closingBalance: number }> => {
    if (!accountMonthlyBalanceService) return { openingBalance: 0, closingBalance: 0 };
    return await accountMonthlyBalanceService.getMonthlyTotalBalances(year, month);
  };

  const loadChartData = useCallback(async () => {
    if (!transactionService) return;

    try {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + (6 - today.getDay()));

      const dailyExpenses = await Promise.all(
        Array.from({ length: 7 }).map(async (_, index) => {
          const date = new Date(startOfWeek);
          date.setDate(date.getDate() + index);
          const nextDate = new Date(date);
          nextDate.setDate(date.getDate() + 1);

          const txns = await transactionService.getTransactionsByDateRange(
            date.toISOString(),
            nextDate.toISOString()
          );
          return txns.reduce((sum, t) => t.type === 'expense' ? sum + t.amount : sum, 0);
        })
      );

      setChartData({
        labels: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"],
        datasets: [{ data: dailyExpenses }]
      });
    } catch (error) {
      console.error('Failed to load chart data:', error);
    }
  }, [transactionService]);

  const refreshAllData = useCallback(async () => {
    if (!isReady || isRefreshingRef.current) return;

    isRefreshingRef.current = true;
    try {
      await Promise.all([
        loadTransactions(),
        loadBudgets(),
        loadCategories(),
        loadAccounts(),
        loadGoals(),
        loadChartData(),
        loadAccountMonthlyBalances()
      ]);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      isRefreshingRef.current = false;
    }
  }, [isReady, loadTransactions, loadBudgets, loadCategories, loadAccounts, loadGoals, loadChartData, loadAccountMonthlyBalances]);

  const loadInitialData = useCallback(async () => {
    if (!isReady || isRefreshingRef.current) return;

    isRefreshingRef.current = true;
    try {
      await Promise.all([
        loadCategories(),
        loadAccounts(),
        loadGoals()
      ]);

      await Promise.all([
        loadTransactions(),
        loadBudgets(),
        loadChartData(),
        loadAccountMonthlyBalances()
      ]);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      isRefreshingRef.current = false;
    }
  }, [isReady, loadCategories, loadAccounts, loadGoals, loadTransactions, loadBudgets, loadChartData, loadAccountMonthlyBalances]);

  useEffect(() => {
    if (isReady) {
      loadInitialData();
    }
  }, [isReady, loadInitialData]);

  useTransactionUpdate(refreshAllData);
  useBudgetUpdate(refreshAllData);
  useCategoryUpdate(refreshAllData);

  const updateCategory = async (id: number, category: Partial<Category>) => {
    if (!categoryService) return false;

    try {
      return await categoryService.updateCategory(id, category);
    } catch (err) {
      console.error('Failed to update category:', err);
      return false;
    }
  };

  const createCategory = async (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!categoryService) return false;

    try {
      return await categoryService.createCategory(category);
    } catch (err) {
      console.error('Failed to create category:', err);
      return false;
    }
  };

  const value = {
    isReady,
    error,
    retry,
    transactions,
    isLoadingTransactions,
    isRefreshingTransactions,
    loadTransactions,
    refreshTransactions,
    budgets,
    isLoadingBudgets,
    loadBudgets,
    categories,
    isLoadingCategories,
    loadCategories,
    updateCategory,
    createCategory,
    accounts,
    isLoadingAccounts,
    loadAccounts,
    goals,
    isLoadingGoals,
    loadGoals,
    accountMonthlyBalances,
    isLoadingAccountMonthlyBalances,
    loadAccountMonthlyBalances,
    getAccountMonthlyBalancesByAccount,
    getAccountMonthlyBalancesByMonth,
    getMonthlyTotalBalances,
    chartData,
    refreshAllData,
    loadInitialData
  };

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
} 