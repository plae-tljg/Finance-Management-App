import React, { memo, useCallback, useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '@/components/base/Text';
import { useBudgetService } from '@/services/business/BudgetService';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';
import { LoadingView } from '@/components/base/LoadingView';
import type { Budget } from '@/services/database/schemas/Budget';
import { router } from 'expo-router';
import theme from '@/theme';

interface BudgetInputProps {
  categoryId: number | null;
  selectedId: number | null;
  onSelect: (budget: { id: number; name: string } | null) => void;
  date?: Date;
}

export const BudgetInput = memo(function BudgetInput({
  categoryId,
  selectedId,
  onSelect,
  date
}: BudgetInputProps) {
  const { isReady, databaseService } = useDatabaseSetup();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const budgetService = useMemo(() => {
    if (!databaseService) return null;
    return useBudgetService(databaseService);
  }, [databaseService]);

  useEffect(() => {
    const loadBudgets = async () => {
      if (!budgetService || !categoryId) {
        setBudgets([]);
        setIsLoading(false);
        return;
      }

      try {
        let data;
        if (date) {
          const year = date.getFullYear();
          const month = date.getMonth() + 1;
          data = await budgetService.getBudgetsByCategoryAndMonth(categoryId, year, month);
        } else {
          data = await budgetService.getBudgetsByCategory(categoryId);
        }
        setBudgets(data);
      } catch (err) {
        console.error('加载预算失败:', err);
        setBudgets([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadBudgets();
  }, [budgetService, categoryId, date]);

  const handleSelect = useCallback((budget: Budget) => {
    onSelect(selectedId === budget.id ? null : budget);
  }, [selectedId, onSelect]);

  if (!categoryId) {
    return null;
  }

  if (isLoading) {
    return <LoadingView message="加载预算..." />;
  }

  if (budgets.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>预算</Text>
        <View style={styles.noBudgetBox}>
          <Text style={styles.noBudget}>该类别本月还没有预算</Text>
          <Text style={styles.noBudgetHint}>
            保存这笔记录前，需要先为该类别创建一个本月预算。
          </Text>
          <TouchableOpacity
            style={styles.noBudgetLink}
            onPress={() => router.push('/budget')}
          >
            <Text style={styles.noBudgetLinkText}>去预算管理创建</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>预算</Text>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.grid}>
          {budgets.map((budget) => (
            <TouchableOpacity
              key={budget.id}
              style={[
                styles.budgetItem,
                selectedId === budget.id && styles.selectedBudget
              ]}
              onPress={() => handleSelect(budget)}
            >
              <Text style={[
                styles.budgetName,
                selectedId === budget.id && styles.selectedBudgetName
              ]}>
                {budget.name}
              </Text>
              <Text style={[
                styles.budgetAmount,
                selectedId === budget.id && styles.selectedBudgetAmount
              ]}>
                ¥{budget.amount.toFixed(2)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {},
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  scrollView: {
    maxHeight: 100,
  },
  contentContainer: {
    padding: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  budgetItem: {
    padding: 8,
    backgroundColor: theme.colors.white,
    borderRadius: 6,
    width: '49%',
    marginBottom: 6,
  },
  selectedBudget: {
    backgroundColor: theme.colors.primary,
  },
  budgetName: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 4,
  },
  selectedBudgetName: {
    color: theme.colors.white,
  },
  budgetAmount: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  selectedBudgetAmount: {
    color: theme.colors.white,
  },
  noBudget: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
  noBudgetBox: {
    backgroundColor: theme.colors.surfaceDark,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
  },
  noBudgetHint: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textTertiary,
    marginTop: theme.spacing.xs,
    lineHeight: 16,
  },
  noBudgetLink: {
    marginTop: theme.spacing.sm,
    alignSelf: 'flex-start',
  },
  noBudgetLinkText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.primary,
  },
});