import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/base/Text';
import { FinanceOverview } from '@/components/finance/summary/FinanceOverview';
import { RecentTransactions } from '@/components/finance/transactions/RecentTransactions';
import { useFinance } from '@/contexts/FinanceContext';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';

export default function DashboardScreen() {
  const { isReady, error } = useDatabaseSetup();
  const { loadInitialData } = useFinance();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const initializeData = async () => {
      if (isReady && isMounted) {
        try {
          await loadInitialData();
          if (isMounted) {
            setIsLoading(false);
          }
        } catch (err) {
          console.error('加载初始数据失败:', err);
          if (isMounted) {
            setIsLoading(false);
          }
        }
      }
    };

    initializeData();

    return () => {
      isMounted = false;
    };
  }, [isReady, loadInitialData]);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>数据库初始化失败: {error.message}</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>正在加载数据...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant="title">财务概览</Text>
      </View>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <FinanceOverview isReady={isReady} />
        {isReady && <RecentTransactions isReady={isReady} />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  scrollView: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
});