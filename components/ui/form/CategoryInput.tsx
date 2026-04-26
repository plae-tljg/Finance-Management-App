import React, { memo, useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '@/components/base/Text';
import { useCategoryService } from '@/services/business/CategoryService';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';
import { LoadingView } from '@/components/base/LoadingView';
import type { Category } from '@/services/database/schemas/Category';
import theme from '@/theme';

interface CategoryInputProps {
  selectedId: number | null;
  onSelect: (category: { id: number; name: string } | null) => void;
}

export const CategoryInput = memo(function CategoryInput({ selectedId, onSelect }: CategoryInputProps) {
  const { isReady, databaseService } = useDatabaseSetup();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      if (!databaseService || !isReady) return;
      const categoryService = useCategoryService(databaseService);
      const data = await categoryService.getCategories();
      setCategories(data);
      setIsLoading(false);
    };
    loadCategories();
  }, [databaseService, isReady]);

  const handleSelect = useCallback((category: Category) => {
    onSelect(selectedId === category.id ? null : category);
  }, [selectedId, onSelect]);

  if (isLoading) {
    return <LoadingView message="加载分类..." />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>类别</Text>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.grid}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryItem,
                selectedId === category.id && styles.selectedCategory
              ]}
              onPress={() => handleSelect(category)}
            >
              <Text style={[
                styles.categoryName,
                selectedId === category.id && styles.selectedCategoryName
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
          {categories.length % 3 !== 0 &&
            Array.from({ length: 3 - (categories.length % 3) }).map((_, index) => (
              <View key={`placeholder-${index}`} style={styles.placeholderItem} />
            ))
          }
        </View>
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {},
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  scrollView: {
    maxHeight: 120,
  },
  contentContainer: {
    padding: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryItem: {
    padding: 6,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    width: '32%',
    marginBottom: 6,
  },
  selectedCategory: {
    backgroundColor: theme.colors.primary,
  },
  categoryName: {
    fontSize: 12,
    color: theme.colors.text,
    textAlign: 'center',
  },
  selectedCategoryName: {
    color: theme.colors.white,
  },
  placeholderItem: {
    width: '32%',
    marginBottom: 6,
  },
});