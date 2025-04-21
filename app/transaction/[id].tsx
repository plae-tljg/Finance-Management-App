import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';
import { useTransactionService } from '@/services/business/TransactionService';
import { TransactionEdit } from '@/components/finance/transactions/TransactionEdit';
import type { Transaction } from '@/services/database/schemas/Transaction';

export default function TransactionEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { databaseService } = useDatabaseSetup();
  const transactionService = useTransactionService(databaseService);

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTransaction = async () => {
      if (!transactionService || !id) {
        return;
      }

      try {
        const transactionId = parseInt(id, 10);
        if (isNaN(transactionId)) {
          throw new Error('无效的交易ID');
        }

        const loadedTransaction = await transactionService.getTransactionById(transactionId);
        if (!loadedTransaction) {
          throw new Error('未找到交易');
        }

        setTransaction(loadedTransaction);
      } catch (error) {
        console.error('加载交易失败:', error);
        Alert.alert('错误', '加载交易失败，请重试');
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    loadTransaction();
  }, [transactionService, id, router]);

  const handleSave = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!transaction) {
    return null;
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: '编辑交易',
          headerBackTitle: '返回',
        }}
      />
      <TransactionEdit transaction={transaction} onSave={handleSave} />
    </>
  );
} 