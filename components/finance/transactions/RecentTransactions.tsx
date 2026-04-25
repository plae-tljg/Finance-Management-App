import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@/components/base/Text';
import { Card } from '@/components/base/Card';
import { TransactionItem } from './TransactionItem';
import { useFinance } from '@/contexts/FinanceContext';
import { withDataLoading } from '@/components/base/withDataLoading';
import { router } from 'expo-router';
import theme from '@/theme';

function RecentTransactionsBase() {
  const { transactions, isLoadingTransactions } = useFinance();
  
  const recentTransactions = transactions.slice(0, 3);

  const handleViewAll = () => {
    router.push('/transaction');
  };

  if (isLoadingTransactions) {
    return (
      <Card style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text variant="subtitle">最近交易</Text>
          <TouchableOpacity onPress={handleViewAll}>
            <Text style={styles.viewAll}>查看全部</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <View style={styles.sectionHeader}>
        <Text variant="subtitle">最近交易</Text>
        <TouchableOpacity onPress={handleViewAll}>
          <Text style={styles.viewAll}>查看全部</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.transactionsContainer}>
        {recentTransactions.length > 0 ? (
          recentTransactions.map((transaction) => (
            <TransactionItem
              key={transaction.id}
              transaction={transaction}
              onDelete={() => {}}
              showActions={false}
            />
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>暂无交易记录</Text>
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: theme.spacing.lg,
    margin: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  viewAll: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.sm,
  },
  transactionsContainer: {
    gap: theme.spacing.sm,
  },
  loadingContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
  },
  emptyContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
  }
});

export const RecentTransactions = withDataLoading(RecentTransactionsBase, {
  loadingMessage: "加载最近交易...",
  errorMessage: "加载交易失败"
}); 