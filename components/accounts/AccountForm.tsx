import React, { memo, useCallback } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Text } from 'react-native';
import { useAccountForm } from '@/hooks/useAccountForm';
import type { Account } from '@/services/database/schemas/Account';
import theme from '@/theme';

interface AccountFormProps {
  account?: Account | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const ACCOUNT_TYPES: { type: Account['type']; label: string }[] = [
  { type: 'cash', label: '现金' },
  { type: 'bank', label: '银行' },
  { type: 'digital_wallet', label: '数字钱包' },
  { type: 'savings', label: '储蓄' },
  { type: 'other', label: '其他' },
];

export const AccountForm = memo(function AccountForm({ account, onSuccess, onCancel }: AccountFormProps) {
  const {
    name,
    type,
    icon,
    isLoading,
    setName,
    setType,
    setIcon,
    submit,
  } = useAccountForm({ account, onSuccess });

  const handleSubmit = useCallback(async () => {
    const success = await submit();
    if (success) {
      onSuccess();
    }
  }, [submit, onSuccess]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{account ? '编辑账户' : '新增账户'}</Text>

      <Text style={styles.inputLabel}>账户名称</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="账户名称"
        placeholderTextColor={theme.colors.textTertiary}
      />

      <Text style={styles.inputLabel}>图标</Text>
      <TextInput
        style={styles.input}
        value={icon}
        onChangeText={setIcon}
        placeholder="💵"
        placeholderTextColor={theme.colors.textTertiary}
      />

      <Text style={styles.inputLabel}>账户类型</Text>
      <View style={styles.typeSelector}>
        {ACCOUNT_TYPES.map((t) => (
          <TouchableOpacity
            key={t.type}
            style={[styles.typeButton, type === t.type && styles.typeButtonActive]}
            onPress={() => setType(t.type)}
          >
            <Text style={[styles.typeButtonText, type === t.type && styles.typeButtonTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
        >
          <Text style={styles.buttonText}>取消</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? '保存中...' : '保存'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    width: '80%',
    maxWidth: 400,
  },
  title: {
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
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  typeButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surfaceDark,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  typeButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  typeButtonText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  typeButtonTextActive: {
    color: theme.colors.white,
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