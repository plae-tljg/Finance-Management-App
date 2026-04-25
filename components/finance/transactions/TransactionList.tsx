import React from 'react';
import { StyleSheet, View, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/base/Text';
import { TransactionItem } from '@/components/finance/transactions/TransactionItem';
import { BackgroundImage } from '@/components/base/BackgroundImage';
import type { Transaction } from '@/services/database/schemas/Transaction';
import theme from '@/theme';

interface TransactionListProps {
  transactions: Transaction[];
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onDelete: (id: number) => void;
  title?: string;
  fullScreen?: boolean;
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
    onRefresh();
  }, [onDelete, onRefresh]);

  if (isLoading) {
    if (fullScreen) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      );
    }
    return (
      <BackgroundImage>
        <SafeAreaView style={styles.container} edges={['top']}>
          <Text style={styles.loadingText}>加载中...</Text>
        </SafeAreaView>
      </BackgroundImage>
    );
  }

  if (fullScreen) {
    return (
      <View style={[styles.container, styles.fullScreen]}>
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

  return (
    <BackgroundImage>
      <SafeAreaView style={styles.container} edges={['top']}>
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
    </BackgroundImage>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fullScreen: {
    height: '100%',
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