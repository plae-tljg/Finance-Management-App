import React, { memo, useCallback } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@/components/base/Text';
import theme from '@/theme';

interface SubmitButtonProps {
  onPress: () => void;
  loading?: boolean;
  label?: string;
}

export const SubmitButton = memo(function SubmitButton({
  onPress,
  loading = false,
  label = '保存'
}: SubmitButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, loading && styles.buttonDisabled]}
      onPress={onPress}
      disabled={loading}
    >
      <Text style={styles.buttonText}>
        {loading ? '保存中...' : label}
      </Text>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xxl,
  },
  buttonDisabled: {
    backgroundColor: theme.colors.textTertiary,
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
  },
});