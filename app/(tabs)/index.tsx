import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/base/Text';
import { Card } from '@/components/base/Card';
import { HeaderCard } from '@/components/base/HeaderCard';
import { BackgroundImage } from '@/components/base/BackgroundImage';
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
      <BackgroundImage>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>数据库初始化失败: {error.message}</Text>
        </View>
      </BackgroundImage>
    );
  }

  if (isLoading) {
    return (
      <BackgroundImage>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>正在加载数据...</Text>
        </View>
      </BackgroundImage>
    );
  }

  return (
    <BackgroundImage blurTint="light" overlayOpacity={0.05}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <HeaderCard title="财务概览" showBack={false} />
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <FinanceOverview isReady={isReady} />
          {isReady && <RecentTransactions isReady={isReady} />}
        </ScrollView>
      </SafeAreaView>
    </BackgroundImage>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
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