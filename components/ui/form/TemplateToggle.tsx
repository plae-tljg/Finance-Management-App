import React, { memo, useCallback } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@/components/base/Text';
import theme from '@/theme';

interface TemplateToggleProps {
  active: boolean;
  onToggle: () => void;
}

export const TemplateToggle = memo(function TemplateToggle({ active, onToggle }: TemplateToggleProps) {
  return (
    <TouchableOpacity
      style={[styles.button, active && styles.activeButton]}
      onPress={onToggle}
    >
      <Text style={[styles.buttonText, active && styles.activeButtonText]}>
        模板
      </Text>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  button: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surfaceDark,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activeButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  buttonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  activeButtonText: {
    color: theme.colors.white,
    fontWeight: theme.fontWeight.medium,
  },
});