import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Category } from '../../domain/entities/Category';
import { TransactionType } from '../../domain/entities/Transaction';

interface CategorySelectorProps {
  categories: Category[];
  selectedCategoryId: string;
  onCategoryChange: (categoryId: string) => void;
  transactionType: TransactionType;
  label?: string;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  selectedCategoryId,
  onCategoryChange,
  transactionType,
  label = '交易分类 *'
}) => {
  // 根据交易类型过滤分类
  const filteredCategories = categories.filter(category => category.type === transactionType);

  return (
    <View style={styles.formGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedCategoryId}
          onValueChange={onCategoryChange}
          style={styles.picker}
          enabled={filteredCategories.length > 0}
        >
          <Picker.Item label="请选择分类" value="" />
          {filteredCategories.map(category => (
            <Picker.Item 
              key={category.id} 
              label={category.name} 
              value={category.id} 
            />
          ))}
        </Picker>
      </View>
      {filteredCategories.length === 0 && (
        <Text style={styles.errorText}>
          当前没有可用的{transactionType === 'expense' ? '支出' : '收入'}分类
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
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
  errorText: {
    color: '#f4511e',
    fontSize: 14,
    marginTop: 4,
  },
}); 