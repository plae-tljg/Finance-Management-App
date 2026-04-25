import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFinance } from '@/contexts/FinanceContext';
import { BackgroundImage } from '@/components/base/BackgroundImage';
import { Card } from '@/components/base/Card';
import { HeaderCard } from '@/components/base/HeaderCard';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/theme';
import type { Account } from '@/services/database/schemas/Account';

export default function AccountsPage() {
  const router = useRouter();
  const { accounts, isLoadingAccounts, loadAccounts } = useFinance();
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    type: 'cash' as Account['type'],
    icon: '',
    color: '#34C759',
    balance: 0,
    isActive: true,
    sortOrder: 0
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleEdit = (account: Account) => {
    setSelectedAccount(account);
    setEditForm({
      name: account.name,
      type: account.type,
      icon: account.icon,
      color: account.color,
      balance: account.balance,
      isActive: account.isActive,
      sortOrder: account.sortOrder
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    console.log('Save account:', editForm);
    setModalVisible(false);
  };

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

  const renderAccountItem = ({ item }: { item: Account }) => (
    <Card style={styles.accountItem}>
      <View style={styles.accountIcon}>
        <Text style={styles.iconText}>{item.icon}</Text>
      </View>
      <View style={styles.accountInfo}>
        <Text style={styles.accountName}>{item.name}</Text>
        <Text style={styles.accountType}>{getTypeLabel(item.type)}</Text>
      </View>
      <View style={styles.accountBalance}>
        <Text style={styles.balanceText}>¥{item.balance.toFixed(2)}</Text>
        <TouchableOpacity onPress={() => handleEdit(item)}>
          <Ionicons name="pencil" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </Card>
  );

  if (isLoadingAccounts) {
    return (
      <BackgroundImage>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </BackgroundImage>
    );
  }

  return (
    <BackgroundImage>
      <SafeAreaView style={styles.container} edges={['top']}>
        <HeaderCard title="账户管理" />
        <View style={styles.addButtonContainer}>
          <TouchableOpacity onPress={() => {
            setSelectedAccount(null);
            setEditForm({
              name: '',
              type: 'cash',
              icon: '💵',
              color: '#34C759',
              balance: 0,
              isActive: true,
              sortOrder: 0
            });
            setModalVisible(true);
          }} style={styles.addButton}>
            <Ionicons name="add-circle" size={28} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
        <FlatList
          data={accounts}
          renderItem={renderAccountItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
        />
      </SafeAreaView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedAccount ? '编辑账户' : '新增账户'}</Text>

            <Text style={styles.inputLabel}>账户名称</Text>
            <TextInput
              style={styles.input}
              value={editForm.name}
              onChangeText={(text) => setEditForm({...editForm, name: text})}
              placeholder="账户名称"
              placeholderTextColor={theme.colors.textTertiary}
            />

            <Text style={styles.inputLabel}>图标</Text>
            <TextInput
              style={styles.input}
              value={editForm.icon}
              onChangeText={(text) => setEditForm({...editForm, icon: text})}
              placeholder="图标"
              placeholderTextColor={theme.colors.textTertiary}
            />

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>取消</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSubmit}
              >
                <Text style={styles.buttonText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </BackgroundImage>
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
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
    color: theme.colors.text,
  },
  inputLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    backgroundColor: theme.colors.surfaceDark,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.lg,
  },
  button: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  cancelButton: {
    backgroundColor: theme.colors.backgroundLight,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
  },
  buttonText: {
    color: theme.colors.white,
    textAlign: 'center',
    fontWeight: theme.fontWeight.medium,
  },
});