import React, { memo, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@/components/base/Text';
import theme from '@/theme';

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface PeriodSelectorProps {
  value: Period;
  onChange: (period: Period) => void;
}

const PERIOD_LABELS: Record<Period, string> = {
  daily: '日',
  weekly: '周',
  monthly: '月',
  yearly: '年',
};

export const PeriodSelector = memo(function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>周期</Text>
      <View style={styles.grid}>
        {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.button,
              value === period && styles.activeButton
            ]}
            onPress={() => onChange(period)}
          >
            <Text style={[
              styles.buttonText,
              value === period && styles.activeButtonText
            ]}>
              {PERIOD_LABELS[period]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {},
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  button: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surfaceDark,
    minWidth: 50,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activeButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  buttonText: {
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
  },
  activeButtonText: {
    color: theme.colors.white,
  },
});