import React from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text } from '@/components/base/Text';
import type { MonthPreparationStatus } from '@/services/business/MonthPreparationService';
import theme from '@/theme';

interface MonthPrepBannerProps {
  status: MonthPreparationStatus | null;
  isPreparing: boolean;
  onPrepare: () => void;
  onDismiss: () => void;
}

/**
 * A gentle, dismissible prompt shown at the start of a new month.
 *
 * It only appears when there is genuinely something to do (budgets or
 * opening balances missing), only for the month in progress, and it can be
 * dismissed — the dismissal lasts until the next month.
 */
export function MonthPrepBanner({
  status,
  isPreparing,
  onPrepare,
  onDismiss,
}: MonthPrepBannerProps) {
  if (!status || status.isComplete) return null;

  const missing: string[] = [];
  if (status.missingBudgets) missing.push('预算');
  if (status.missingBalances) missing.push('期初余额');

  if (missing.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.icon}>🔔</Text>
        <View style={styles.headerText}>
          <Text style={styles.title}>{status.monthLabel}还没准备好</Text>
          <Text style={styles.subtitle}>
            还差 {missing.join('和')}，一键就能补齐
          </Text>
        </View>
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={onDismiss}
          accessibilityLabel="关闭提示"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.dismissText}>✕</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.action, isPreparing && styles.actionDisabled]}
        onPress={onPrepare}
        disabled={isPreparing}
        activeOpacity={0.8}
      >
        {isPreparing ? (
          <ActivityIndicator color={theme.colors.white} size="small" />
        ) : (
          <Text style={styles.actionText}>一键准备</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.warning,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    fontSize: 20,
    marginRight: theme.spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  dismissButton: {
    paddingHorizontal: theme.spacing.xs,
    paddingTop: 2,
  },
  dismissText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textTertiary,
  },
  action: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  actionDisabled: {
    opacity: 0.7,
  },
  actionText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
});
