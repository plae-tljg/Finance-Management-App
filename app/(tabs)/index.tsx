import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { Text } from '@/components/base/Text';
import { Card } from '@/components/base/Card';
import { PageTemplate } from '@/components/base/PageTemplate';
import { FinanceOverview } from '@/components/finance/summary/FinanceOverview';
import { RecentTransactions } from '@/components/finance/transactions/RecentTransactions';
import { useFinance } from '@/contexts/FinanceContext';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';
import theme from '@/theme';

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
      <PageTemplate title="错误" showBack={false}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>数据库初始化失败: {error.message}</Text>
        </View>
      </PageTemplate>
    );
  }

  if (isLoading) {
    return (
      <PageTemplate title="加载中..." showBack={false}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>正在加载数据...</Text>
        </View>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate title="财务概览" showBack={false}>
      <FinanceOverview isReady={isReady} />
      {isReady && <RecentTransactions isReady={isReady} />}
    </PageTemplate>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  errorText: {
    color: theme.colors.danger,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    color: theme.colors.textSecondary,
  },
});