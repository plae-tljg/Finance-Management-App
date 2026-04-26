import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Card } from '@/components/base/Card';
import { Text } from '@/components/base/Text';
import { PageTemplate } from '@/components/base/PageTemplate';
import { useFinance } from '@/contexts/FinanceContext';
import { useTransactionService } from '@/services/business/TransactionService';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';
import theme from '@/theme';

interface YearlyStat {
  year: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
}

export default function YearlySummaryPage() {
  const { isReady } = useFinance();
  const { databaseService } = useDatabaseSetup();
  const transactionService = useTransactionService(databaseService);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [yearlyStats, setYearlyStats] = useState<YearlyStat[]>([]);
  const [monthlyBreakdown, setMonthlyBreakdown] = useState<{
    month: string;
    income: number;
    expense: number;
  }[]>([]);

  const loadData = useCallback(async () => {
    if (!transactionService || !isReady) return;

    try {
      const years: YearlyStat[] = [];
      const currentYear = new Date().getFullYear();

      for (let y = currentYear - 2; y <= currentYear; y++) {
        const startDate = `${y}-01-01`;
        const endDate = `${y + 1}-01-01`;

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

        years.push({
          year: y,
          totalIncome: income,
          totalExpense: expense,
          balance: income - expense,
          transactionCount: transactions.length,
        });
      }

      setYearlyStats(years);

      const startDate = `${selectedYear}-01-01`;
      const endDate = `${selectedYear + 1}-01-01`;

      const yearTransactions = await transactionService.getTransactionsByDateRangeWithCategory(
        startDate,
        endDate
      );

      const monthly = [];
      for (let m = 1; m <= 12; m++) {
        const monthTransactions = yearTransactions.filter(t => {
          const date = new Date(t.date);
          return date.getFullYear() === selectedYear && date.getMonth() + 1 === m;
        });

        const income = monthTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);

        const expense = monthTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        monthly.push({
          month: `${m}月`,
          income,
          expense,
        });
      }

      setMonthlyBreakdown(monthly.filter(m => m.income > 0 || m.expense > 0));
    } catch (error) {
      console.error('加载年度数据失败:', error);
    }
  }, [transactionService, isReady, selectedYear]);

  useEffect(() => {
    if (isReady) {
      loadData();
    }
  }, [isReady, loadData]);

  const selectedYearStat = yearlyStats.find(y => y.year === selectedYear) || {
    year: selectedYear,
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    transactionCount: 0,
  };

  return (
    <PageTemplate title="年度总结">
      <View style={styles.yearSelector}>
        {yearlyStats.map((stat) => (
          <TouchableOpacity
            key={stat.year}
            style={[
              styles.yearButton,
              selectedYear === stat.year && styles.yearButtonActive,
            ]}
            onPress={() => setSelectedYear(stat.year)}
          >
            <Text style={[
              styles.yearButtonText,
              selectedYear === stat.year && styles.yearButtonTextActive,
            ]}>
              {stat.year}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Card style={styles.summaryCard}>
        <Text style={styles.sectionTitle}>{selectedYear}年总结</Text>

        <View style={styles.yearTotalRow}>
          <View style={styles.yearTotalItem}>
            <Text style={styles.yearTotalLabel}>总收入</Text>
            <Text style={[styles.yearTotalValue, { color: theme.colors.income }]}>
              ¥{selectedYearStat.totalIncome.toFixed(2)}
            </Text>
          </View>
          <View style={styles.yearTotalItem}>
            <Text style={styles.yearTotalLabel}>总支出</Text>
            <Text style={[styles.yearTotalValue, { color: theme.colors.expense }]}>
              ¥{selectedYearStat.totalExpense.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={[styles.yearTotalRow, styles.balanceRow]}>
          <Text style={styles.yearTotalLabel}>年度结余</Text>
          <Text style={[
            styles.balanceValue,
            { color: selectedYearStat.balance >= 0 ? theme.colors.income : theme.colors.expense }
          ]}>
            ¥{selectedYearStat.balance.toFixed(2)}
          </Text>
        </View>

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>交易笔数</Text>
          <Text style={styles.statValue}>{selectedYearStat.transactionCount} 笔</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>月均支出</Text>
          <Text style={styles.statValue}>
            ¥{(selectedYearStat.totalExpense / 12).toFixed(2)}
          </Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>月均收入</Text>
          <Text style={styles.statValue}>
            ¥{(selectedYearStat.totalIncome / 12).toFixed(2)}
          </Text>
        </View>
      </Card>

      {monthlyBreakdown.length > 0 && (
        <Card style={styles.monthlyCard}>
          <Text style={styles.sectionTitle}>月度明细</Text>
          {monthlyBreakdown.map((item, index) => (
            <View key={index} style={styles.monthlyRow}>
              <Text style={styles.monthlyMonth}>{item.month}</Text>
              <View style={styles.monthlyValues}>
                <Text style={[styles.monthlyValue, { color: theme.colors.income }]}>
                  +¥{item.income.toFixed(0)}
                </Text>
                <Text style={[styles.monthlyValue, { color: theme.colors.expense }]}>
                  -¥{item.expense.toFixed(0)}
                </Text>
                <Text style={[
                  styles.monthlyBalance,
                  { color: (item.income - item.expense) >= 0 ? theme.colors.income : theme.colors.expense }
                ]}>
                  ¥{(item.income - item.expense).toFixed(0)}
                </Text>
              </View>
            </View>
          ))}
        </Card>
      )}
    </PageTemplate>
  );
}

const styles = StyleSheet.create({
  yearSelector: {
    flexDirection: 'row',
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  yearButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  yearButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  yearButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  yearButtonTextActive: {
    color: theme.colors.white,
  },
  summaryCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  yearTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  yearTotalItem: {
    flex: 1,
    alignItems: 'center',
  },
  yearTotalLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  yearTotalValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
  },
  balanceRow: {
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    marginTop: theme.spacing.sm,
  },
  balanceValue: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
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
  monthlyCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xxl,
  },
  monthlyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  monthlyMonth: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    width: 40,
  },
  monthlyValues: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  monthlyValue: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  monthlyBalance: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    minWidth: 60,
    textAlign: 'right',
  },
});