import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity } from 'react-native';
import { Text } from '@/components/base/Text';
import { CategorySelector } from '@/components/finance/categories/CategorySelector';
import { useBudgetService } from '@/services/business/BudgetService';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';
import theme from '@/theme';

interface BudgetFormProps {
  onSubmit: () => void;
}

export function BudgetForm({ onSubmit }: BudgetFormProps) {
  const { isReady, databaseService } = useDatabaseSetup();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const budgetService = useBudgetService(databaseService);

  const handleSubmit = async () => {
    if (!isReady || !databaseService) {
      console.error('数据库未就绪');
      alert('数据库未就绪，请稍后再试');
      return;
    }

    if (!name.trim()) {
      alert('请输入预算名称');
      return;
    }

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      alert('请输入有效金额');
      return;
    }

    if (!selectedCategory) {
      alert('请选择类别');
      return;
    }

    if (isSubmitting) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const newBudget = await budgetService.createBudget({
        name: name.trim(),
        description: description.trim() || null,
        categoryId: selectedCategory,
        amount: parseFloat(amount),
        period,
        startDate: new Date().toISOString(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
        month: new Date().toISOString().substring(0, 7),
        isRegular: false,
        isBudgetExceeded: false,
        accountId: null
      });

      if (!newBudget) {
        throw new Error('创建预算失败');
      }

      setName('');
      setDescription('');
      setAmount('');
      setSelectedCategory(null);
      onSubmit();
    } catch (error) {
      console.error('创建预算失败:', error);
      alert('创建预算失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <Text>数据库正在初始化中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.content}>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>预算名称</Text>
          <TextInput
            style={[styles.input, styles.nameInput]}
            placeholder="输入预算名称"
            placeholderTextColor="#666"
            value={name}
            onChangeText={setName}
          />
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>金额</Text>
          <View style={styles.amountContainer}>
            <Text style={styles.currency}>¥</Text>
            <TextInput
              style={[styles.input, styles.amountInput]}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor="#666"
              value={amount}
              onChangeText={setAmount}
            />
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>类别</Text>
        <CategorySelector 
          onSelect={(category) => setSelectedCategory(category?.id || null)}
          selectedId={selectedCategory || undefined}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>周期</Text>
        <View style={styles.grid}>
          {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              style={[
                styles.periodButton,
                period === p && styles.activePeriodButton
              ]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[
                styles.periodButtonText,
                period === p && styles.activePeriodButtonText
              ]}>
                {p === 'daily' ? '日' : 
                 p === 'weekly' ? '周' : 
                 p === 'monthly' ? '月' : '年'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>描述</Text>
          <TextInput
            style={[styles.input, styles.nameInput]}
            placeholder="输入描述（可选）"
            placeholderTextColor="#666"
            value={description}
            onChangeText={setDescription}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, isSubmitting && styles.disabledButton]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        <Text style={styles.buttonText}>
          {isSubmitting ? '保存中...' : '保存'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    backgroundColor: theme.colors.surfaceDark,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currency: {
    fontSize: theme.fontSize.lg,
    marginRight: theme.spacing.xs,
    color: theme.colors.text,
  },
  amountInput: {
    flex: 1,
    borderWidth: 0,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
  nameInput: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  periodButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surfaceDark,
    minWidth: 50,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activePeriodButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  periodButtonText: {
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
  },
  activePeriodButtonText: {
    color: theme.colors.white,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  disabledButton: {
    backgroundColor: theme.colors.textTertiary,
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
});