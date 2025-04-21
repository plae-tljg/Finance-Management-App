import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';
import { useTransactionService } from '@/services/business/TransactionService';
import { useBudgetService } from '@/services/business/BudgetService';
import { useCategoryService } from '@/services/business/CategoryService';
import { useTransactionUpdate, useBudgetUpdate, useCategoryUpdate } from '@/hooks/useDatabaseEvent';
import type { Transaction } from '@/services/database/schemas/Transaction';
import type { Budget } from '@/services/database/schemas/Budget';
import type { Category } from '@/services/database/schemas/Category';

interface FinanceContextType {
  // 数据库状态
  isReady: boolean;
  error: Error | null;
  retry: () => Promise<void>;
  
  // 交易相关
  transactions: Transaction[];
  isLoadingTransactions: boolean;
  isRefreshingTransactions: boolean;
  loadTransactions: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  
  // 预算相关
  budgets: Budget[];
  isLoadingBudgets: boolean;
  loadBudgets: () => Promise<void>;
  
  // 分类相关
  categories: Category[];
  isLoadingCategories: boolean;
  loadCategories: () => Promise<void>;
  updateCategory: (id: number, category: Partial<Category>) => Promise<boolean>;
  
  // 图表数据
  chartData: {
    labels: string[];
    datasets: { data: number[] }[];
  };

  // 全局刷新
  refreshAllData: () => Promise<void>;
  loadInitialData: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { isReady, error, databaseService, retry } = useDatabaseSetup();
  
  // 交易状态
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [isRefreshingTransactions, setIsRefreshingTransactions] = useState(false);
  
  // 预算状态
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoadingBudgets, setIsLoadingBudgets] = useState(true);
  
  // 分类状态
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  
  // 图表数据
  const [chartData, setChartData] = useState({
    labels: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"],
    datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }]
  });

  // 服务实例
  const transactionService = useTransactionService(databaseService);
  const budgetService = useBudgetService(databaseService);
  const categoryService = useCategoryService(databaseService);

  // 加载交易数据
  const loadTransactions = async () => {
    try {
      if (!isReady) {
        console.log('数据库未初始化，跳过加载交易记录');
        return;
      }
      const transactions = await transactionService.getTransactions();
      setTransactions(transactions);
    } catch (error) {
      console.error('加载交易记录失败:', error);
    }
  };

  // 刷新交易数据
  const refreshTransactions = async () => {
    if (!transactionService) return;
    
    try {
      setIsRefreshingTransactions(true);
      await loadTransactions();
    } finally {
      setIsRefreshingTransactions(false);
    }
  };

  // 加载预算数据
  const loadBudgets = async () => {
    if (!budgetService) return;
    
    try {
      setIsLoadingBudgets(true);
      const data = await budgetService.getBudgetsWithCategory();
      setBudgets(data);
    } catch (err) {
      console.error('加载预算失败:', err);
    } finally {
      setIsLoadingBudgets(false);
    }
  };

  // 加载分类数据
  const loadCategories = async () => {
    if (!categoryService) return;
    
    try {
      setIsLoadingCategories(true);
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('加载分类失败:', err);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  // 加载图表数据
  const loadChartData = async () => {
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

          const transactions = await transactionService.getTransactionsByDateRange(
            date.toISOString(),
            nextDate.toISOString()
          );
          return transactions.reduce((sum, t) => t.type === 'expense' ? sum + t.amount : sum, 0);
        })
      );

      setChartData({
        labels: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"],
        datasets: [{ data: dailyExpenses }]
      });
    } catch (error) {
      console.error('加载财务数据错误:', error);
    }
  };

  // 全局刷新函数
  const refreshAllData = useCallback(async () => {
    if (!isReady) return;
    
    try {
      await Promise.all([
        loadTransactions(),
        loadBudgets(),
        loadCategories(),
        loadChartData()
      ]);
    } catch (error) {
      console.error('刷新数据失败:', error);
    }
  }, [isReady]);

  // 初始数据加载
  const loadInitialData = useCallback(async () => {
    if (!isReady) return;
    
    try {
      // 先加载分类数据，因为其他数据依赖分类
      await loadCategories();
      
      // 然后并行加载其他数据
      await Promise.all([
        loadTransactions(),
        loadBudgets(),
        loadChartData()
      ]);
    } catch (error) {
      console.error('加载初始数据失败:', error);
    }
  }, [isReady]);

  // 监听数据更新事件
  useTransactionUpdate(refreshAllData);
  useBudgetUpdate(refreshAllData);
  useCategoryUpdate(refreshAllData);

  // 初始化数据
  useEffect(() => {
    if (isReady) {
      loadInitialData();
    }
  }, [isReady]);

  // 更新分类
  const updateCategory = async (id: number, category: Partial<Category>) => {
    if (!categoryService) return false;
    
    try {
      return await categoryService.updateCategory(id, category);
    } catch (err) {
      console.error('更新分类失败:', err);
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
    chartData,
    refreshAllData,
    updateCategory,
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