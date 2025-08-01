import React from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BudgetItem } from './BudgetItem';
import type { BudgetWithCategory } from '@/services/database/repositories/BudgetRepository';

interface BudgetListProps {
  budgets: BudgetWithCategory[];
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onDelete: (id: number) => void;
  onEdit: (id: number) => void;
  title?: string; // 添加可选的标题属性
}

export function BudgetList({ 
  budgets, 
  isLoading, 
  isRefreshing, 
  onRefresh,
  onDelete,
  onEdit,
  title
}: BudgetListProps) {
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
    <SafeAreaView style={styles.container}>
      {title && (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
        </View>
      )}
      <FlatList
        data={budgets}
        renderItem={({ item }) => (
          <BudgetItem 
            budget={item} 
            onDelete={() => handleDelete(item.id)}
            onEdit={() => onEdit(item.id)}
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              暂无预算记录
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  list: {
    flexGrow: 1,
    padding: 16,
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