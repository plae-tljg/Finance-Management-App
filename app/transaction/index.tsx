import React from 'react';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';
import { useTransactionService } from '@/services/business/TransactionService';
import { useAccountService } from '@/services/business/AccountService';
import { LoadingView } from '@/components/base/LoadingView';
import { ErrorView } from '@/components/base/ErrorView';
import { TransactionList } from '@/components/finance/transactions/TransactionList';
import type { Transaction } from '@/services/database/schemas/Transaction';
import type { Account } from '@/services/database/schemas/Account';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { Text } from '@/components/base/Text';
import { PageTemplate } from '@/components/base/PageTemplate';

export default function TransactionsScreen() {
  const params = useLocalSearchParams();
  const { isReady, error, databaseService, retry } = useDatabaseSetup();
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = React.useState<number | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const currentYear = params.year ? parseInt(params.year as string) : new Date().getFullYear();
  const currentMonth = params.month ? parseInt(params.month as string) : new Date().getMonth() + 1;

  const transactionService = React.useMemo(
    () => databaseService ? useTransactionService(databaseService) : null,
    [databaseService]
  );

  const accountService = React.useMemo(
    () => databaseService ? useAccountService(databaseService) : null,
    [databaseService]
  );

  useFocusEffect(
    React.useCallback(() => {
      loadAccounts();
      loadTransactions();
    }, [currentYear, currentMonth, selectedAccountId])
  );

  const loadAccounts = async () => {
    if (!accountService) return;
    try {
      const data = await accountService.getAccounts();
      setAccounts(data);
    } catch (err) {
      console.error('加载账户失败:', err);
    }
  };

  const loadTransactions = React.useCallback(async () => {
    if (!transactionService) return;

    try {
      setIsLoading(true);
      let data: Transaction[];

      if (selectedAccountId !== null && params.year && params.month) {
        data = await transactionService.getTransactionsByMonthAndAccount(currentYear, currentMonth, selectedAccountId);
      } else if (selectedAccountId !== null) {
        data = await transactionService.getTransactionsByAccountId(selectedAccountId);
      } else if (params.year && params.month) {
        data = await transactionService.getTransactionsByMonth(currentYear, currentMonth);
      } else {
        data = await transactionService.getTransactions();
      }
      setTransactions(data);
    } catch (err) {
      console.error('加载交易失败:', err);
    } finally {
      setIsLoading(false);
    }
  }, [transactionService, currentYear, currentMonth, selectedAccountId, params.year, params.month]);

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

  const handleAccountFilter = (accountId: number | null) => {
    setSelectedAccountId(accountId);
  };

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
    <PageTemplate
      title={params.year && params.month
        ? `${currentYear}年${currentMonth}月交易记录`
        : '交易记录'
      }
      scrollable={false}
    >
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedAccountId === null && styles.filterButtonActive
            ]}
            onPress={() => handleAccountFilter(null)}
          >
            <Text style={[
              styles.filterButtonText,
              selectedAccountId === null && styles.filterButtonTextActive
            ]}>全部</Text>
          </TouchableOpacity>
          {accounts.map((account) => (
            <TouchableOpacity
              key={account.id}
              style={[
                styles.filterButton,
                selectedAccountId === account.id && styles.filterButtonActive,
                selectedAccountId === account.id && { borderColor: account.color }
              ]}
              onPress={() => handleAccountFilter(account.id)}
            >
              <Text style={styles.filterIcon}>{account.icon}</Text>
              <Text style={[
                styles.filterButtonText,
                selectedAccountId === account.id && { color: account.color }
              ]}>{account.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <TransactionList
        transactions={transactions}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        onRefresh={onRefresh}
        onDelete={handleDelete}
        title={params.year && params.month
          ? `${currentYear}年${currentMonth}月交易记录`
          : '所有交易记录'
        }
        fullScreen={true}
      />
    </PageTemplate>
  );
}

const styles = StyleSheet.create({
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterButtonActive: {
    backgroundColor: '#fff',
    borderColor: '#007AFF',
  },
  filterIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
});