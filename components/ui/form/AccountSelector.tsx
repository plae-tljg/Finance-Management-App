import React, { memo, useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text } from '@/components/base/Text';
import { useAccountService } from '@/services/business/AccountService';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';
import { LoadingView } from '@/components/base/LoadingView';
import type { Account } from '@/services/database/schemas/Account';
import theme from '@/theme';

interface AccountSelectorProps {
  selectedId: number | null;
  onSelect: (id: number | null) => void;
}

export const AccountSelector = memo(function AccountSelector({ selectedId, onSelect }: AccountSelectorProps) {
  const { isReady, databaseService } = useDatabaseSetup();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAccounts = async () => {
      if (!databaseService || !isReady) return;
      const accountService = useAccountService(databaseService);
      const data = await accountService.getAccounts();
      setAccounts(data);
      setIsLoading(false);
    };
    loadAccounts();
  }, [databaseService, isReady]);

  const handleSelect = useCallback((id: number) => {
    onSelect(selectedId === id ? null : id);
  }, [selectedId, onSelect]);

  if (isLoading) {
    return <LoadingView message="加载账户..." />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>账户</Text>
      <View style={styles.selector}>
        {accounts.map((account) => (
          <TouchableOpacity
            key={account.id}
            style={[
              styles.accountButton,
              selectedId === account.id && styles.activeAccountButton,
              { borderColor: selectedId === account.id ? account.color : theme.colors.border }
            ]}
            onPress={() => handleSelect(account.id)}
          >
            <Text style={styles.accountIcon}>{account.icon}</Text>
            <Text style={[
              styles.accountName,
              selectedId === account.id && { color: account.color }
            ]}>
              {account.name}
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
  selector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  accountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surfaceDark,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  activeAccountButton: {
    backgroundColor: theme.colors.surface,
  },
  accountIcon: {
    fontSize: 18,
    marginRight: theme.spacing.xs,
  },
  accountName: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
  },
});