import React, { useEffect, useState, useCallback, memo } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import { Text } from '@/components/base/Text';
import type { BudgetWithCategory } from '@/services/database/repositories/BudgetRepository';
import { router } from 'expo-router';
import { useBudgetService } from '@/services/business/BudgetService';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';
import { useCategoryService } from '@/services/business/CategoryService';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '@/utils/format';
import theme from '@/theme';

interface BudgetItemProps {
  budget: BudgetWithCategory;
  onDelete: () => void;
  onEdit: () => void;
}

const PERIOD_TEXTS: Record<string, string> = {
  daily: '日',
  weekly: '周',
  monthly: '月',
  yearly: '年',
};

export const BudgetItem: React.FC<BudgetItemProps> = memo(({ budget, onDelete, onEdit }) => {
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

  const handlePress = useCallback(() => {
    router.push({
      pathname: '/budget/[id]',
      params: { id: budget.id }
    });
  }, [budget.id]);

  const handleDelete = useCallback(async () => {
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
  }, [budgetService, budget.id, onDelete]);

  const handleEdit = useCallback(() => {
    onEdit();
  }, [onEdit]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.info}>
          <Text style={styles.name}>{budget.name}</Text>
          {budget.description && (
            <Text style={styles.description} numberOfLines={1}>{budget.description}</Text>
          )}
          <View style={styles.details}>
            <Text style={styles.category}>{categoryName}</Text>
            <Text style={styles.period}>{PERIOD_TEXTS[budget.period] || budget.period}</Text>
          </View>
          <Text style={styles.amount}>{formatCurrency(budget.amount)}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={handleEdit} style={styles.actionButton}>
            <Ionicons name="pencil" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
            <Ionicons name="trash" size={24} color={theme.colors.danger} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

BudgetItem.displayName = 'BudgetItem';

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
    ...theme.shadows.sm,
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
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: 2,
  },
  description: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  category: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginRight: theme.spacing.sm,
  },
  period: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  amount: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: theme.spacing.sm,
    marginLeft: theme.spacing.xs,
  },
});