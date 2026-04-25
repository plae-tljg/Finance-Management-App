import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/base/Text';
import { Card } from '@/components/base/Card';
import { HeaderCard } from '@/components/base/HeaderCard';
import { BackgroundImage } from '@/components/base/BackgroundImage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAccountMonthlyBalanceService } from '@/services/business/AccountMonthlyBalanceService';
import { useAccountService } from '@/services/business/AccountService';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';
import type { AccountMonthlyBalance } from '@/services/database/schemas/AccountMonthlyBalance';
import type { Account } from '@/services/database/schemas/Account';
import theme from '@/theme';

interface AccountBalanceRow {
  account: Account;
  balance: AccountMonthlyBalance | null;
  openingBalance: string;
  closingBalance: string;
}

export default function MonthlyBalancesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isReady, databaseService } = useDatabaseSetup();
  const [accountBalances, setAccountBalances] = useState<AccountBalanceRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentYear = params.year ? parseInt(params.year as string) : new Date().getFullYear();
  const currentMonth = params.month ? parseInt(params.month as string) : new Date().getMonth() + 1;

  const accountMonthlyBalanceService = React.useMemo(
    () => isReady && databaseService ? useAccountMonthlyBalanceService(databaseService) : null,
    [isReady, databaseService]
  );

  const accountService = React.useMemo(
    () => isReady && databaseService ? useAccountService(databaseService) : null,
    [isReady, databaseService]
  );

  useEffect(() => {
    if (!accountMonthlyBalanceService || !accountService) return;

    const loadData = async () => {
      try {
        setIsLoading(true);
        const accounts = await accountService.getAccounts();
        const monthlyBalances = await accountMonthlyBalanceService.getAccountBalancesByMonth(currentYear, currentMonth);

        const rows: AccountBalanceRow[] = accounts
          .filter(a => a.isActive)
          .map(account => {
            const balance = monthlyBalances.find(b => b.accountId === account.id) || null;
            return {
              account,
              balance,
              openingBalance: balance?.openingBalance.toString() || '0',
              closingBalance: balance?.closingBalance.toString() || '0'
            };
          });

        setAccountBalances(rows);
      } catch (error) {
        console.error('加载账户余额失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [accountMonthlyBalanceService, accountService, currentYear, currentMonth]);

  const handleUpdate = async () => {
    if (!accountMonthlyBalanceService) return;

    try {
      for (const row of accountBalances) {
        await accountMonthlyBalanceService.upsertAccountBalance(
          row.account.id,
          currentYear,
          currentMonth,
          parseFloat(row.openingBalance) || 0,
          parseFloat(row.closingBalance) || 0
        );
      }
      Alert.alert('成功', '账户月度余额已更新');
    } catch (error) {
      console.error('更新账户余额失败:', error);
      Alert.alert('错误', '更新账户余额失败，请重试');
    }
  };

  const updateOpeningBalance = (index: number, value: string) => {
    setAccountBalances(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], openingBalance: value };
      return updated;
    });
  };

  const updateClosingBalance = (index: number, value: string) => {
    setAccountBalances(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], closingBalance: value };
      return updated;
    });
  };

  const totalOpening = accountBalances.reduce((sum, row) => sum + (parseFloat(row.openingBalance) || 0), 0);
  const totalClosing = accountBalances.reduce((sum, row) => sum + (parseFloat(row.closingBalance) || 0), 0);

  if (!isReady) {
    return (
      <BackgroundImage>
        <View style={styles.container}>
          <Text style={styles.loadingText}>数据库初始化中...</Text>
        </View>
      </BackgroundImage>
    );
  }

  if (isLoading) {
    return (
      <BackgroundImage>
        <View style={styles.container}>
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </BackgroundImage>
    );
  }

  return (
    <BackgroundImage>
      <SafeAreaView style={styles.container} edges={['top']}>
        <HeaderCard
          title={`${currentYear}年${currentMonth}月账户余额`}
        />
        <ScrollView style={styles.content}>
          <View style={styles.totalCard}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>期初合计</Text>
              <Text style={styles.totalValue}>¥{totalOpening.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>期末合计</Text>
              <Text style={styles.totalValue}>¥{totalClosing.toFixed(2)}</Text>
            </View>
          </View>

          {accountBalances.map((row, index) => (
            <View key={row.account.id} style={styles.accountCard}>
              <View style={styles.accountHeader}>
                <Text style={styles.accountIcon}>{row.account.icon}</Text>
                <Text style={styles.accountName}>{row.account.name}</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>期初余额</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={row.openingBalance}
                  onChangeText={(value) => updateOpeningBalance(index, value)}
                  placeholderTextColor={theme.colors.textTertiary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>期末余额</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={row.closingBalance}
                  onChangeText={(value) => updateClosingBalance(index, value)}
                  placeholderTextColor={theme.colors.textTertiary}
                />
              </View>
            </View>
          ))}

          <TouchableOpacity
            style={styles.updateButton}
            onPress={handleUpdate}
          >
            <Text style={styles.updateButtonText}>保存全部</Text>
          </TouchableOpacity>
        </ScrollView>

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>返回</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </BackgroundImage>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
    paddingTop: 0,
  },
  totalCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  totalLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  totalValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  accountCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  accountIcon: {
    fontSize: theme.fontSize.xl,
    marginRight: theme.spacing.sm,
  },
  accountName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    backgroundColor: theme.colors.surfaceDark,
  },
  updateButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
    alignItems: 'center',
  },
  updateButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  backButton: {
    backgroundColor: theme.colors.surfaceDark,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    margin: theme.spacing.lg,
    alignItems: 'center',
  },
  backButtonText: {
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.md,
  },
});