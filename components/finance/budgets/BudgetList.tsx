import React from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { BudgetItem } from './BudgetItem';
import type { BudgetWithCategory } from '@/services/database/repositories/BudgetRepository';
import theme from '@/theme';

interface BudgetListProps {
  budgets: BudgetWithCategory[];
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onDelete: (id: number) => void;
  onEdit: (id: number) => void;
  title?: string;
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
    onRefresh();
  }, [onDelete, onRefresh]);

  if (isLoading) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
  },
  header: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  list: {
    flexGrow: 1,
    padding: theme.spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.md,
  },
});