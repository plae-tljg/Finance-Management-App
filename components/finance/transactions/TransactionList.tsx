import React from 'react';
import { StyleSheet, View, FlatList, RefreshControl } from 'react-native';
import { Text } from '@/components/base/Text';
import { TransactionItem } from '@/components/finance/transactions/TransactionItem';
import type { Transaction } from '@/services/database/schemas/Transaction';

interface TransactionListProps {
  transactions: Transaction[];
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onDelete: (id: number) => void;
}

export function TransactionList({ 
  transactions, 
  isLoading, 
  isRefreshing, 
  onRefresh,
  onDelete
}: TransactionListProps) {
  const handleDelete = React.useCallback(async (id: number) => {
    await onDelete(id);
    // 删除后立即刷新列表
    onRefresh();
  }, [onDelete, onRefresh]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>加载中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TransactionItem 
            transaction={item} 
            onDelete={() => handleDelete(item.id)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              暂无交易记录
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});