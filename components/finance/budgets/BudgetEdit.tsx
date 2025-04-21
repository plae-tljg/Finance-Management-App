import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Text } from '@/components/base/Text';
import { CategorySelector } from '@/components/finance/categories/CategorySelector';
import { useBudgetService } from '@/services/business/BudgetService';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';
import type { Budget } from '@/services/database/schemas/Budget';

interface BudgetEditProps {
  budget: Budget;
  onSave: () => void;
}

export function BudgetEdit({ budget, onSave }: BudgetEditProps) {
  const { databaseService } = useDatabaseSetup();
  const budgetService = useBudgetService(databaseService);

  const [name, setName] = useState(budget.name);
  const [amount, setAmount] = useState(budget.amount.toString());
  const [selectedCategory, setSelectedCategory] = useState<number | null>(budget.categoryId);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>(budget.period);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!budgetService) {
      Alert.alert('错误', '预算服务未初始化');
      return;
    }

    if (!name.trim()) {
      Alert.alert('错误', '请输入预算名称');
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
      const updatedBudget = {
        ...budget,
        name: name.trim(),
        amount: parseFloat(amount),
        categoryId: selectedCategory,
        period,
      };

      const success = await budgetService.updateBudget(updatedBudget.id, updatedBudget);
      if (success) {
        onSave();
      } else {
        throw new Error('更新预算失败');
      }
    } catch (error) {
      console.error('更新预算失败:', error);
      Alert.alert('错误', '更新预算失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>预算名称</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="输入预算名称"
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
          onSelect={(category) => setSelectedCategory(category?.id || null)}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>周期</Text>
        <View style={styles.periodContainer}>
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
  periodContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  periodButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  activePeriodButton: {
    backgroundColor: '#007AFF',
  },
  periodButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '500',
  },
  activePeriodButtonText: {
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