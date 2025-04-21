import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';
import { useBudgetService } from '@/services/business/BudgetService';
import { BudgetEdit } from '@/components/finance/budgets/BudgetEdit';
import type { Budget } from '@/services/database/schemas/Budget';

export default function BudgetEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { databaseService } = useDatabaseSetup();
  const budgetService = useBudgetService(databaseService);

  const [budget, setBudget] = useState<Budget | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBudget = async () => {
      if (!budgetService || !id) {
        return;
      }

      try {
        const budgetId = parseInt(id, 10);
        if (isNaN(budgetId)) {
          throw new Error('无效的预算ID');
        }

        const loadedBudget = await budgetService.getBudgetById(budgetId);
        if (!loadedBudget) {
          throw new Error('未找到预算');
        }

        setBudget(loadedBudget);
      } catch (error) {
        console.error('加载预算失败:', error);
        Alert.alert('错误', '加载预算失败，请重试');
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    loadBudget();
  }, [budgetService, id, router]);

  const handleSave = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!budget) {
    return null;
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: '编辑预算',
          headerBackTitle: '返回',
        }}
      />
      <BudgetEdit budget={budget} onSave={handleSave} />
    </>
  );
} 