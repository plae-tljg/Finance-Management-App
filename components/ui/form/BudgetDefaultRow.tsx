import React, { memo, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, TextInput } from 'react-native';
import { Text } from '@/components/base/Text';
import theme from '@/theme';

interface BudgetDefaultRowProps {
  categoryId: number;
  categoryName: string;
  categoryIcon: string;
  initialAmount: string;
  onAmountChange: (categoryId: number, amount: string) => void;
}

export const BudgetDefaultRow = memo(function BudgetDefaultRow({
  categoryId,
  categoryName,
  categoryIcon,
  initialAmount,
  onAmountChange,
}: BudgetDefaultRowProps) {
  const [localValue, setLocalValue] = useState(initialAmount);
  const [displayValue, setDisplayValue] = useState(initialAmount);
  const commitTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleChange = useCallback((text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;

    setDisplayValue(cleaned);
    setLocalValue(cleaned);

    if (commitTimeoutRef.current) {
      clearTimeout(commitTimeoutRef.current);
    }
    commitTimeoutRef.current = setTimeout(() => {
      onAmountChange(categoryId, cleaned);
    }, 300);
  }, [categoryId, onAmountChange]);

  const handleBlur = useCallback(() => {
    if (commitTimeoutRef.current) {
      clearTimeout(commitTimeoutRef.current);
    }
    onAmountChange(categoryId, localValue);
  }, [categoryId, localValue, onAmountChange]);

  return (
    <View style={styles.row}>
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryIcon}>{categoryIcon}</Text>
        <Text style={styles.categoryName}>{categoryName}</Text>
      </View>
      <View style={styles.amountInputContainer}>
        <Text style={styles.currencySymbol}>¥</Text>
        <TextInput
          style={styles.amountInput}
          value={displayValue}
          onChangeText={handleChange}
          onBlur={handleBlur}
          keyboardType="numeric"
          placeholder="0.00"
          placeholderTextColor={theme.colors.textTertiary}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: theme.spacing.sm,
  },
  categoryName: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  currencySymbol: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    marginRight: theme.spacing.xs,
  },
  amountInput: {
    width: 100,
    height: 36,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    textAlign: 'right',
  },
});