import React, { useState, useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';
import { useBudgetService } from '@/services/business/BudgetService';
import { useCategoryService } from '@/services/business/CategoryService';
import { LoadingView } from '@/components/base/LoadingView';
import { ErrorView } from '@/components/base/ErrorView';
import { DetailView } from '@/components/finance/common/DetailView';
import type { DetailItem } from '@/components/finance/common/DetailView';
import { formatCurrency } from '@/utils/format';

export default function BudgetDetailScreen() {
  const { id } = useLocalSearchParams();
  const { isReady, error, databaseService, retry } = useDatabaseSetup();
  const [budget, setBudget] = React.useState<any>(null);
  const [categoryName, setCategoryName] = useState<string>('未分类');
  const [isLoading, setIsLoading] = React.useState(true);

  const budgetService = React.useMemo(
    () => databaseService ? useBudgetService(databaseService) : null,
    [databaseService]
  );

  const categoryService = React.useMemo(
    () => databaseService ? useCategoryService(databaseService) : null,
    [databaseService]
  );

  React.useEffect(() => {
    if (!isReady || !budgetService) return;
    loadBudget();
  }, [isReady, budgetService]);

  useEffect(() => {
    const loadCategoryName = async () => {
      if (budget?.categoryId && categoryService) {
        try {
          const category = await categoryService.getCategoryById(budget.categoryId);
          if (category) {
            setCategoryName(category.name);
          }
        } catch (error) {
          console.error('加载类别名称失败:', error);
        }
      }
    };

    loadCategoryName();
  }, [budget?.categoryId, categoryService]);

  async function loadBudget() {
    if (!budgetService || !id) return;
    
    try {
      setIsLoading(true);
      const data = await budgetService.getBudgetById(Number(id));
      setBudget(data);
    } catch (err) {
      console.error('加载预算详情失败:', err);
    } finally {
      setIsLoading(false);
    }
  }

  if (error) {
    return <ErrorView 
      error={error} 
      onRetry={retry}
      message="加载预算详情失败" 
    />;
  }

  if (!isReady || isLoading || !budgetService) {
    return <LoadingView message="加载中..." />;
  }

  if (!budget) {
    return <DetailView title="预算详情" items={[{ label: '状态', value: '未找到预算记录', type: 'text' }]} />;
  }

  const items: DetailItem[] = [
    {
      label: '名称',
      value: budget.name,
      type: 'text'
    },
    {
      label: '金额',
      value: formatCurrency(budget.amount),
      type: 'text'
    },
    {
      label: '类别',
      value: categoryName,
      type: 'text'
    },
    {
      label: '开始日期',
      value: new Date(budget.startDate).toLocaleDateString(),
      type: 'text'
    },
    {
      label: '结束日期',
      value: new Date(budget.endDate).toLocaleDateString(),
      type: 'text'
    },
    {
      label: '周期',
      value: budget.period === 'daily' ? '日' : 
             budget.period === 'weekly' ? '周' : 
             budget.period === 'monthly' ? '月' : '年',
      type: 'text'
    },
    {
      label: '状态',
      value: budget.isBudgetExceeded ? '超出预算' : '正常',
      type: 'text'
    }
  ];

  return <DetailView title="预算详情" items={items} />;
} 