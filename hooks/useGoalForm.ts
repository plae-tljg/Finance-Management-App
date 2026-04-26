import { useState, useCallback } from 'react';
import { useGoalService } from '@/services/business/GoalService';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';
import type { Goal } from '@/services/database/schemas/Goal';

interface UseGoalFormOptions {
  goal?: Goal | null;
  onSuccess?: () => void;
}

interface UseGoalFormReturn {
  name: string;
  targetAmount: string;
  currentAmount: string;
  icon: string;
  color: string;
  deadline: string;
  isActive: boolean;
  isCompleted: boolean;
  isLoading: boolean;
  setName: (name: string) => void;
  setTargetAmount: (amount: string) => void;
  setCurrentAmount: (amount: string) => void;
  setIcon: (icon: string) => void;
  setColor: (color: string) => void;
  setDeadline: (deadline: string) => void;
  setIsActive: (active: boolean) => void;
  setIsCompleted: (completed: boolean) => void;
  resetForm: () => void;
  submit: () => Promise<boolean>;
}

export function useGoalForm(options: UseGoalFormOptions = {}): UseGoalFormReturn {
  const { goal, onSuccess } = options;
  const { isReady, databaseService } = useDatabaseSetup();
  const goalService = useGoalService(databaseService);

  const [name, setName] = useState(goal?.name || '');
  const [targetAmount, setTargetAmount] = useState(goal?.targetAmount.toString() || '0');
  const [currentAmount, setCurrentAmount] = useState(goal?.currentAmount.toString() || '0');
  const [icon, setIcon] = useState(goal?.icon || '🎯');
  const [color, setColor] = useState(goal?.color || '#5856D6');
  const [deadline, setDeadline] = useState(goal?.deadline || '');
  const [isActive, setIsActive] = useState(goal?.isActive ?? true);
  const [isCompleted, setIsCompleted] = useState(goal?.isCompleted ?? false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setName('');
    setTargetAmount('0');
    setCurrentAmount('0');
    setIcon('🎯');
    setColor('#5856D6');
    setDeadline('');
    setIsActive(true);
    setIsCompleted(false);
  }, []);

  const submit = useCallback(async (): Promise<boolean> => {
    if (!goalService || !isReady) {
      console.error('目标服务未初始化');
      return false;
    }

    if (!name.trim()) {
      alert('请输入目标名称');
      return false;
    }

    const target = parseFloat(targetAmount);
    if (isNaN(target) || target <= 0) {
      alert('请输入有效的目标金额');
      return false;
    }

    setIsSubmitting(true);

    try {
      const current = parseFloat(currentAmount) || 0;
      const goalData = {
        name: name.trim(),
        targetAmount: target,
        currentAmount: current,
        icon,
        color,
        deadline: deadline || null,
        isActive,
        isCompleted: current >= target,
      };

      if (goal?.id) {
        await goalService.updateGoal(goal.id, goalData);
      } else {
        await goalService.createGoal(goalData);
      }

      onSuccess?.();
      return true;
    } catch (error) {
      console.error('保存目标失败:', error);
      alert('保存目标失败，请重试');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [goalService, isReady, goal, name, targetAmount, currentAmount, icon, color, deadline, isActive, onSuccess]);

  return {
    name,
    targetAmount,
    currentAmount,
    icon,
    color,
    deadline,
    isActive,
    isCompleted,
    isLoading: isSubmitting,
    setName,
    setTargetAmount,
    setCurrentAmount,
    setIcon,
    setColor,
    setDeadline,
    setIsActive,
    setIsCompleted,
    resetForm,
    submit,
  };
}