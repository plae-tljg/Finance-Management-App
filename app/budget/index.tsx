import React from 'react';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';
import { useBudgetService } from '@/services/business/BudgetService';
import { useMonthPreparationService } from '@/services/business/MonthPreparationService';
import { LoadingView } from '@/components/base/LoadingView';
import { ErrorView } from '@/components/base/ErrorView';
import { EmptyState } from '@/components/base/EmptyState';
import { BudgetList } from '@/components/finance/budgets/BudgetList';
import { MonthPrepPrompt } from '@/components/finance/common/MonthPrepPrompt';
import type { BudgetWithCategory } from '@/services/database/repositories/BudgetRepository';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Alert, StyleSheet } from 'react-native';
import { PageTemplate } from '@/components/base/PageTemplate';

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

  const monthPreparationService = React.useMemo(
    () => databaseService ? useMonthPreparationService(databaseService) : null,
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
      // Always filter by the current month (or the month passed in the URL).
      // Previously this fell back to "all budgets" when no query params were
      // present, which made the web view (which never carries those params)
      // show every month at once.
      const data = await budgetService.getBudgetsByMonthWithCategory(
        currentYear,
        currentMonth,
      );
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

  const handleCarryOverBudgets = React.useCallback(async () => {
    if (!monthPreparationService) return;
    try {
      const created = await monthPreparationService.carryOverBudgets(
        currentYear,
        currentMonth,
      );
      await loadBudgets();
      Alert.alert(
        created > 0 ? '已沿用上月预算' : '无需沿用',
        created > 0
          ? `已创建 ${created} 个预算，可以按需调整金额。`
          : '这个月的预算已经存在，或上月没有可沿用的预算。',
      );
    } catch (err) {
      console.error('沿用上月预算失败:', err);
      Alert.alert('失败', '沿用上月预算失败，请重试');
    }
  }, [monthPreparationService, currentYear, currentMonth]);

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
    <PageTemplate
      title={params.year && params.month
        ? `${currentYear}年${currentMonth}月预算管理`
        : '预算管理'
      }
      scrollable={false}
    >
      <MonthPrepPrompt year={currentYear} month={currentMonth} />

      <BudgetList
        budgets={budgets}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        onRefresh={onRefresh}
        onDelete={handleDelete}
        onEdit={(id) => router.push(`/budget/edit/${id}`)}
        title={`${currentYear}年${currentMonth}月预算管理`}
        emptyComponent={
          <EmptyState
            icon="📊"
            title={`${currentYear}年${currentMonth}月还没有预算`}
            description="沿用上个月的预算，或者从默认设置重新生成一份。"
            actionLabel="沿用上月预算"
            onAction={handleCarryOverBudgets}
            secondaryActionLabel="设置预算默认值"
            onSecondaryAction={() => router.push('/budget/defaults')}
          />
        }
      />
    </PageTemplate>
  );
}

const styles = StyleSheet.create({
}); 