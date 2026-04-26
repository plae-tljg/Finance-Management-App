import React, { memo, useCallback } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Text } from '@/components/base/Text';
import { useGoalForm } from '@/hooks/useGoalForm';
import type { Goal } from '@/services/database/schemas/Goal';
import theme from '@/theme';

interface GoalFormProps {
  goal?: Goal | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const GoalForm = memo(function GoalForm({ goal, onSuccess, onCancel }: GoalFormProps) {
  const {
    name,
    targetAmount,
    currentAmount,
    icon,
    isLoading,
    setName,
    setTargetAmount,
    setCurrentAmount,
    setIcon,
    submit,
  } = useGoalForm({ goal, onSuccess });

  const handleSubmit = useCallback(async () => {
    const success = await submit();
    if (success) {
      onSuccess();
    }
  }, [submit, onSuccess]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{goal ? '编辑目标' : '新增目标'}</Text>

      <Text style={styles.inputLabel}>目标名称</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="目标名称"
        placeholderTextColor={theme.colors.textTertiary}
      />

      <Text style={styles.inputLabel}>目标金额 (¥)</Text>
      <TextInput
        style={styles.input}
        value={targetAmount}
        onChangeText={setTargetAmount}
        placeholder="0.00"
        placeholderTextColor={theme.colors.textTertiary}
        keyboardType="numeric"
      />

      <Text style={styles.inputLabel}>当前金额 (¥)</Text>
      <TextInput
        style={styles.input}
        value={currentAmount}
        onChangeText={setCurrentAmount}
        placeholder="0.00"
        placeholderTextColor={theme.colors.textTertiary}
        keyboardType="numeric"
      />

      <Text style={styles.inputLabel}>图标</Text>
      <TextInput
        style={styles.input}
        value={icon}
        onChangeText={setIcon}
        placeholder="🎯"
        placeholderTextColor={theme.colors.textTertiary}
      />

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