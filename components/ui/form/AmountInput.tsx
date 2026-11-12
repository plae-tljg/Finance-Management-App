import React, { memo, useCallback } from 'react';
import { View, StyleSheet, TextInput } from 'react-native';
import { Text } from '@/components/base/Text';
import theme from '@/theme';

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const AmountInput = memo(function AmountInput({ value, onChange, disabled }: AmountInputProps) {
  const handleChange = useCallback((text: string) => {
    // Keep digits and a single decimal separator.
    let cleaned = text.replace(/[^0-9.]/g, '');
    const firstDot = cleaned.indexOf('.');
    if (firstDot !== -1) {
      cleaned =
        cleaned.slice(0, firstDot + 1) +
        cleaned.slice(firstDot + 1).replace(/\./g, '');
    }

    // Cap at 2 decimal places by truncating, NOT by rejecting the keystroke.
    // Rejecting made the field feel "insensitive": the key was swallowed and
    // the displayed value never changed.
    if (cleaned.includes('.')) {
      const [integerPart, decimalPart = ''] = cleaned.split('.');
      cleaned = `${integerPart}.${decimalPart.slice(0, 2)}`;
    }

    onChange(cleaned);
  }, [onChange]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>金额</Text>
      <View style={styles.inputContainer}>
        <Text style={styles.currency}>¥</Text>
        <TextInput
          style={[styles.input, disabled && styles.inputDisabled]}
          keyboardType="numeric"
          placeholder="0.00"
          placeholderTextColor={theme.colors.textTertiary}
          value={value}
          onChangeText={handleChange}
          editable={!disabled}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    // Label above the field, like every other field in the form.
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  currency: {
    fontSize: theme.fontSize.lg,
    marginRight: theme.spacing.xs,
    color: theme.colors.text,
  },
  input: {
    flex: 1,
    fontSize: theme.fontSize.lg,
    paddingVertical: theme.spacing.md,
    color: theme.colors.text,
  },
  inputDisabled: {
    backgroundColor: theme.colors.surfaceDark,
    color: theme.colors.textSecondary,
  },
});