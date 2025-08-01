import React from 'react';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';
import { useBudgetService } from '@/services/business/BudgetService';
import { LoadingView } from '@/components/base/LoadingView';
import { ErrorView } from '@/components/base/ErrorView';
import { BudgetList } from '@/components/finance/budgets/BudgetList';
import type { BudgetWithCategory } from '@/services/database/repositories/BudgetRepository';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

export default function BudgetsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isReady, error, databaseService, retry } = useDatabaseSetup();
  const [budgets, setBudgets] = React.useState<BudgetWithCategory[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // 从URL参数获取年月，如果没有则使用当前日期
  const currentYear = params.year ? parseInt(params.year as string) : new Date().getFullYear();
  const currentMonth = params.month ? parseInt(params.month as string) : new Date().getMonth() + 1;

  const budgetService = React.useMemo(
    () => databaseService ? useBudgetService(databaseService) : null,
    [databaseService]
  );

  // 使用 useFocusEffect 来确保页面获得焦点时刷新数据
  useFocusEffect(
    React.useCallback(() => {
      if (!isReady || !budgetService) return;
      loadBudgets();
    }, [isReady, budgetService, currentYear, currentMonth])
  );

  async function loadBudgets() {
    if (!budgetService) return;
    
    try {
      setIsLoading(true);
      // 如果URL参数中有年月，则按月份过滤，否则获取所有预算
      const data = params.year && params.month 
        ? await budgetService.getBudgetsByMonthWithCategory(currentYear, currentMonth)
        : await budgetService.getBudgetsWithCategory();
      setBudgets(data);
    } catch (err) {
      console.error('加载预算失败:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const onRefresh = React.useCallback(async () => {
    if (!budgetService) return;
    
    try {
      setIsRefreshing(true);
      await loadBudgets();
    } finally {
      setIsRefreshing(false);
    }
  }, [budgetService]);

  const handleDelete = React.useCallback(async (id: number) => {
    if (!budgetService) return;
    
    try {
      const success = await budgetService.deleteBudget(id);
      if (success) {
        setBudgets(prev => prev.filter(budget => budget.id !== id));
      }
    } catch (err) {
      console.error('删除预算失败:', err);
    }
  }, [budgetService]);

  if (error) {
    return <ErrorView 
      error={error} 
      onRetry={retry}
      message="加载预算失败" 
    />;
  }

  if (!isReady || !budgetService) {
    return <LoadingView message="加载中..." />;
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: params.year && params.month 
            ? `${currentYear}年${currentMonth}月预算管理`
            : '预算管理',
          headerBackTitle: '返回',
        }}
      />
      <BudgetList
        budgets={budgets}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        onRefresh={onRefresh}
        onDelete={handleDelete}
        onEdit={(id) => router.push(`/budget/edit/${id}`)}
        title={params.year && params.month 
          ? `${currentYear}年${currentMonth}月预算管理`
          : '所有预算记录'
        }
      />
    </>
  );
} 