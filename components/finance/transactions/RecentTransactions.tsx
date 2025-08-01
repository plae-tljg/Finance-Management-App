import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@/components/base/Text';
import { Card } from '@/components/base/Card';
import { TransactionItem } from './TransactionItem';
import { useFinance } from '@/contexts/FinanceContext';
import { withDataLoading } from '@/components/base/withDataLoading';
import { router } from 'expo-router';

function RecentTransactionsBase() {
  const { transactions, isLoadingTransactions } = useFinance();
  
  const recentTransactions = transactions.slice(0, 3); // 只显示最新的3条记录

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
              onDelete={() => {}} // 在主页不显示删除按钮
              showActions={false} // 在主页不显示操作按钮
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
    padding: 16,
    margin: 8,
    borderRadius: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAll: {
    color: '#007AFF',
    fontSize: 14,
  },
  transactionsContainer: {
    gap: 8,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
  }
});

export const RecentTransactions = withDataLoading(RecentTransactionsBase, {
  loadingMessage: "加载最近交易...",
  errorMessage: "加载交易失败"
}); 