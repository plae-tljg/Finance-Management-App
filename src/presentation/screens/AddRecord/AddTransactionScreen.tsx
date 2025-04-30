import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { TransactionType } from '../../../domain/entities/Transaction';
import { Category } from '../../../domain/entities/Category';
import { CategorySelector } from '../../components/CategorySelector';
import { useCategoryService } from '../../contexts/ServiceContext';

export const AddTransactionScreen: React.FC = () => {
  const categoryService = useCategoryService();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [categoryId, setCategoryId] = useState('');
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

  const handleTypeChange = (value: TransactionType) => {
    console.log('交易类型改变:', value);
    setType(value);
    // 当类型改变时，重置分类选择
    setCategoryId('');
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      console.log('开始提交交易数据...');
      console.log('表单数据:', {
        name,
        amount: parseFloat(amount),
        type,
        categoryId,
        description,
      });

      // 验证必填字段
      if (!name || !amount || !categoryId) {
        Alert.alert('错误', '请填写所有必填字段');
        return;
      }

      // TODO: 调用 TransactionService 创建交易
      // const transaction = await transactionService.createTransaction({
      //   name,
      //   amount: parseFloat(amount),
      //   type,
      //   categoryId,
      //   description,
      //   date: new Date(),
      // });

      console.log('交易创建成功');
      Alert.alert('成功', '交易创建成功');
      
      // 重置表单
      setName('');
      setAmount('');
      setType('expense');
      setCategoryId('');
      setDescription('');
    } catch (error) {
      console.error('创建交易失败:', error);
      Alert.alert('错误', '创建交易失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>添加交易</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>交易名称 *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="请输入交易名称"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>交易金额 *</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          placeholder="请输入交易金额"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>交易类型 *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={type}
            onValueChange={handleTypeChange}
            style={styles.picker}
          >
            <Picker.Item label="支出" value="expense" />
            <Picker.Item label="收入" value="income" />
          </Picker>
        </View>
      </View>

      <CategorySelector
        categories={categories}
        selectedCategoryId={categoryId}
        onCategoryChange={setCategoryId}
        transactionType={type}
      />

      <View style={styles.formGroup}>
        <Text style={styles.label}>描述</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="请输入交易描述"
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
          {loading ? '创建中...' : '创建交易'}
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