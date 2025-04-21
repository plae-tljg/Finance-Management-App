import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from '@/components/base/Text';
import { useTransactionService } from '@/services/business/TransactionService';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';
import type { BudgetSummary } from '@/services/database/repositories/TransactionRepository';

interface MonthlyReportProps {
  month: Date;
}

export function MonthlyReport({ month }: MonthlyReportProps) {
  const { databaseService } = useDatabaseSetup();
  const [budgetSummaries, setBudgetSummaries] = useState<BudgetSummary[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const transactionService = React.useMemo(
    () => databaseService ? useTransactionService(databaseService) : null,
    [databaseService]
  );

  useEffect(() => {
    if (!transactionService) return;

    const loadMonthlyData = async () => {
      try {
        setIsLoading(true);
        
        // 获取当月第一天和最后一天
        const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
        const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);
        
        // 获取预算使用情况
        const summaries = await transactionService.getTransactionsSummaryByBudget(
          startDate.toISOString(),
          endDate.toISOString()
        );
        setBudgetSummaries(summaries);

        // 获取当月所有交易
        const transactions = await transactionService.getTransactionsByDateRange(
          startDate.toISOString(),
          endDate.toISOString()
        );

        // 计算总收入支出
        const income = transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const expense = transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        setTotalIncome(income);
        setTotalExpense(expense);
      } catch (error) {
        console.error('加载月度报告失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMonthlyData();
  }, [transactionService, month]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>加载中...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text variant="title" style={styles.sectionTitle}>月度收支概览</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>总收入</Text>
            <Text style={[styles.summaryValue, styles.income]}>¥{totalIncome.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>总支出</Text>
            <Text style={[styles.summaryValue, styles.expense]}>¥{totalExpense.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>结余</Text>
            <Text style={[styles.summaryValue, styles.saving]}>
              ¥{(totalIncome - totalExpense).toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text variant="title" style={styles.sectionTitle}>预算使用情况</Text>
        {budgetSummaries.map((summary) => (
          <View key={summary.budgetId} style={styles.budgetCard}>
            <View style={styles.budgetHeader}>
              <Text style={styles.budgetName}>{summary.budgetName}</Text>
              <Text style={[
                styles.budgetStatus,
                summary.isExceeded ? styles.exceeded : styles.withinBudget
              ]}>
                {summary.isExceeded ? '超出预算' : '在预算内'}
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${Math.min((summary.totalSpent / summary.budgetAmount) * 100, 100)}%`,
                    backgroundColor: summary.isExceeded ? '#FF3B30' : '#34C759'
                  }
                ]} 
              />
            </View>
            <View style={styles.budgetDetails}>
              <Text style={styles.budgetAmount}>
                已用: ¥{summary.totalSpent.toFixed(2)}
              </Text>
              <Text style={styles.budgetAmount}>
                预算: ¥{summary.budgetAmount.toFixed(2)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  income: {
    color: '#34C759',
  },
  expense: {
    color: '#FF3B30',
  },
  saving: {
    color: '#007AFF',
  },
  budgetCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  budgetStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  exceeded: {
    color: '#FF3B30',
  },
  withinBudget: {
    color: '#34C759',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  budgetDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetAmount: {
    fontSize: 14,
    color: '#666',
  },
}); 