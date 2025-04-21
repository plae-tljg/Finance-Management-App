import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@/components/base/Text';
import { Card } from '@/components/base/Card';
import { TransactionList } from './TransactionList';
import { useFinance } from '@/contexts/FinanceContext';
import { withDataLoading } from '@/components/base/withDataLoading';
import { router } from 'expo-router';

function RecentTransactionsBase() {
  const { transactions, isLoadingTransactions, refreshTransactions } = useFinance();
  
  const recentTransactions = transactions.slice(0, 5);

  const handleViewAll = () => {
    router.push('/transaction');
  };

  return (
    <Card style={styles.card}>
      <View style={styles.sectionHeader}>
        <Text variant="subtitle">最近交易</Text>
        <TouchableOpacity onPress={handleViewAll}>
          <Text style={styles.viewAll}>查看全部</Text>
        </TouchableOpacity>
      </View>
      <TransactionList 
        transactions={recentTransactions}
        isLoading={isLoadingTransactions}
        isRefreshing={false}
        onRefresh={refreshTransactions}
      />
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
  }
});

export const RecentTransactions = withDataLoading(RecentTransactionsBase, {
  loadingMessage: "加载最近交易...",
  errorMessage: "加载交易失败"
}); 