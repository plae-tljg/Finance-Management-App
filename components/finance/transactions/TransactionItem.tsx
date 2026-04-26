import React, { useEffect, useState, useCallback, memo } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import { Text } from '@/components/base/Text';
import type { Transaction } from '@/services/database/schemas/Transaction';
import { router } from 'expo-router';
import { useTransactionService } from '@/services/business/TransactionService';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';
import { useCategoryService } from '@/services/business/CategoryService';
import theme from '@/theme';

interface TransactionItemProps {
  transaction: Transaction & {
    categoryName?: string;
    categoryIcon?: string;
    accountName?: string;
    accountIcon?: string;
  };
  onDelete?: () => void;
  showActions?: boolean;
}

export const TransactionItem: React.FC<TransactionItemProps> = memo(({
  transaction,
  onDelete,
  showActions = true
}) => {
  const { databaseService } = useDatabaseSetup();
  const transactionService = useTransactionService(databaseService);
  const categoryService = useCategoryService(databaseService);
  const [categoryName, setCategoryName] = useState(transaction.categoryName || '未分类');
  const [categoryIcon, setCategoryIcon] = useState(transaction.categoryIcon || '📦');

  useEffect(() => {
    if (transaction.categoryName) {
      setCategoryName(transaction.categoryName);
      setCategoryIcon(transaction.categoryIcon || '📦');
      return;
    }

    const loadCategoryName = async () => {
      if (transaction.categoryId && categoryService) {
        try {
          const category = await categoryService.getCategoryById(transaction.categoryId);
          if (category) {
            setCategoryName(category.name);
            setCategoryIcon(category.icon);
          }
        } catch (error) {
          console.error('加载类别名称失败:', error);
        }
      }
    };

    loadCategoryName();
  }, [transaction.categoryId, categoryService, transaction.categoryName, transaction.categoryIcon]);

  const handlePress = useCallback(() => {
    router.push({
      pathname: '/transaction/[id]',
      params: { id: transaction.id }
    });
  }, [transaction.id]);

  const handleDelete = useCallback(async () => {
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
                onDelete?.();
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
  }, [transactionService, transaction.id, onDelete]);

  return (
    <TouchableOpacity onPress={handlePress} style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{categoryIcon}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {transaction.name || transaction.description || categoryName}
          </Text>
          {transaction.description && transaction.name && (
            <Text style={styles.description} numberOfLines={1}>
              {transaction.description}
            </Text>
          )}
          <View style={styles.metaRow}>
            <Text style={styles.category}>{categoryName}</Text>
            <Text style={styles.separator}>•</Text>
            <Text style={styles.date}>
              {new Date(transaction.date).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={styles.amountContainer}>
          <Text style={[
            styles.amount,
            transaction.type === 'expense' ? styles.expense : styles.income
          ]}>
            {transaction.type === 'expense' ? '-' : '+'}
            ¥{transaction.amount.toFixed(2)}
          </Text>
          {transaction.accountIcon && (
            <Text style={styles.accountIcon}>{transaction.accountIcon}</Text>
          )}
        </View>
      </View>

      {showActions && (
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
      )}
    </TouchableOpacity>
  );
});

TransactionItem.displayName = 'TransactionItem';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  icon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  category: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  separator: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textTertiary,
    marginHorizontal: theme.spacing.xs,
  },
  date: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textTertiary,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  expense: {
    color: theme.colors.expense,
  },
  income: {
    color: theme.colors.income,
  },
  accountIcon: {
    fontSize: 14,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    marginLeft: theme.spacing.sm,
  },
  actionButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    marginLeft: theme.spacing.xs,
  },
  editButton: {
    backgroundColor: theme.colors.primary,
  },
  deleteButton: {
    backgroundColor: theme.colors.danger,
  },
  actionButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
  },
});