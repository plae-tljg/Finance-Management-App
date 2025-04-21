import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '@/components/base/Text';
import { useRouter } from 'expo-router';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';
import { useBankBalanceService } from '@/services/business/BankBalanceService';
import { useTransactionService } from '@/services/business/TransactionService';
import { useBudgetService } from '@/services/business/BudgetService';
import { useCategoryService } from '@/services/business/CategoryService';
import type { BankBalance } from '@/services/database/schemas/BankBalance';
import type { Transaction } from '@/services/database/schemas/Transaction';
import type { Budget } from '@/services/database/schemas/Budget';
import type { Category } from '@/services/database/schemas/Category';

interface CategorySummary {
  category: Category;
  spent: number;
  budget: number;
  remaining: number;
}

export default function MonthlySummaryScreen() {
  const router = useRouter();
  const { databaseService, isReady } = useDatabaseSetup();
  const [bankBalance, setBankBalance] = useState<BankBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categorySummaries, setCategorySummaries] = useState<CategorySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const bankBalanceService = React.useMemo(
    () => databaseService ? useBankBalanceService(databaseService) : null,
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
    if (!bankBalanceService || !transactionService || !budgetService || !categoryService) return;

    const loadData = async () => {
      try {
        setIsLoading(true);
        // 加载银行余额
        const balance = await bankBalanceService.getBankBalance(currentYear, currentMonth);
        setBankBalance(balance);

        // 加载当月交易
        const monthlyTransactions = await transactionService.getTransactionsByMonth(currentYear, currentMonth);
        setTransactions(monthlyTransactions);

        // 加载预算
        const monthlyBudgets = await budgetService.getBudgetsByMonth(currentYear, currentMonth);
        setBudgets(monthlyBudgets);

        // 加载类别
        const allCategories = await categoryService.getCategories();
        setCategories(allCategories);

        // 计算每个类别的支出和预算
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

  // 计算总支出
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // 计算总收入
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  // 计算预期期末余额
  const expectedClosingBalance = (bankBalance?.openingBalance || 0) + totalIncome - totalExpense;

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>加载中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="title">{currentYear}年{currentMonth}月财务概览</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>月度总览</Text>
          <View style={styles.summaryItem}>
            <Text style={styles.label}>期初余额</Text>
            <Text style={styles.value}>¥{bankBalance?.openingBalance.toFixed(2) || '0.00'}</Text>
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
            <Text style={styles.value}>¥{bankBalance?.closingBalance.toFixed(2) || '0.00'}</Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={styles.label}>差额</Text>
            <Text style={[
              styles.value,
              Math.abs(expectedClosingBalance - (bankBalance?.closingBalance || 0)) > 0.01 ? styles.warning : null
            ]}>
              ¥{(expectedClosingBalance - (bankBalance?.closingBalance || 0)).toFixed(2)}
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
                      backgroundColor: summary.spent > summary.budget ? '#F44336' : '#4CAF50'
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
      </ScrollView>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>返回</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 16,
    color: '#666',
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  income: {
    color: '#4CAF50',
  },
  expense: {
    color: '#F44336',
  },
  warning: {
    color: '#FF9800',
  },
  categoryItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  lastCategoryItem: {
    borderBottomWidth: 0,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  remaining: {
    fontSize: 14,
    color: '#4CAF50',
  },
  overBudget: {
    color: '#F44336',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 8,
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
    fontSize: 14,
    color: '#666',
  },
  backButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
}); 