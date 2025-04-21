import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Text } from '@/components/base/Text';
import { CategorySelector } from '@/components/finance/categories/CategorySelector';
import { useTransactionService } from '@/services/business/TransactionService';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';
import { useCategoryService } from '@/services/business/CategoryService';
import type { Transaction } from '@/services/database/schemas/Transaction';
import { formatCurrency } from '@/utils/format';

interface TransactionEditProps {
  transaction: Transaction;
  onSave: () => void;
}

export function TransactionEdit({ transaction, onSave }: TransactionEditProps) {
  const { databaseService } = useDatabaseSetup();
  const transactionService = useTransactionService(databaseService);
  const categoryService = useCategoryService(databaseService);
  const [categoryName, setCategoryName] = useState<string>('未分类');

  const [description, setDescription] = useState(transaction.description || '');
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [selectedCategory, setSelectedCategory] = useState<number | null>(transaction.categoryId);
  const [type, setType] = useState<'income' | 'expense'>(transaction.type);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadCategoryName = async () => {
      if (transaction.categoryId && categoryService) {
        try {
          const category = await categoryService.getCategoryById(transaction.categoryId);
          if (category) {
            setCategoryName(category.name);
          }
        } catch (error) {
          console.error('加载类别名称失败:', error);
        }
      }
    };

    loadCategoryName();
  }, [transaction.categoryId, categoryService]);

  const handleSave = async () => {
    if (!transactionService) {
      Alert.alert('错误', '交易服务未初始化');
      return;
    }

    if (!description.trim()) {
      Alert.alert('错误', '请输入描述');
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
        description: description.trim(),
        amount: parseFloat(amount),
        categoryId: selectedCategory,
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
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>描述</Text>
        <TextInput
          style={styles.input}
          value={description}
          onChangeText={setDescription}
          placeholder="输入交易描述"
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
        <Text style={styles.label}>当前类别</Text>
        <Text style={styles.value}>{categoryName}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>选择新类别</Text>
        <CategorySelector
          selectedId={selectedCategory || undefined}
          onSelect={(category) => setSelectedCategory(category?.id || null)}
        />
      </View>

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
    </View>
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
  value: {
    fontSize: 16,
    color: '#000',
    marginBottom: 8,
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