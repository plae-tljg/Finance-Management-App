import React from 'react';
import { StyleSheet, View, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/base/Text';
import { TransactionItem } from '@/components/finance/transactions/TransactionItem';
import type { Transaction } from '@/services/database/schemas/Transaction';

interface TransactionListProps {
  transactions: Transaction[];
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onDelete: (id: number) => void;
  title?: string; // 添加可选的标题属性
  fullScreen?: boolean; // 添加全屏模式属性
}

export function TransactionList({ 
  transactions, 
  isLoading, 
  isRefreshing, 
  onRefresh,
  onDelete,
  title,
  fullScreen = false
}: TransactionListProps) {
  
  const handleDelete = React.useCallback(async (id: number) => {
    await onDelete(id);
    // 删除后立即刷新列表
    onRefresh();
  }, [onDelete, onRefresh]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>加载中...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, fullScreen && { height: '100%' }]}>
      {title && (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
        </View>
      )}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 300, // 默认高度，在组件中动态设置
  },
  header: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
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