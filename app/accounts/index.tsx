import React, { useState, useEffect, memo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal } from 'react-native';
import { useFinance } from '@/contexts/FinanceContext';
import { Card } from '@/components/base/Card';
import { PageTemplate } from '@/components/base/PageTemplate';
import { AccountForm } from '@/components/accounts/AccountForm';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/theme';
import type { Account } from '@/services/database/schemas/Account';

const AccountItem = memo(function AccountItem({ account, onEdit }: { account: Account; onEdit: (a: Account) => void }) {
  const getTypeLabel = (type: Account['type']) => {
    const labels: Record<Account['type'], string> = {
      cash: '现金',
      bank: '银行',
      digital_wallet: '数字钱包',
      savings: '储蓄',
      other: '其他'
    };
    return labels[type] || type;
  };

  return (
    <Card style={styles.accountItem}>
      <View style={styles.accountIcon}>
        <Text style={styles.iconText}>{account.icon}</Text>
      </View>
      <View style={styles.accountInfo}>
        <Text style={styles.accountName}>{account.name}</Text>
        <Text style={styles.accountType}>{getTypeLabel(account.type)}</Text>
      </View>
      <View style={styles.accountBalance}>
        <Text style={styles.balanceText}>¥{account.balance.toFixed(2)}</Text>
        <TouchableOpacity onPress={() => onEdit(account)}>
          <Ionicons name="pencil" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </Card>
  );
});

export default function AccountsPage() {
  const { accounts, isLoadingAccounts, loadAccounts } = useFinance();
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleEdit = useCallback((account: Account) => {
    setSelectedAccount(account);
    setModalVisible(true);
  }, []);

  const handleAdd = useCallback(() => {
    setSelectedAccount(null);
    setModalVisible(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setModalVisible(false);
    setSelectedAccount(null);
  }, []);

  if (isLoadingAccounts) {
    return (
      <PageTemplate title="加载中..." showBack={false}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="账户管理"
      scrollable={false}
      rightAccessory={
        <TouchableOpacity onPress={handleAdd}>
          <Ionicons name="add-circle" size={28} color={theme.colors.primary} />
        </TouchableOpacity>
      }
    >
      <FlatList
        data={accounts}
        renderItem={({ item }) => <AccountItem account={item} onEdit={handleEdit} />}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleModalClose}
      >
        <View style={styles.modalContainer}>
          <AccountForm
            account={selectedAccount}
            onSuccess={handleModalClose}
            onCancel={handleModalClose}
          />
        </View>
      </Modal>
    </PageTemplate>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.md,
  },
  listContainer: {
    padding: theme.spacing.lg,
  },
  addButtonContainer: {
    alignItems: 'flex-end',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  addButton: {
    padding: theme.spacing.xs,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  iconText: {
    fontSize: 20,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  accountType: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  accountBalance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  balanceText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.overlay,
  },
});