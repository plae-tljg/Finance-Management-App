import { useState, useCallback } from 'react';
import { useBudgetService } from '@/services/business/BudgetService';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';
import type { Budget } from '@/services/database/schemas/Budget';

interface UseBudgetEditFormOptions {
  budget: Budget;
  onSuccess?: () => void;
}

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface UseBudgetEditFormReturn {
  name: string;
  description: string;
  amount: string;
  selectedCategory: number | null;
  period: Period;
  isLoading: boolean;
  setName: (name: string) => void;
  setDescription: (description: string) => void;
  setAmount: (amount: string) => void;
  setSelectedCategory: (id: number | null) => void;
  setPeriod: (period: Period) => void;
  submit: () => Promise<boolean>;
}

export function useBudgetEditForm(
  options: UseBudgetEditFormOptions
): UseBudgetEditFormReturn {
  const { budget, onSuccess } = options;
  const { databaseService } = useDatabaseSetup();
  const budgetService = useBudgetService(databaseService);

  const [name, setName] = useState(budget.name);
  const [description, setDescription] = useState(budget.description || '');
  const [amount, setAmount] = useState(budget.amount.toString());
  const [selectedCategory, setSelectedCategoryState] = useState<number | null>(budget.categoryId);
  const [period, setPeriod] = useState<Period>(budget.period as Period);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setSelectedCategory = useCallback((id: number | null) => {
    setSelectedCategoryState(id);
  }, []);

  const submit = useCallback(async (): Promise<boolean> => {
    if (!budgetService) {
      console.error('预算服务未初始化');
      return false;
    }

    if (!name.trim()) {
      alert('请输入预算名称');
      return false;
    }

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      alert('请输入有效金额');
      return false;
    }

    if (!selectedCategory) {
      alert('请选择类别');
      return false;
    }

    setIsSubmitting(true);

    try {
      const updatedBudget = {
        ...budget,
        name: name.trim(),
        description: description.trim() || null,
        amount: parseFloat(amount),
        categoryId: selectedCategory,
        period,
      };

      const success = await budgetService.updateBudget(updatedBudget.id, updatedBudget);
      if (success) {
        onSuccess?.();
        return true;
      } else {
        throw new Error('更新预算失败');
      }
    } catch (error) {
      console.error('更新预算失败:', error);
      alert('更新预算失败，请重试');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [budgetService, name, description, amount, selectedCategory, period, budget, onSuccess]);

  return {
    name,
    description,
    amount,
    selectedCategory,
    period,
    isLoading: isSubmitting,
    setName,
    setDescription,
    setAmount,
    setSelectedCategory,
    setPeriod,
    submit,
  };
}