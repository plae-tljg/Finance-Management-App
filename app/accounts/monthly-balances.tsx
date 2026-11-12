import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text } from '@/components/base/Text';
import { PageTemplate } from '@/components/base/PageTemplate';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAccountMonthlyBalanceService } from '@/services/business/AccountMonthlyBalanceService';
import { useAccountService } from '@/services/business/AccountService';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';
import { BalanceInputRow } from '@/components/ui/form/BalanceInputRow';
import { MonthYearPicker } from '@/components/common/ui/MonthYearPicker';
import { MonthPrepPrompt } from '@/components/finance/common/MonthPrepPrompt';
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
  const [showDatePicker, setShowDatePicker] = useState(false);

  // The month is editable here so a user can jump straight to next month and
  // seed it from the month they just closed.
  const [currentYear, setCurrentYear] = useState(
    params.year ? parseInt(params.year as string) : new Date().getFullYear(),
  );
  const [currentMonth, setCurrentMonth] = useState(
    params.month ? parseInt(params.month as string) : new Date().getMonth() + 1,
  );

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

  /**
   * Seed this month from last month: a new month opens with the balance the
   * previous month closed on. Accounts without a previous-month record are
   * left untouched.
   */
  const handleCarryOver = useCallback(async () => {
    if (!accountMonthlyBalanceService) return;

    try {
      const previousBalances =
        await accountMonthlyBalanceService.getPreviousMonthBalances(
          currentYear,
          currentMonth,
        );
      const closingByAccount = new Map(
        previousBalances.map((balance) => [balance.accountId, balance.closingBalance]),
      );

      let carriedCount = 0;
      setAccountBalances((prev) =>
        prev.map((row) => {
          const carried = closingByAccount.get(row.account.id);
          if (carried === undefined) return row;
          carriedCount += 1;
          const value = String(carried);
          return { ...row, openingBalance: value, closingBalance: value };
        }),
      );

      if (carriedCount === 0) {
        Alert.alert(
          '没有可沿用的数据',
          '上个月没有记录过账户余额，请手动填写期初余额。',
        );
      } else {
        Alert.alert(
          '已沿用上月余额',
          `已将 ${carriedCount} 个账户的期初余额设为上个月的期末余额，记得点击「保存全部」保存。`,
        );
      }
    } catch (error) {
      console.error('沿用上月余额失败:', error);
      Alert.alert('错误', '沿用上月余额失败，请重试');
    }
  }, [accountMonthlyBalanceService, currentYear, currentMonth]);

  const changeMonth = useCallback((offset: number) => {
    setCurrentMonth((prev) => {
      const next = prev + offset;
      if (next < 1) {
        setCurrentYear((y) => y - 1);
        return 12;
      }
      if (next > 12) {
        setCurrentYear((y) => y + 1);
        return 1;
      }
      return next;
    });
  }, []);

  const selectMonth = useCallback((year: number, month: number) => {
    setCurrentYear(year);
    setCurrentMonth(month);
    setShowDatePicker(false);
  }, []);

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
      <MonthPrepPrompt year={currentYear} month={currentMonth} />

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

      <View style={styles.monthBar}>
        <TouchableOpacity
          style={styles.monthButton}
          onPress={() => changeMonth(-1)}
          accessibilityLabel="上个月"
        >
          <Text style={styles.monthButtonText}>‹</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.monthDisplay}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.monthText}>
            {currentYear}年{currentMonth}月
          </Text>
          <Text style={styles.monthHint}>点击选择月份</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.monthButton}
          onPress={() => changeMonth(1)}
          accessibilityLabel="下个月"
        >
          <Text style={styles.monthButtonText}>›</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.carryOverButton} onPress={handleCarryOver}>
        <Text style={styles.carryOverButtonText}>沿用上月余额</Text>
        <Text style={styles.carryOverButtonHint}>
          把上个月的期末余额作为本月的期初余额
        </Text>
      </TouchableOpacity>

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

      <MonthYearPicker
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onSelect={selectMonth}
        currentYear={currentYear}
        currentMonth={currentMonth}
      />
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
  monthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  monthButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surfaceDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthButtonText: {
    fontSize: theme.fontSize.xl,
    lineHeight: theme.fontSize.xl + 4,
    color: theme.colors.primary,
  },
  monthDisplay: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  monthText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  monthHint: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textTertiary,
    marginTop: 2,
  },
  carryOverButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  carryOverButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
    textAlign: 'center',
  },
  carryOverButtonHint: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    marginTop: 2,
  },
  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.md,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
  },
});