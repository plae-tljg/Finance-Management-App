import React, { memo, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@/components/base/Text';
import theme from '@/theme';

interface TypeSelectorProps {
  value: 'income' | 'expense';
  onChange: (type: 'income' | 'expense') => void;
}

export const TypeSelector = memo(function TypeSelector({ value, onChange }: TypeSelectorProps) {
  const handlePress = useCallback((type: 'income' | 'expense') => {
    onChange(type);
  }, [onChange]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>类型</Text>
      <View style={styles.selector}>
        <TouchableOpacity
          style={[styles.button, value === 'expense' && styles.activeButton]}
          onPress={() => handlePress('expense')}
        >
          <Text style={[styles.buttonText, value === 'expense' && styles.activeButtonText]}>
            支出
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, value === 'income' && styles.activeButton]}
          onPress={() => handlePress('income')}
        >
          <Text style={[styles.buttonText, value === 'income' && styles.activeButtonText]}>
            收入
          </Text>
        </TouchableOpacity>
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
  selector: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceDark,
    borderRadius: theme.borderRadius.sm,
    padding: 3,
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  button: {
    flex: 1,
    padding: theme.spacing.sm,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm - 2,
  },
  activeButton: {
    backgroundColor: theme.colors.primary,
  },
  buttonText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  activeButtonText: {
    color: theme.colors.white,
    fontWeight: theme.fontWeight.medium,
  },
});