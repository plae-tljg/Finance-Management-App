import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { BudgetPeriod } from '../../../domain/enums/enum';
import { Category } from '../../../domain/entities/Category';
import { CategorySelector } from '../../components/CategorySelector';
import { useCategoryService } from '../../contexts/ServiceContext';

export const AddBudgetScreen: React.FC = () => {
  const categoryService = useCategoryService();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [period, setPeriod] = useState<BudgetPeriod>(BudgetPeriod.MONTHLY);
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  // 加载分类数据
  useEffect(() => {
    const loadCategories = async () => {
      try {
        console.log('开始加载分类数据...');
        const loadedCategories = await categoryService.findAll();
        console.log('加载到的分类数据:', loadedCategories);
        setCategories(loadedCategories);
      } catch (error) {
        console.error('加载分类数据失败:', error);
        Alert.alert('错误', '加载分类数据失败');
      }
    };

    loadCategories();
  }, [categoryService]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      console.log('开始提交预算数据...');
      console.log('表单数据:', {
        name,
        amount: parseFloat(amount),
        categoryId,
        period,
        description,
      });

      // 验证必填字段
      if (!name || !amount || !categoryId) {
        Alert.alert('错误', '请填写所有必填字段');
        return;
      }

      // TODO: 调用 BudgetService 创建预算
      // const budget = await budgetService.createBudget({
      //   name,
      //   amount: parseFloat(amount),
      //   categoryId,
      //   period,
      //   description,
      //   startDate: new Date(),
      //   endDate: calculateEndDate(period),
      // });

      console.log('预算创建成功');
      Alert.alert('成功', '预算创建成功');
      
      // 重置表单
      setName('');
      setAmount('');
      setCategoryId('');
      setPeriod(BudgetPeriod.MONTHLY);
      setDescription('');
    } catch (error) {
      console.error('创建预算失败:', error);
      Alert.alert('错误', '创建预算失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>添加预算</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>预算名称 *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="请输入预算名称"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>预算金额 *</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          placeholder="请输入预算金额"
          keyboardType="numeric"
        />
      </View>

      <CategorySelector
        categories={categories}
        selectedCategoryId={categoryId}
        onCategoryChange={setCategoryId}
        transactionType="expense"
        label="预算分类 *"
      />

      <View style={styles.formGroup}>
        <Text style={styles.label}>预算周期 *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={period}
            onValueChange={(value) => setPeriod(value)}
            style={styles.picker}
          >
            <Picker.Item label="每日" value={BudgetPeriod.DAILY} />
            <Picker.Item label="每周" value={BudgetPeriod.WEEKLY} />
            <Picker.Item label="每月" value={BudgetPeriod.MONTHLY} />
            <Picker.Item label="每年" value={BudgetPeriod.YEARLY} />
          </Picker>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>描述</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="请输入预算描述"
          multiline
          numberOfLines={4}
        />
      </View>

      <TouchableOpacity 
        style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.submitButtonText}>
          {loading ? '创建中...' : '创建预算'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F5FCFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  submitButton: {
    backgroundColor: '#f4511e',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
}); 