import React, { useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import { Text } from '@/components/base/Text';
import type { BudgetWithCategory } from '@/services/database/repositories/BudgetRepository';
import { router } from 'expo-router';
import { useBudgetService } from '@/services/business/BudgetService';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';
import { useCategoryService } from '@/services/business/CategoryService';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '@/utils/format';

interface BudgetItemProps {
  budget: BudgetWithCategory;
  onDelete: () => void;
  onEdit: () => void;
}

export const BudgetItem: React.FC<BudgetItemProps> = ({ budget, onDelete, onEdit }) => {
  const { databaseService } = useDatabaseSetup();
  const budgetService = useBudgetService(databaseService);
  const categoryService = useCategoryService(databaseService);
  const [categoryName, setCategoryName] = useState<string>('未分类');

  useEffect(() => {
    const loadCategoryName = async () => {
      if (budget.categoryId && categoryService) {
        try {
          const category = await categoryService.getCategoryById(budget.categoryId);
          if (category) {
            setCategoryName(category.name);
          }
        } catch (error) {
          console.error('加载类别名称失败:', error);
        }
      }
    };

    loadCategoryName();
  }, [budget.categoryId, categoryService]);

  const handlePress = () => {
    router.push({
      pathname: '/budget/[id]',
      params: { id: budget.id }
    });
  };

  const handleDelete = async () => {
    Alert.alert(
      '删除预算',
      '确定要删除这个预算吗？',
      [
        {
          text: '取消',
          style: 'cancel'
        },
        {
          text: '确定',
          onPress: async () => {
            try {
              if (!budgetService) {
                throw new Error('预算服务未初始化');
              }
              const success = await budgetService.deleteBudget(budget.id);
              if (success) {
                onDelete();
              } else {
                throw new Error('删除预算失败');
              }
            } catch (error) {
              console.error('删除预算失败:', error);
              Alert.alert('错误', '删除预算失败，请重试');
            }
          }
        }
      ]
    );
  };

  const getPeriodText = (period: string) => {
    switch (period) {
      case 'daily':
        return '日';
      case 'weekly':
        return '周';
      case 'monthly':
        return '月';
      case 'yearly':
        return '年';
      default:
        return period;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.info}>
          <Text style={styles.name}>{budget.name}</Text>
          <View style={styles.details}>
            <Text style={styles.category}>{categoryName}</Text>
            <Text style={styles.period}>{getPeriodText(budget.period)}</Text>
          </View>
          <Text style={styles.amount}>{formatCurrency(budget.amount)}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={onEdit} style={styles.actionButton}>
            <Ionicons name="pencil" size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
            <Ionicons name="trash" size={24} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  category: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  period: {
    fontSize: 14,
    color: '#666',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
}); 