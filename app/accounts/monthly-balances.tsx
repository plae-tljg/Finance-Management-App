import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text } from '@/components/base/Text';
import { PageTemplate } from '@/components/base/PageTemplate';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAccountMonthlyBalanceService } from '@/services/business/AccountMonthlyBalanceService';
import { useAccountService } from '@/services/business/AccountService';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';
import { BalanceInputRow } from '@/components/ui/form/BalanceInputRow';
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

  const updateOpeningBalance = useCallback((index: number, value: string) => {
    setAccountBalances(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], openingBalance: value };
      return updated;
    });
  }, []);

  const updateClosingBalance = useCallback((index: number, value: string) => {
    setAccountBalances(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], closingBalance: value };
      return updated;
    });
  }, []);

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

  const totalOpening = accountBalances.reduce((sum, row) => sum + (parseFloat(row.openingBalance) || 0), 0);
  const totalClosing = accountBalances.reduce((sum, row) => sum + (parseFloat(row.closingBalance) || 0), 0);

  if (!isReady) {
    return (
      <PageTemplate title="加载中..." showBack={false}>
        <Text style={styles.loadingText}>数据库初始化中...</Text>
      </PageTemplate>
    );
  }

  if (isLoading) {
    return (
      <PageTemplate title="加载中..." showBack={false}>
        <Text style={styles.loadingText}>加载中...</Text>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title={`${currentYear}年${currentMonth}月账户余额`}
      footer={
        <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
          <Text style={styles.updateButtonText}>保存全部</Text>
        </TouchableOpacity>
      }
    >
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
        <BalanceInputRow
          key={row.account.id}
          account={row.account}
          openingBalance={row.openingBalance}
          closingBalance={row.closingBalance}
          onOpeningChange={(value) => updateOpeningBalance(index, value)}
          onClosingChange={(value) => updateClosingBalance(index, value)}
        />
      ))}
    </PageTemplate>
  );
}

const styles = StyleSheet.create({
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
  updateButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  updateButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.md,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
  },
});