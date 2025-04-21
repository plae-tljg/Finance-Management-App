import React, { useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import { Text } from '@/components/base/Text';
import type { Transaction } from '@/services/database/schemas/Transaction';
import { router } from 'expo-router';
import { useTransactionService } from '@/services/business/TransactionService';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';
import { useCategoryService } from '@/services/business/CategoryService';
import { formatCurrency } from '@/utils/format';

interface TransactionItemProps {
  transaction: Transaction;
  onDelete: () => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, onDelete }) => {
  const { databaseService } = useDatabaseSetup();
  const transactionService = useTransactionService(databaseService);
  const categoryService = useCategoryService(databaseService);
  const [categoryName, setCategoryName] = useState<string>('未分类');

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

  const handlePress = () => {
    router.push({
      pathname: '/transaction/[id]',
      params: { id: transaction.id }
    });
  };

  const handleDelete = async () => {
    Alert.alert(
      '删除交易',
      '确定要删除这笔交易吗？',
      [
        {
          text: '取消',
          style: 'cancel'
        },
        {
          text: '确定',
          onPress: async () => {
            try {
              if (!transactionService) {
                throw new Error('交易服务未初始化');
              }
              const success = await transactionService.deleteTransaction(transaction.id);
              if (success) {
                // Handle successful deletion
              } else {
                throw new Error('删除交易失败');
              }
            } catch (error) {
              console.error('删除交易失败:', error);
              Alert.alert('错误', '删除交易失败，请重试');
            }
          }
        }
      ]
    );
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.info}>
          <Text style={styles.description}>{transaction.description}</Text>
          <Text style={styles.category}>{categoryName}</Text>
          <Text style={styles.date}>{new Date(transaction.date).toLocaleDateString()}</Text>
        </View>
        <View style={styles.amountContainer}>
          <Text style={[
            styles.amount,
            transaction.type === 'expense' ? styles.expense : styles.income
          ]}>
            {transaction.type === 'expense' ? '-' : '+'}
            {formatCurrency(transaction.amount)}
          </Text>
        </View>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={handlePress}
        >
          <Text style={styles.actionButtonText}>编辑</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDelete}
        >
          <Text style={styles.actionButtonText}>删除</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  description: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  category: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  amountContainer: {
    marginLeft: 16,
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
  },
  expense: {
    color: '#FF3B30',
  },
  income: {
    color: '#34C759',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 8,
  },
  actionButton: {
    padding: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: '#007AFF',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});