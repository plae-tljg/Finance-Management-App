import React from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { BudgetItem } from './BudgetItem';
import type { BudgetWithCategory } from '@/services/database/repositories/BudgetRepository';

interface BudgetListProps {
  budgets: BudgetWithCategory[];
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onDelete: (id: number) => void;
  onEdit: (id: number) => void;
}

export function BudgetList({ 
  budgets, 
  isLoading, 
  isRefreshing, 
  onRefresh,
  onDelete,
  onEdit
}: BudgetListProps) {
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
      <Text style={styles.title}>预算列表</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000000',
  },
  list: {
    flexGrow: 1,
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