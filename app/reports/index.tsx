import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/base/Text';
import { Card } from '@/components/base/Card';
import { PageTemplate } from '@/components/base/PageTemplate';
import { useLocalSearchParams } from 'expo-router';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';
import { useAccountMonthlyBalanceService } from '@/services/business/AccountMonthlyBalanceService';
import { useTransactionService } from '@/services/business/TransactionService';
import { useBudgetService } from '@/services/business/BudgetService';
import { useCategoryService } from '@/services/business/CategoryService';
import type { Transaction } from '@/services/database/schemas/Transaction';
import type { Budget } from '@/services/database/schemas/Budget';
import type { Category } from '@/services/database/schemas/Category';
import theme from '@/theme';

interface CategorySummary {
  category: Category;
  spent: number;
  budget: number;
  remaining: number;
}

export default function MonthlySummaryScreen() {
  const params = useLocalSearchParams();
  const { databaseService, isReady } = useDatabaseSetup();
  const [totalOpeningBalance, setTotalOpeningBalance] = useState(0);
  const [totalClosingBalance, setTotalClosingBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categorySummaries, setCategorySummaries] = useState<CategorySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentYear = params.year ? parseInt(params.year as string) : new Date().getFullYear();
  const currentMonth = params.month ? parseInt(params.month as string) : new Date().getMonth() + 1;

  const accountMonthlyBalanceService = React.useMemo(
    () => databaseService ? useAccountMonthlyBalanceService(databaseService) : null,
    [databaseService]
  );

  const transactionService = React.useMemo(
    () => databaseService ? useTransactionService(databaseService) : null,
    [databaseService]
  );

  const budgetService = React.useMemo(
    () => databaseService ? useBudgetService(databaseService) : null,
    [databaseService]
  );

  const categoryService = React.useMemo(
    () => databaseService ? useCategoryService(databaseService) : null,
    [databaseService]
  );

  useEffect(() => {
    if (!isReady) {
      console.log('数据库未初始化，跳过加载月度数据');
      return;
    }
    if (!accountMonthlyBalanceService || !transactionService || !budgetService || !categoryService) return;

    const loadData = async () => {
      try {
        setIsLoading(true);
        const totals = await accountMonthlyBalanceService.getMonthlyTotalBalances(currentYear, currentMonth);
        setTotalOpeningBalance(totals.openingBalance);
        setTotalClosingBalance(totals.closingBalance);

        const monthlyTransactions = await transactionService.getTransactionsByMonth(currentYear, currentMonth);
        setTransactions(monthlyTransactions);

        const monthlyBudgets = await budgetService.getBudgetsByMonth(currentYear, currentMonth);
        setBudgets(monthlyBudgets);

        const allCategories = await categoryService.getCategories();
        setCategories(allCategories);

        const summaries = allCategories.map(category => {
          const categoryTransactions = monthlyTransactions.filter(t => t.categoryId === category.id);
          const spent = categoryTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

          const budget = monthlyBudgets.find(b => b.categoryId === category.id)?.amount || 0;
          const remaining = budget - spent;

          return {
            category,
            spent,
            budget,
            remaining
          };
        });

        setCategorySummaries(summaries);
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isReady]);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expectedClosingBalance = totalOpeningBalance + totalIncome - totalExpense;

  if (isLoading) {
    return (
      <PageTemplate title="加载中..." showBack={false}>
        <Text style={styles.loadingText}>加载中...</Text>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title={`${currentYear}年${currentMonth}月财务概览`}
    >
      <View style={styles.summaryCard}>
        <Text style={styles.sectionTitle}>月度总览</Text>
        <View style={styles.summaryItem}>
          <Text style={styles.label}>期初余额</Text>
          <Text style={styles.value}>¥{totalOpeningBalance.toFixed(2)}</Text>
        </View>

        <View style={styles.summaryItem}>
          <Text style={styles.label}>总收入</Text>
          <Text style={[styles.value, styles.income]}>¥{totalIncome.toFixed(2)}</Text>
        </View>

        <View style={styles.summaryItem}>
          <Text style={styles.label}>总支出</Text>
          <Text style={[styles.value, styles.expense]}>¥{totalExpense.toFixed(2)}</Text>
        </View>

        <View style={styles.summaryItem}>
          <Text style={styles.label}>预期期末余额</Text>
          <Text style={styles.value}>¥{expectedClosingBalance.toFixed(2)}</Text>
        </View>

        <View style={styles.summaryItem}>
          <Text style={styles.label}>实际期末余额</Text>
          <Text style={styles.value}>¥{totalClosingBalance.toFixed(2)}</Text>
        </View>

        <View style={styles.summaryItem}>
          <Text style={styles.label}>差额</Text>
          <Text style={[
            styles.value,
            Math.abs(expectedClosingBalance - totalClosingBalance) > 0.01 ? styles.warning : null
          ]}>
            ¥{(expectedClosingBalance - totalClosingBalance).toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.sectionTitle}>类别支出与预算</Text>
        {categorySummaries.map((summary, index) => (
          <View key={summary.category.id} style={[
            styles.categoryItem,
            index === categorySummaries.length - 1 && styles.lastCategoryItem
          ]}>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryName}>{summary.category.name}</Text>
              <Text style={[
                styles.remaining,
                summary.remaining < 0 ? styles.overBudget : null
              ]}>
                {summary.remaining >= 0 ? '剩余' : '超支'} ¥{Math.abs(summary.remaining).toFixed(2)}
              </Text>
            </View>

            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(100, (summary.spent / summary.budget) * 100)}%`,
                    backgroundColor: summary.spent > summary.budget ? theme.colors.danger : theme.colors.success
                  }
                ]}
              />
            </View>

            <View style={styles.categoryDetails}>
              <Text style={styles.detailText}>已支出: ¥{summary.spent.toFixed(2)}</Text>
              <Text style={styles.detailText}>预算: ¥{summary.budget.toFixed(2)}</Text>
            </View>
          </View>
        ))}
      </View>
    </PageTemplate>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  label: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  value: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  income: {
    color: theme.colors.income,
  },
  expense: {
    color: theme.colors.expense,
  },
  warning: {
    color: theme.colors.warning,
  },
  categoryItem: {
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  lastCategoryItem: {
    borderBottomWidth: 0,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  categoryName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  remaining: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.success,
  },
  overBudget: {
    color: theme.colors.danger,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    marginBottom: theme.spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  categoryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.md,
  },
});