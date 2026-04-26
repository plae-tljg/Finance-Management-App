import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text } from '@/components/base/Text';
import { PageTemplate } from '@/components/base/PageTemplate';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';
import { useBudgetDefaultService } from '@/services/business/BudgetDefaultService';
import { useCategoryService } from '@/services/business/CategoryService';
import { BudgetDefaultRow } from '@/components/ui/form/BudgetDefaultRow';
import type { BudgetDefaultWithCategory } from '@/services/database/schemas/BudgetDefault';
import type { Category } from '@/services/database/schemas/Category';
import theme from '@/theme';

export default function BudgetDefaultsPage() {
  const { isReady, databaseService } = useDatabaseSetup();
  const [defaults, setDefaults] = useState<BudgetDefaultWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [amounts, setAmounts] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);

  const budgetDefaultService = databaseService ? useBudgetDefaultService(databaseService) : null;
  const categoryService = databaseService ? useCategoryService(databaseService) : null;

  useEffect(() => {
    loadData();
  }, [isReady, databaseService]);

  const loadData = async () => {
    if (!budgetDefaultService || !categoryService) return;

    try {
      setIsLoading(true);
      const [defaultsData, categoriesData] = await Promise.all([
        budgetDefaultService.getAllDefaults(),
        categoryService.getCategories()
      ]);

      setDefaults(defaultsData);
      setCategories(categoriesData);

      const amountsMap: Record<number, string> = {};
      defaultsData.forEach(d => {
        amountsMap[d.categoryId] = d.amount.toString();
      });
      setAmounts(amountsMap);
    } catch (error) {
      console.error('加载数据失败:', error);
      Alert.alert('错误', '加载数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAmountChange = useCallback((categoryId: number, value: string) => {
    setAmounts(prev => ({ ...prev, [categoryId]: value }));
  }, []);

  const handleSaveDefaults = async () => {
    if (!budgetDefaultService) return;

    try {
      for (const category of categories) {
        const amount = parseFloat(amounts[category.id] || '0');
        if (amount > 0) {
          await budgetDefaultService.updateDefault(category.id, amount, 'monthly');
        }
      }
      Alert.alert('成功', '默认值已保存');
      loadData();
    } catch (error) {
      console.error('保存失败:', error);
      Alert.alert('错误', '保存失败');
    }
  };

  const handleCreateMonthlyBudgets = async () => {
    if (!budgetDefaultService) return;

    const monthStr = `${currentYear}年${currentMonth}月`;

    Alert.alert(
      '确认',
      `将为 ${monthStr} 创建预算，确定继续吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: async () => {
            try {
              const results = await budgetDefaultService.createMonthlyBudgetsFromDefaults(currentYear, currentMonth);
              if (results.length === 0) {
                Alert.alert('提示', `${monthStr} 的预算已存在，无需创建`);
              } else {
                Alert.alert('成功', `已为 ${monthStr} 创建 ${results.length} 个预算`);
              }
            } catch (error) {
              console.error('创建预算失败:', error);
              Alert.alert('错误', '创建预算失败');
            }
          }
        }
      ]
    );
  };

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const incomeCategories = categories.filter(c => c.type === 'income');

  const goToPrevMonth = useCallback(() => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  }, [currentMonth]);

  const goToNextMonth = useCallback(() => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  }, [currentMonth]);

  return (
    <PageTemplate
      title="预算默认值设置"
    >
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>设置每月预算默认值</Text>
          <Text style={styles.sectionDescription}>
            设置每个分类的默认金额（支出预算和预期收入），保存后可批量为本月创建
          </Text>
        </View>

        {expenseCategories.length > 0 && (
          <View style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryHeaderText}>支出预算</Text>
            </View>
            <View style={styles.categoriesContainer}>
              {expenseCategories.map((category) => (
                <BudgetDefaultRow
                  key={category.id}
                  categoryId={category.id}
                  categoryName={category.name}
                  categoryIcon={category.icon}
                  initialAmount={amounts[category.id] || ''}
                  onAmountChange={handleAmountChange}
                />
              ))}
            </View>
          </View>
        )}

        {incomeCategories.length > 0 && (
          <View style={styles.categorySection}>
            <View style={[styles.categoryHeader, styles.incomeHeader]}>
              <Text style={[styles.categoryHeaderText, styles.incomeHeaderText]}>预期收入</Text>
            </View>
            <View style={styles.categoriesContainer}>
              {incomeCategories.map((category) => (
                <BudgetDefaultRow
                  key={category.id}
                  categoryId={category.id}
                  categoryName={category.name}
                  categoryIcon={category.icon}
                  initialAmount={amounts[category.id] || ''}
                  onAmountChange={handleAmountChange}
                />
              ))}
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.saveButton} onPress={handleSaveDefaults}>
          <Text style={styles.saveButtonText}>保存默认值</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>批量创建本月预算</Text>
          <Text style={styles.sectionDescription}>
            根据保存的默认值，为指定月份创建预算（如已存在则跳过）
          </Text>
        </View>

        <View style={styles.monthSelector}>
          <TouchableOpacity style={styles.monthButton} onPress={goToPrevMonth}>
            <Text style={styles.monthButtonText}>◀</Text>
          </TouchableOpacity>
          <View style={styles.monthDisplay}>
            <Text style={styles.monthText}>
              {currentYear}年{currentMonth}月
            </Text>
          </View>
          <TouchableOpacity style={styles.monthButton} onPress={goToNextMonth}>
            <Text style={styles.monthButtonText}>▶</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.createButton} onPress={handleCreateMonthlyBudgets}>
          <Text style={styles.createButtonText}>为当月创建预算</Text>
        </TouchableOpacity>
      </View>
    </PageTemplate>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  sectionDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  categoriesContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  categorySection: {
    marginBottom: theme.spacing.md,
  },
  categoryHeader: {
    backgroundColor: theme.colors.expense,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.xs,
  },
  categoryHeaderText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
  incomeHeader: {
    backgroundColor: theme.colors.income,
  },
  incomeHeaderText: {
    color: theme.colors.white,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  saveButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.lg,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  monthButton: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
  },
  monthButtonText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.primary,
  },
  monthDisplay: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
  },
  monthText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  createButton: {
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  createButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
});