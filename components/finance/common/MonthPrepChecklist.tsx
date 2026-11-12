import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@/components/base/Text';
import { useMonthPreparation } from '@/hooks/useMonthPreparation';
import theme from '@/theme';

interface MonthPrepChecklistProps {
  year: number;
  month: number;
  /** Tapping a row jumps to the screen where the remaining work happens. */
  onPressBudgets?: () => void;
  onPressBalances?: () => void;
}

/**
 * A quiet, always-visible summary of whether the month is fully set up.
 *
 * It is not a nag — it just states the current state, so the month-over
 * ritual becomes visible instead of something you have to remember.
 */
export function MonthPrepChecklist({
  year,
  month,
  onPressBudgets,
  onPressBalances,
}: MonthPrepChecklistProps) {
  const { status } = useMonthPreparation(year, month);

  if (!status) return null;

  const budgetsDone = !status.missingBudgets;
  const balancesDone = !status.missingBalances;

  const rows: Array<{
    key: string;
    label: string;
    done: boolean;
    onPress?: () => void;
  }> = [
    {
      key: 'budgets',
      label: status.expectedBudgetCount > 0
        ? `预算已创建（${status.budgetCount}/${status.expectedBudgetCount}）`
        : '预算已创建',
      done: budgetsDone,
      onPress: onPressBudgets,
    },
    {
      key: 'balances',
      label: status.totalAccounts > 0
        ? `期初余额已设置（${status.accountsWithBalance}/${status.totalAccounts}）`
        : '期初余额已设置',
      done: balancesDone,
      onPress: onPressBalances,
    },
  ];

  const allDone = budgetsDone && balancesDone;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>本月准备</Text>
        <Text style={[styles.state, allDone && styles.stateDone]}>
          {allDone ? '已完成' : '还差一点'}
        </Text>
      </View>

      {rows.map((row) => (
        <TouchableOpacity
          key={row.key}
          style={styles.row}
          onPress={row.onPress}
          disabled={!row.onPress}
          activeOpacity={row.onPress ? 0.7 : 1}
        >
          <Text style={[styles.mark, row.done ? styles.markDone : styles.markTodo]}>
            {row.done ? '✓' : '○'}
          </Text>
          <Text style={[styles.label, row.done && styles.labelDone]}>
            {row.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    ...theme.shadows.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  state: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.warning,
  },
  stateDone: {
    color: theme.colors.success,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  mark: {
    fontSize: theme.fontSize.md,
    width: 22,
  },
  markDone: {
    color: theme.colors.success,
  },
  markTodo: {
    color: theme.colors.textTertiary,
  },
  label: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
  },
  labelDone: {
    color: theme.colors.textSecondary,
  },
});
