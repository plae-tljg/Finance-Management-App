import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Platform, Alert, ScrollView } from 'react-native';
import { Text } from '@/components/base/Text';
import { CategorySelector } from '@/components/finance/categories/CategorySelector';
import { useTransactionService } from '@/services/business/TransactionService';
import { useBudgetService } from '@/services/business/BudgetService';
import { useAccountService } from '@/services/business/AccountService';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';
import type { BudgetWithCategory } from '@/services/database/schemas/Budget';
import { BudgetSelector } from '@/components/finance/budgets/BudgetSelector';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import type { Account } from '@/services/database/schemas/Account';
import theme from '@/theme';

interface TransactionFormProps {
  onSubmit: () => void;
}

export function TransactionForm({ onSubmit }: TransactionFormProps) {
  const { isReady, databaseService } = useDatabaseSetup();
  const transactionService = useTransactionService(databaseService);
  const budgetService = useBudgetService(databaseService);
  const accountService = useAccountService(databaseService);

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<number | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [budgets, setBudgets] = useState<BudgetWithCategory[]>([]);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [accountList, setAccountList] = useState<Account[]>([]);

  useEffect(() => {
    const loadAccountsData = async () => {
      if (accountService && isReady) {
        const data = await accountService.getAccounts();
        setAccountList(data);
        if (data.length > 0 && !selectedAccount) {
          setSelectedAccount(data[0].id);
        }
      }
    };
    loadAccountsData();
  }, [isReady, accountService]);

  useEffect(() => {
    if (!budgetService || !isReady) return;

    const loadBudgets = async () => {
      try {
        const data = await budgetService.getBudgetsWithCategory();
        setBudgets(data);
        if (data.length > 0) {
          setSelectedBudget(data[0].id);
        }
      } catch (error) {
        console.error('加载预算失败:', error);
        Alert.alert('错误', '加载预算失败，请重试');
      }
    };

    loadBudgets();
  }, [budgetService, isReady]);

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate);
      setSelectedBudget(null);
    }
  };

  const handleSubmit = async () => {
    if (!transactionService || !isReady) {
      console.error('交易服务未初始化');
      return;
    }

    if (!selectedCategory) {
      alert('请选择类别');
      return;
    }

    if (!name.trim()) {
      alert('请输入交易名称');
      return;
    }

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      alert('请输入有效金额');
      return;
    }

    if (!selectedBudget) {
      alert('请选择预算');
      return;
    }

    if (!selectedAccount) {
      alert('请选择账户');
      return;
    }

    try {
      const newTransaction = await transactionService.createTransaction({
        name: name.trim(),
        amount: parseFloat(amount),
        categoryId: selectedCategory,
        budgetId: selectedBudget,
        accountId: selectedAccount,
        description: description.trim() || null,
        date: date.toISOString(),
        type
      });

      if (!newTransaction) {
        throw new Error('创建交易失败');
      }

      if (accountService) {
        const adjustment = type === 'income' ? parseFloat(amount) : -parseFloat(amount);
        await accountService.adjustAccountBalance(selectedAccount, adjustment);
      }

      setName('');
      setAmount('');
      setDescription('');
      setSelectedCategory(null);
      setSelectedBudget(null);
      setDate(new Date());
      onSubmit();
    } catch (error) {
      console.error('创建交易失败:', error);
      alert('创建交易失败，请重试');
    }
  };

  return (
    <ScrollView style={styles.content}>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>类型</Text>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'expense' && styles.activeTypeButton
              ]}
              onPress={() => setType('expense')}
            >
              <Text style={[
                styles.typeButtonText,
                type === 'expense' && styles.activeTypeButtonText
              ]}>支出</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'income' && styles.activeTypeButton
              ]}
              onPress={() => setType('income')}
            >
              <Text style={[
                styles.typeButtonText,
                type === 'income' && styles.activeTypeButtonText
              ]}>收入</Text>
            </TouchableOpacity>
          </View>
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
              placeholderTextColor={theme.colors.textTertiary}
              value={amount}
              onChangeText={setAmount}
            />
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>账户</Text>
        <View style={styles.accountSelector}>
          {accountList.map((account) => (
            <TouchableOpacity
              key={account.id}
              style={[
                styles.accountButton,
                selectedAccount === account.id && styles.activeAccountButton,
                { borderColor: selectedAccount === account.id ? account.color : theme.colors.border }
              ]}
              onPress={() => setSelectedAccount(account.id)}
            >
              <Text style={styles.accountIcon}>{account.icon}</Text>
              <Text style={[
                styles.accountName,
                selectedAccount === account.id && { color: account.color }
              ]}>{account.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>日期</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateText}>
              {date.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        </View>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
          />
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>类别</Text>
        <CategorySelector
          onSelect={(category) => {
            setSelectedCategory(category?.id || null);
            setSelectedBudget(null);
          }}
          selectedId={selectedCategory || undefined}
        />
      </View>

      {selectedCategory && (
        <View style={styles.card}>
          <Text style={styles.label}>预算</Text>
          <BudgetSelector
            categoryId={selectedCategory}
            onSelect={(budget) => setSelectedBudget(budget?.id || null)}
            selectedId={selectedBudget || undefined}
            date={date}
          />
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.label}>名称</Text>
        <TextInput
          style={styles.input}
          placeholder="输入交易名称"
          placeholderTextColor={theme.colors.textTertiary}
          value={name}
          onChangeText={setName}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>描述</Text>
        <TextInput
          style={[styles.input, styles.descriptionInput]}
          placeholder="添加描述（可选）"
          placeholderTextColor={theme.colors.textTertiary}
          value={description}
          onChangeText={setDescription}
          multiline
        />
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleSubmit}
      >
        <Text style={styles.buttonText}>保存</Text>
      </TouchableOpacity>
    </ScrollView>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceDark,
    borderRadius: theme.borderRadius.sm,
    padding: 3,
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  typeButton: {
    flex: 1,
    padding: theme.spacing.sm,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm - 2,
  },
  activeTypeButton: {
    backgroundColor: theme.colors.primary,
  },
  typeButtonText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  activeTypeButtonText: {
    color: theme.colors.white,
    fontWeight: theme.fontWeight.medium,
  },
  currency: {
    fontSize: theme.fontSize.lg,
    marginRight: theme.spacing.xs,
    color: theme.colors.text,
  },
  amountInput: {
    flex: 1,
    fontSize: theme.fontSize.lg,
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
  dateButton: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  dateText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  descriptionInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xxl,
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
  },
  accountSelector: {
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