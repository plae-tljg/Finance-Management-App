import React, { useState, useEffect, memo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Alert } from 'react-native';
import { useFinance } from '@/contexts/FinanceContext';
import { Card } from '@/components/base/Card';
import { PageTemplate } from '@/components/base/PageTemplate';
import { CategoryForm } from '@/components/categories/CategoryForm';
import { useCategoryService } from '@/services/business/CategoryService';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/theme';
import type { Category } from '@/services/database/schemas/Category';

const CategoryItem = memo(function CategoryItem({ category, onEdit }: { category: Category; onEdit: (c: Category) => void }) {
  return (
    <Card style={styles.categoryItem}>
      <View style={styles.categoryInfo}>
        <View style={styles.categoryNameRow}>
          <Text style={styles.categoryIcon}>{category.icon}</Text>
          <Text style={styles.categoryName}>{category.name}</Text>
          {!category.isActive && (
            <View style={styles.retiredBadge}>
              <Text style={styles.retiredBadgeText}>已停用</Text>
            </View>
          )}
        </View>
        <Text style={styles.categoryType}>{category.type === 'income' ? '收入' : '支出'}</Text>
      </View>
      <TouchableOpacity onPress={() => onEdit(category)}>
        <Ionicons name="pencil" size={24} color={theme.colors.textSecondary} />
      </TouchableOpacity>
    </Card>
  );
});

export default function CategoriesPage() {
  const { categories, isLoadingCategories, loadCategories } = useFinance();
  const { isReady, databaseService } = useDatabaseSetup();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleEdit = useCallback((category: Category) => {
    setSelectedCategory(category);
    setModalVisible(true);
  }, []);

  const handleAdd = useCallback(() => {
    setSelectedCategory(null);
    setModalVisible(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setModalVisible(false);
    setSelectedCategory(null);
    loadCategories();
  }, [loadCategories]);

  const handleReset = useCallback(() => {
    if (!databaseService || !isReady || isResetting) return;
    const retireCount = categories.filter(c => c.isActive && !isDefaultCategoryName(c.name)).length;
    const restoreCount = categories.filter(c => !c.isActive && isDefaultCategoryName(c.name)).length;

    Alert.alert(
      '重置为默认分类',
      `这将：
  • 停用 ${retireCount} 个非默认分类（已有交易仍能正确显示）
  • 恢复 ${restoreCount} 个被停用的默认分类
  • 补齐缺失的默认分类

已有的自定义分类会被停用（不会删除），你之后可以重新启用。确定继续？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '重置',
          style: 'destructive',
          onPress: async () => {
            setIsResetting(true);
            try {
              const svc = useCategoryService(databaseService);
              const result = await svc.resetToDefaults();
              await loadCategories();
              Alert.alert(
                '重置完成',
                `停用 ${result.deactivated} 个、补齐 ${result.inserted} 个、恢复 ${result.reactivated} 个。`,
              );
            } catch (e: any) {
              Alert.alert('重置失败', e?.message ?? String(e));
            } finally {
              setIsResetting(false);
            }
          },
        },
      ],
    );
  }, [databaseService, isReady, isResetting, categories, loadCategories]);

  if (isLoadingCategories) {
    return (
      <PageTemplate title="加载中..." showBack={false}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="分类管理"
      showBack={false}
      scrollable={false}
      rightAccessory={
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={handleReset}
            disabled={isResetting}
            style={styles.headerButton}
            accessibilityLabel="重置为默认分类"
          >
            <Ionicons
              name="refresh-circle"
              size={28}
              color={isResetting ? theme.colors.textTertiary : theme.colors.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleAdd} style={styles.headerButton}>
            <Ionicons name="add-circle" size={28} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      }
    >
      <FlatList
        data={categories}
        renderItem={({ item }) => <CategoryItem category={item} onEdit={handleEdit} />}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          <Card style={styles.hintCard}>
            <Ionicons name="information-circle-outline" size={20} color={theme.colors.textSecondary} />
            <Text style={styles.hintText}>
              点 ↻ 把分类列表恢复为默认 6 个一级分类（已停用的会重新启用，自定义分类会被停用但不会删除）。
            </Text>
          </Card>
        }
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleModalClose}
      >
        <View style={styles.modalContainer}>
          <CategoryForm
            category={selectedCategory}
            onSuccess={handleModalClose}
            onCancel={handleModalClose}
          />
        </View>
      </Modal>
    </PageTemplate>
  );
}

// Local helper — keeps the "is this a default name?" logic next to the
// reset button without leaking the full DEFAULT_CATEGORIES list into the
// component.
const DEFAULT_CATEGORY_NAMES: ReadonlySet<string> = new Set([
  '餐饮', '交通', '购物', '家用', '账单', '工资',
]);
function isDefaultCategoryName(name: string): boolean {
  return DEFAULT_CATEGORY_NAMES.has(name);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.md,
  },
  listContainer: {
    padding: theme.spacing.lg,
  },
  addButtonContainer: {
    alignItems: 'flex-end',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  addButton: {
    padding: theme.spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: theme.spacing.xs,
    marginLeft: theme.spacing.xs,
  },
  hintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surfaceLight ?? '#f5f7fa',
  },
  hintText: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 18,
    marginRight: theme.spacing.xs,
  },
  categoryName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  retiredBadge: {
    marginLeft: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: theme.colors.surfaceDark,
  },
  retiredBadgeText: {
    fontSize: 10,
    color: theme.colors.textTertiary,
  },
  categoryType: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.overlay,
  },
});