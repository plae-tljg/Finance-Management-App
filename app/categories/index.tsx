import React, { useState, useEffect, memo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal } from 'react-native';
import { useFinance } from '@/contexts/FinanceContext';
import { Card } from '@/components/base/Card';
import { PageTemplate } from '@/components/base/PageTemplate';
import { CategoryForm } from '@/components/categories/CategoryForm';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/theme';
import type { Category } from '@/services/database/schemas/Category';

const CategoryItem = memo(function CategoryItem({ category, onEdit }: { category: Category; onEdit: (c: Category) => void }) {
  return (
    <Card style={styles.categoryItem}>
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryName}>{category.name}</Text>
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
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

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
        <TouchableOpacity onPress={handleAdd}>
          <Ionicons name="add-circle" size={28} color={theme.colors.primary} />
        </TouchableOpacity>
      }
    >
      <FlatList
        data={categories}
        renderItem={({ item }) => <CategoryItem category={item} onEdit={handleEdit} />}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
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
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
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