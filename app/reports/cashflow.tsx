import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { Card } from '@/components/base/Card';
import { Text } from '@/components/base/Text';
import { PageTemplate } from '@/components/base/PageTemplate';
import { useFinance } from '@/contexts/FinanceContext';
import { useTransactionService } from '@/services/business/TransactionService';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';
import theme from '@/theme';

export default function CashFlowPage() {
  const { isReady } = useFinance();
  const { databaseService } = useDatabaseSetup();
  const transactionService = useTransactionService(databaseService);

  const [monthlyData, setMonthlyData] = useState<{
    labels: string[];
    income: number[];
    expense: number[];
  }>({
    labels: [],
    income: [],
    expense: [],
  });

  const [currentMonthSummary, setCurrentMonthSummary] = useState({
    income: 0,
    expense: 0,
    balance: 0,
  });

  const loadData = useCallback(async () => {
    if (!transactionService || !isReady) return;

    try {
      const today = new Date();
      const months = [];
      const incomeData = [];
      const expenseData = [];

      for (let i = 5; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const monthStr = `${year}-${month.toString().padStart(2, '0')}`;
        const nextMonthStr = `${year}-${(month + 1).toString().padStart(2, '0')}`;

        const startDate = `${monthStr}-01`;
        const endDate = i === 0
          ? today.toISOString()
          : `${year}-${(month + 1).toString().padStart(2, '0')}-01`;

        months.push(`${month}月`);

        const transactions = await transactionService.getTransactionsByDateRangeWithCategory(
          startDate,
          endDate
        );

        const income = transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);

        const expense = transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        incomeData.push(income);
        expenseData.push(expense);
      }

      setMonthlyData({
        labels: months,
        income: incomeData,
        expense: expenseData,
      });

      const currentMonthTransactions = monthlyData;
      setCurrentMonthSummary({
        income: currentMonthTransactions.income[currentMonthTransactions.income.length - 1] || 0,
        expense: currentMonthTransactions.expense[currentMonthTransactions.expense.length - 1] || 0,
        balance: (currentMonthTransactions.income[currentMonthTransactions.income.length - 1] || 0) -
                 (currentMonthTransactions.expense[currentMonthTransactions.expense.length - 1] || 0),
      });
    } catch (error) {
      console.error('加载现金流数据失败:', error);
    }
  }, [transactionService, isReady]);

  useEffect(() => {
    if (isReady) {
      loadData();
    }
  }, [isReady, loadData]);

  const chartData = {
    labels: monthlyData.labels,
    datasets: [
      {
        data: monthlyData.income,
        color: () => theme.colors.income,
        strokeWidth: 2,
      },
      {
        data: monthlyData.expense,
        color: () => theme.colors.expense,
        strokeWidth: 2,
      },
    ],
    legend: ['收入', '支出'],
  };

  return (
    <PageTemplate title="现金流">
      <Card style={styles.summaryCard}>
        <Text style={styles.sectionTitle}>本月概况</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>收入</Text>
            <Text style={[styles.summaryValue, { color: theme.colors.income }]}>
              ¥{currentMonthSummary.income.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>支出</Text>
            <Text style={[styles.summaryValue, { color: theme.colors.expense }]}>
              ¥{currentMonthSummary.expense.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>结余</Text>
            <Text style={[styles.summaryValue, {
              color: currentMonthSummary.balance >= 0 ? theme.colors.income : theme.colors.expense
            }]}>
              ¥{currentMonthSummary.balance.toFixed(2)}
            </Text>
          </View>
        </View>
      </Card>

      <Card style={styles.chartCard}>
        <Text style={styles.sectionTitle}>收支趋势 (近6月)</Text>
        <LineChart
          data={chartData}
          width={Dimensions.get('window').width - 64}
          height={220}
          chartConfig={{
            backgroundColor: theme.colors.surface,
            backgroundGradientFrom: theme.colors.surface,
            backgroundGradientTo: theme.colors.surface,
            decimalPlaces: 0,
            color: () => theme.colors.primary,
            labelColor: () => theme.colors.textSecondary,
            style: {
              borderRadius: theme.borderRadius.md,
            },
            propsForDots: {
              r: '4',
              strokeWidth: '2',
            },
          }}
          bezier
          style={styles.chart}
        />
      </Card>

      <Card style={styles.statsCard}>
        <Text style={styles.sectionTitle}>统计</Text>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>平均月收入</Text>
          <Text style={styles.statValue}>
            ¥{monthlyData.income.length > 0
              ? (monthlyData.income.reduce((a, b) => a + b, 0) / monthlyData.income.length).toFixed(2)
              : '0.00'
            }
          </Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>平均月支出</Text>
          <Text style={styles.statValue}>
            ¥{monthlyData.expense.length > 0
              ? (monthlyData.expense.reduce((a, b) => a + b, 0) / monthlyData.expense.length).toFixed(2)
              : '0.00'
            }
          </Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>最高收入</Text>
          <Text style={[styles.statValue, { color: theme.colors.income }]}>
            ¥{Math.max(...monthlyData.income).toFixed(2)}
          </Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>最高支出</Text>
          <Text style={[styles.statValue, { color: theme.colors.expense }]}>
            ¥{Math.max(...monthlyData.expense).toFixed(2)}
          </Text>
        </View>
      </Card>
    </PageTemplate>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    margin: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  summaryValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
  },
  chartCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  chart: {
    marginVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  statsCard: {
    margin: theme.spacing.lg,
    marginTop: theme.spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  statLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  statValue: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
});