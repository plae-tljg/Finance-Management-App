import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text } from '@/components/base/Text';
import { useCategoryService } from '@/services/business/CategoryService';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';
import { LoadingView } from '@/components/base/LoadingView';
import { ErrorView } from '@/components/base/ErrorView';

interface CategorySelectorProps {
  onSelect: (category: { id: number; name: string } | null) => void;
  selectedId?: number;
}

export function CategorySelector({ onSelect, selectedId }: CategorySelectorProps) {
  const { isReady, error, databaseService, retry } = useDatabaseSetup();
  const [categories, setCategories] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const categoryService = React.useMemo(
    () => databaseService ? useCategoryService(databaseService) : null,
    [databaseService]
  );

  React.useEffect(() => {
    if (!isReady || !categoryService) return;
    loadCategories();
  }, [isReady, categoryService]);

  async function loadCategories() {
    if (!categoryService) return;
    
    try {
      setIsLoading(true);
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('加载分类失败:', err);
    } finally {
      setIsLoading(false);
    }
  }

  if (error) {
    return <ErrorView 
      error={error} 
      onRetry={retry}
      message="加载分类失败" 
    />;
  }

  if (!isReady || isLoading || !categoryService) {
    return <LoadingView message="加载中..." />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between'
      }}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryItem,
              selectedId === category.id && styles.selectedCategory
            ]}
            onPress={() => onSelect(selectedId === category.id ? null : category)}
          >
            <Text style={[
              styles.categoryName,
              selectedId === category.id && styles.selectedCategoryName
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 8,
  },
  categoryItem: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    width: '49%',
    marginBottom: 8,
  },
  selectedCategory: {
    backgroundColor: '#007AFF',
  },
  categoryName: {
    fontSize: 16,
    color: '#000000',
  },
  selectedCategoryName: {
    color: '#FFFFFF',
  },
}); 