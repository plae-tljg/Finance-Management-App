import React from 'react';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';
import { useTransactionService } from '@/services/business/TransactionService';
import { LoadingView } from '@/components/base/LoadingView';
import { ErrorView } from '@/components/base/ErrorView';
import { TransactionList } from '@/components/finance/transactions/TransactionList';
import type { Transaction } from '@/services/database/schemas/Transaction';
import { useFocusEffect } from '@react-navigation/native';
import { Stack } from 'expo-router';

export default function TransactionsScreen() {
  const { isReady, error, databaseService, retry } = useDatabaseSetup();
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const transactionService = React.useMemo(
    () => databaseService ? useTransactionService(databaseService) : null,
    [databaseService]
  );

  // 当页面获得焦点时刷新数据
  useFocusEffect(
    React.useCallback(() => {
      loadTransactions();
    }, [])
  );

  const loadTransactions = React.useCallback(async () => {
    if (!transactionService) return;
    
    try {
      setIsLoading(true);
      const data = await transactionService.getTransactions();
      setTransactions(data);
    } catch (err) {
      console.error('加载交易失败:', err);
    } finally {
      setIsLoading(false);
    }
  }, [transactionService]);

  const onRefresh = React.useCallback(async () => {
    if (!transactionService) return;
    
    try {
      setIsRefreshing(true);
      await loadTransactions();
    } finally {
      setIsRefreshing(false);
    }
  }, [transactionService, loadTransactions]);

  const handleDelete = React.useCallback(async (id: number) => {
    if (!transactionService) return;
    
    try {
      const success = await transactionService.deleteTransaction(id);
      if (success) {
        setTransactions(prev => prev.filter(transaction => transaction.id !== id));
      }
    } catch (err) {
      console.error('删除交易失败:', err);
    }
  }, [transactionService]);

  if (error) {
    return <ErrorView 
      error={error} 
      onRetry={retry}
      message="加载交易失败" 
    />;
  }

  if (!isReady || !transactionService) {
    return <LoadingView message="加载中..." />;
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: '交易记录',
        }}
      />
      <TransactionList
        transactions={transactions}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        onRefresh={onRefresh}
        onDelete={handleDelete}
      />
    </>
  );
} 