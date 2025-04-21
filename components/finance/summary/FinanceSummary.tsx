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
});

export function FinanceSummary() {
  const { isReady, error, databaseService: dbService } = useDatabaseSetup();
  const [summary, setSummary] = React.useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0
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
      const summary = transactions.reduce((acc, transaction) => {
        if (transaction.type === 'income') {
          acc.totalIncome += transaction.amount;
        } else {
          acc.totalExpense += transaction.amount;
        }
        return acc;
      }, { totalIncome: 0, totalExpense: 0, balance: 0 });
      
      summary.balance = summary.totalIncome - summary.totalExpense;
      setSummary(summary);
    } catch (err) {
      console.error('加载财务摘要失败:', err);
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
      </View>
    </View>
  );
} 