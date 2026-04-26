import { useState, useCallback } from 'react';
import { useBudgetService } from '@/services/business/BudgetService';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';

interface UseBudgetFormOptions {
  onSuccess?: () => void;
}

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface UseBudgetFormReturn {
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
  resetForm: () => void;
  submit: () => Promise<boolean>;
}

export function useBudgetForm(options: UseBudgetFormOptions = {}): UseBudgetFormReturn {
  const { onSuccess } = options;
  const { isReady, databaseService } = useDatabaseSetup();
  const budgetService = useBudgetService(databaseService);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategoryState] = useState<number | null>(null);
  const [period, setPeriod] = useState<Period>('monthly');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setSelectedCategory = useCallback((id: number | null) => {
    setSelectedCategoryState(id);
  }, []);

  const resetForm = useCallback(() => {
    setName('');
    setDescription('');
    setAmount('');
    setSelectedCategoryState(null);
    setPeriod('monthly');
  }, []);

  const submit = useCallback(async (): Promise<boolean> => {
    if (!isReady || !databaseService) {
      console.error('数据库未就绪');
      alert('数据库未就绪，请稍后再试');
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

    if (isSubmitting) {
      return false;
    }

    setIsSubmitting(true);

    try {
      const newBudget = await budgetService.createBudget({
        name: name.trim(),
        description: description.trim() || null,
        categoryId: selectedCategory,
        amount: parseFloat(amount),
        period,
        startDate: new Date().toISOString(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
        month: new Date().toISOString().substring(0, 7),
        isRegular: false,
        isBudgetExceeded: false,
        accountId: null,
      });

      if (!newBudget) {
        throw new Error('创建预算失败');
      }

      resetForm();
      onSuccess?.();
      return true;
    } catch (error) {
      console.error('创建预算失败:', error);
      alert('创建预算失败，请重试');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [budgetService, isReady, name, description, amount, selectedCategory, period, onSuccess, resetForm, isSubmitting]);

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
    resetForm,
    submit,
  };
}