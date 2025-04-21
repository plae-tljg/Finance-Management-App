import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/base/Text';
import type { Transaction } from '@/services/database/schemas/Transaction';
import { formatCurrency } from '@/utils/format';
import { useCategoryService } from '@/services/business/CategoryService';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';

interface TransactionDetailProps {
  transaction: Transaction;
}

export function TransactionDetail({ transaction }: TransactionDetailProps) {
  const { amount, description, date, type, categoryId, budgetId } = transaction;
  const { databaseService } = useDatabaseSetup();
  const categoryService = useCategoryService(databaseService);
  const [categoryName, setCategoryName] = useState<string>('未分类');

  useEffect(() => {
    const loadCategoryName = async () => {
      if (categoryId && categoryService) {
        try {
          const category = await categoryService.getCategoryById(categoryId);
          if (category) {
            setCategoryName(category.name);
          }
        } catch (error) {
          console.error('加载类别名称失败:', error);
        }
      }
    };

    loadCategoryName();
  }, [categoryId, categoryService]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>金额</Text>
        <Text style={[
          styles.amount,
          type === 'income' ? styles.income : styles.expense
        ]}>
          {type === 'income' ? '+' : '-'}{formatCurrency(amount)}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>描述</Text>
        <Text style={styles.value}>{description || '无描述'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>日期</Text>
        <Text style={styles.value}>{new Date(date).toLocaleDateString()}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>类别</Text>
        <Text style={styles.value}>{categoryName}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>预算</Text>
        <Text style={styles.value}>{budgetId || '未分配预算'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
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
    elevation: 2,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  value: {
    fontSize: 16,
    color: '#000',
  },
  amount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  income: {
    color: '#4CAF50',
  },
  expense: {
    color: '#F44336',
  },
});