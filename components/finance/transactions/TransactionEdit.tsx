import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Text } from '@/components/base/Text';
import { CategorySelector } from '@/components/finance/categories/CategorySelector';
import { BudgetSelector } from '@/components/finance/budgets/BudgetSelector';
import { useTransactionService } from '@/services/business/TransactionService';
import { useBudgetService } from '@/services/business/BudgetService';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';
import { useCategoryService } from '@/services/business/CategoryService';
import type { Transaction } from '@/services/database/schemas/Transaction';
import { formatCurrency } from '@/utils/format';
import type { BudgetWithCategory } from '@/services/database/repositories/BudgetRepository';

interface TransactionEditProps {
  transaction: Transaction;
  onSave: () => void;
}

export function TransactionEdit({ transaction, onSave }: TransactionEditProps) {
  const { databaseService } = useDatabaseSetup();
  const transactionService = useTransactionService(databaseService);
  const budgetService = useBudgetService(databaseService);
  const categoryService = useCategoryService(databaseService);

  const [name, setName] = useState(transaction.name);
  const [description, setDescription] = useState(transaction.description || '');
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [selectedCategory, setSelectedCategory] = useState<number | null>(transaction.categoryId);
  const [selectedBudget, setSelectedBudget] = useState<number | null>(transaction.budgetId || null);
  const [type, setType] = useState<'income' | 'expense'>(transaction.type);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionDate] = useState(() => new Date(transaction.date));

  const handleCategoryChange = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
    setSelectedBudget(null);
  };

  const handleSave = async () => {
    if (!transactionService) {
      Alert.alert('错误', '交易服务未初始化');
      return;
    }

    if (!name.trim()) {
      Alert.alert('错误', '请输入交易名称');
      return;
    }

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert('错误', '请输入有效金额');
      return;
    }

    if (!selectedCategory) {
      Alert.alert('错误', '请选择类别');
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedTransaction = {
        ...transaction,
        name: name.trim(),
        description: description.trim() || null,
        amount: parseFloat(amount),
        categoryId: selectedCategory,
        budgetId: selectedBudget || 0,
        type,
      };

      const success = await transactionService.updateTransaction(updatedTransaction.id, updatedTransaction);
      if (success) {
        onSave();
      } else {
        throw new Error('更新交易失败');
      }
    } catch (error) {
      console.error('更新交易失败:', error);
      Alert.alert('错误', '更新交易失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>名称</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="输入交易名称"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>描述</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          value={description}
          onChangeText={setDescription}
          placeholder="输入交易描述（可选）"
          multiline
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>金额</Text>
        <View style={styles.amountContainer}>
          <Text style={styles.currency}>¥</Text>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="0.00"
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>类别</Text>
        <CategorySelector
          selectedId={selectedCategory || undefined}
          onSelect={(category) => handleCategoryChange(category?.id || null)}
        />
      </View>

      {selectedCategory && (
        <View style={styles.card}>
          <Text style={styles.label}>预算</Text>
          <BudgetSelector
            categoryId={selectedCategory}
            onSelect={(budget) => setSelectedBudget(budget?.id || null)}
            selectedId={selectedBudget || undefined}
            date={transactionDate}
          />
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.label}>类型</Text>
        <View style={styles.typeContainer}>
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
            ]}>
              收入
            </Text>
          </TouchableOpacity>
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
            ]}>
              支出
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, isSubmitting && styles.disabledButton]}
        onPress={handleSave}
        disabled={isSubmitting}
      >
        <Text style={styles.saveButtonText}>
          {isSubmitting ? '保存中...' : '保存'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000',
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#000',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 8,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currency: {
    fontSize: 18,
    marginRight: 8,
    color: '#000',
  },
  amountInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#000',
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  activeTypeButton: {
    backgroundColor: '#007AFF',
  },
  typeButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '500',
  },
  activeTypeButtonText: {
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  disabledButton: {
    backgroundColor: '#999',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 