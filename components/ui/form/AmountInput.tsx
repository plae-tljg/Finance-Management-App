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
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: theme.spacing.md,
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