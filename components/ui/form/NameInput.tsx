import React, { memo, useCallback } from 'react';
import { View, StyleSheet, TextInput } from 'react-native';
import { Text } from '@/components/base/Text';
import theme from '@/theme';

interface NameInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const NameInput = memo(function NameInput({
  value,
  onChange,
  disabled,
  placeholder = '输入交易名称'
}: NameInputProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>名称</Text>
      <TextInput
        style={[styles.input, disabled && styles.inputDisabled]}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textTertiary}
        value={value}
        onChangeText={onChange}
        editable={!disabled}
      />
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
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  inputDisabled: {
    backgroundColor: theme.colors.surfaceDark,
    color: theme.colors.textSecondary,
  },
});