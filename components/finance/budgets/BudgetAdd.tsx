import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity } from 'react-native';
import { Text } from '@/components/base/Text';
import { CategorySelector } from '@/components/finance/categories/CategorySelector';
import { useBudgetService } from '@/services/business/BudgetService';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';

interface BudgetFormProps {
  onSubmit: () => void;
}

export function BudgetForm({ onSubmit }: BudgetFormProps) {
  const { isReady, databaseService } = useDatabaseSetup();
  const [name, setName] = useState('');
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
        categoryId: selectedCategory,
        amount: parseFloat(amount),
        period,
        startDate: new Date().toISOString(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
        month: new Date().toISOString().substring(0, 7),
        isRegular: false,
        isBudgetExceeded: false
      });

      if (!newBudget) {
        throw new Error('创建预算失败');
      }

      setName('');
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
        <Text style={styles.label}>预算名称</Text>
        <TextInput
          style={styles.input}
          placeholder="输入预算名称"
          placeholderTextColor="#666"
          value={name}
          onChangeText={setName}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>金额</Text>
        <View style={styles.row}>
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
  row: {
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
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  periodButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    minWidth: 60,
    alignItems: 'center',
  },
  activePeriodButton: {
    backgroundColor: '#007AFF',
  },
  periodButtonText: {
    color: '#000',
  },
  activePeriodButtonText: {
    color: '#fff',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  disabledButton: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
});