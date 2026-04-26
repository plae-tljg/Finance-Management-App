import React, { memo, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, TextInput } from 'react-native';
import { Text } from '@/components/base/Text';
import type { Account } from '@/services/database/schemas/Account';
import theme from '@/theme';

interface BalanceInputRowProps {
  account: Account;
  openingBalance: string;
  closingBalance: string;
  onOpeningChange: (value: string) => void;
  onClosingChange: (value: string) => void;
}

export const BalanceInputRow = memo(function BalanceInputRow({
  account,
  openingBalance,
  closingBalance,
  onOpeningChange,
  onClosingChange,
}: BalanceInputRowProps) {
  const [displayOpening, setDisplayOpening] = useState(openingBalance);
  const [displayClosing, setDisplayClosing] = useState(closingBalance);

  const openingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const closingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleOpeningChange = useCallback((text: string) => {
    const cleaned = text.replace(/[^0-9.-]/g, '');
    setDisplayOpening(cleaned);

    if (openingTimeoutRef.current) {
      clearTimeout(openingTimeoutRef.current);
    }
    openingTimeoutRef.current = setTimeout(() => {
      onOpeningChange(cleaned);
    }, 300);
  }, [onOpeningChange]);

  const handleClosingChange = useCallback((text: string) => {
    const cleaned = text.replace(/[^0-9.-]/g, '');
    setDisplayClosing(cleaned);

    if (closingTimeoutRef.current) {
      clearTimeout(closingTimeoutRef.current);
    }
    closingTimeoutRef.current = setTimeout(() => {
      onClosingChange(cleaned);
    }, 300);
  }, [onClosingChange]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.icon}>{account.icon}</Text>
        <Text style={styles.name}>{account.name}</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>期初余额</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={displayOpening}
          onChangeText={handleOpeningChange}
          placeholderTextColor={theme.colors.textTertiary}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>期末余额</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={displayClosing}
          onChangeText={handleClosingChange}
          placeholderTextColor={theme.colors.textTertiary}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  icon: {
    fontSize: theme.fontSize.xl,
    marginRight: theme.spacing.sm,
  },
  name: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    backgroundColor: theme.colors.surfaceDark,
  },
});