import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/base/Text';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';
import { useTransactionService } from '@/services/business/TransactionService';
import { LoadingView } from '@/components/base/LoadingView';
import { databaseService } from '@/services/database/DatabaseService';
import { useTransactionUpdate } from '@/hooks/useDatabaseEvent';

const styles = StyleSheet.create({
  summaryContainer: {
    padding: 16,
  },
  timeRangeContainer: {
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  timeRangeText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryBalance: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  label: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  value: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  income: {
    color: '#4CAF50',
  },
  expense: {
    color: '#F44336',
  },
  monthlyAverage: {
    fontSize: 12,
    color: '#999999',
    marginTop: 4,
    fontStyle: 'italic',
  },
});

export function FinanceSummary() {
  const { isReady, error, databaseService: dbService } = useDatabaseSetup();
  const [summary, setSummary] = React.useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    timeRange: {
      startDate: null as Date | null,
      endDate: null as Date | null,
      monthsCount: 0
    }
  });

  const transactionService = React.useMemo(
    () => dbService ? useTransactionService(dbService) : null,
    [dbService]
  );

  React.useEffect(() => {
    if (!isReady || !transactionService) return;
    loadSummary();
  }, [isReady, transactionService]);

  // 监听交易更新事件
  useTransactionUpdate(() => {
    if (transactionService) {
      loadSummary();
    }
  });

  async function loadSummary() {
    if (!transactionService) return;
    
    try {
      const transactions = await transactionService.getTransactions();
      
      if (transactions.length === 0) {
        setSummary({
          totalIncome: 0,
          totalExpense: 0,
          balance: 0,
          timeRange: {
            startDate: null,
            endDate: null,
            monthsCount: 0
          }
        });
        return;
      }

      // 计算财务摘要
      const summary = transactions.reduce((acc, transaction) => {
        if (transaction.type === 'income') {
          acc.totalIncome += transaction.amount;
        } else {
          acc.totalExpense += transaction.amount;
        }
        return acc;
      }, { totalIncome: 0, totalExpense: 0, balance: 0 });
      
      summary.balance = summary.totalIncome - summary.totalExpense;

      // 计算时间范围
      const dates = transactions.map(t => new Date(t.date)).sort((a, b) => a.getTime() - b.getTime());
      const startDate = dates[0];
      const endDate = dates[dates.length - 1];
      
      // 计算月份数
      const monthsCount = calculateMonthsBetween(startDate, endDate);
      
      setSummary({
        ...summary,
        timeRange: {
          startDate,
          endDate,
          monthsCount
        }
      });
    } catch (err) {
      console.error('加载财务摘要失败:', err);
    }
  }

  // 计算两个日期之间的月份数
  function calculateMonthsBetween(startDate: Date, endDate: Date): number {
    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth();
    const endYear = endDate.getFullYear();
    const endMonth = endDate.getMonth();
    
    return (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
  }

  // 格式化时间范围显示
  function formatTimeRange(): string {
    if (!summary.timeRange.startDate || !summary.timeRange.endDate) {
      return '暂无数据';
    }
    
    const startDate = summary.timeRange.startDate;
    const endDate = summary.timeRange.endDate;
    const monthsCount = summary.timeRange.monthsCount;
    
    if (monthsCount === 1) {
      return `${startDate.getFullYear()}年${startDate.getMonth() + 1}月`;
    } else if (startDate.getFullYear() === endDate.getFullYear()) {
      return `${startDate.getFullYear()}年${startDate.getMonth() + 1}月-${endDate.getMonth() + 1}月 (${monthsCount}个月)`;
    } else {
      return `${startDate.getFullYear()}年${startDate.getMonth() + 1}月-${endDate.getFullYear()}年${endDate.getMonth() + 1}月 (${monthsCount}个月)`;
    }
  }

  if (error) {
    return <LoadingView message="加载财务摘要失败" />;
  }

  if (!isReady || !transactionService) {
    return <LoadingView message="加载中..." />;
  }

  return (
    <View style={styles.summaryContainer}>
      <View style={styles.timeRangeContainer}>
        <Text style={styles.timeRangeText}>{formatTimeRange()}</Text>
      </View>
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.label}>收入</Text>
          <Text style={[styles.value, styles.income]}>
            ¥{summary.totalIncome.toFixed(2)}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.label}>支出</Text>
          <Text style={[styles.value, styles.expense]}>
            ¥{summary.totalExpense.toFixed(2)}
          </Text>
        </View>
      </View>
      <View style={styles.summaryBalance}>
        <Text style={styles.label}>结余</Text>
        <Text style={[
          styles.value,
          summary.balance >= 0 ? styles.income : styles.expense
        ]}>
          ¥{summary.balance.toFixed(2)}
        </Text>
        {summary.timeRange.monthsCount > 0 && (
          <Text style={styles.monthlyAverage}>
            月均: ¥{(summary.balance / summary.timeRange.monthsCount).toFixed(2)}
          </Text>
        )}
      </View>
    </View>
  );
} 