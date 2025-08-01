import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Platform, Alert } from 'react-native';
import { Text } from '@/components/base/Text';
import { CategorySelector } from '@/components/finance/categories/CategorySelector';
import { useTransactionService } from '@/services/business/TransactionService';
import { useBudgetService } from '@/services/business/BudgetService';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';
import type { BudgetWithCategory } from '@/services/database/schemas/Budget';
import { BudgetSelector } from '@/components/finance/budgets/BudgetSelector';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

interface TransactionFormProps {
  onSubmit: () => void;
}

export function TransactionForm({ onSubmit }: TransactionFormProps) {
  const { isReady, databaseService } = useDatabaseSetup();
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [budgets, setBudgets] = useState<BudgetWithCategory[]>([]);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const transactionService = React.useMemo(
    () => isReady && databaseService ? useTransactionService(databaseService) : null,
    [isReady, databaseService]
  );

  const budgetService = React.useMemo(
    () => isReady && databaseService ? useBudgetService(databaseService) : null,
    [isReady, databaseService]
  );

  useEffect(() => {
    if (!budgetService) return;
    
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
  }, [budgetService]);

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate);
      // 当日期改变时，清除已选择的预算，因为预算可能与新日期不匹配
      setSelectedBudget(null);
    }
  };

  const handleSubmit = async () => {
    if (!transactionService) {
      console.error('交易服务未初始化');
      return;
    }

    if (!selectedCategory) {
      alert('请选择类别');
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
    
    try {
      const newTransaction = await transactionService.createTransaction({
        amount: parseFloat(amount),
        categoryId: selectedCategory,
        budgetId: selectedBudget,
        description: description.trim(),
        date: date.toISOString(),
        type
      });

      if (!newTransaction) {
        throw new Error('创建交易失败');
      }

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
    <View style={styles.content}>
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
              placeholderTextColor="#999"
              value={amount}
              onChangeText={setAmount}
            />
          </View>
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
        <Text style={styles.label}>描述</Text>
        <TextInput
          style={[styles.input, styles.descriptionInput]}
          placeholder="添加描述（可选）"
          placeholderTextColor="#999"
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
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    color: '#333',
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    padding: 3,
    flex: 1,
    marginLeft: 12,
  },
  typeButton: {
    flex: 1,
    padding: 6,
    alignItems: 'center',
    borderRadius: 4,
  },
  activeTypeButton: {
    backgroundColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#666',
  },
  activeTypeButtonText: {
    color: '#fff',
  },
  currency: {
    fontSize: 16,
    marginRight: 6,
    color: '#333',
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    paddingHorizontal: 10,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    padding: 10,
    flex: 1,
    marginLeft: 12,
  },
  dateText: {
    fontSize: 14,
    color: '#333',
  },
  descriptionInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 6,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
}); 