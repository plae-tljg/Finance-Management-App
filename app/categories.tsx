import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFinance } from '@/contexts/FinanceContext';
import { BackgroundImage } from '@/components/base/BackgroundImage';
import { Card } from '@/components/base/Card';
import { HeaderCard } from '@/components/base/HeaderCard';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/theme';

export default function CategoriesPage() {
  const { categories, isLoadingCategories, loadCategories, updateCategory, createCategory } = useFinance();
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    icon: '',
    type: 'expense',
    sortOrder: 0,
    isDefault: false,
    isActive: true
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const handleEdit = (category: any) => {
    setSelectedCategory(category);
    setEditForm({
      name: category.name,
      icon: category.icon,
      type: category.type,
      sortOrder: category.sortOrder,
      isDefault: category.isDefault,
      isActive: category.isActive
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      if (selectedCategory) {
        await updateCategory(selectedCategory.id, {
          name: editForm.name,
          icon: editForm.icon,
          type: editForm.type as "income" | "expense",
          sortOrder: editForm.sortOrder,
          isDefault: editForm.isDefault,
          isActive: editForm.isActive
        });
      } else {
        await createCategory({
          name: editForm.name,
          icon: editForm.icon,
          type: editForm.type as "income" | "expense",
          sortOrder: editForm.sortOrder,
          isDefault: editForm.isDefault,
          isActive: editForm.isActive
        });
      }
      setModalVisible(false);
      loadCategories();
    } catch (error) {
      console.error('保存分类失败:', error);
    }
  };

  const renderCategoryItem = ({ item }: { item: any }) => (
    <Card style={styles.categoryItem}>
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryName}>{item.name}</Text>
        <Text style={styles.categoryType}>{item.type === 'income' ? '收入' : '支出'}</Text>
      </View>
      <TouchableOpacity onPress={() => handleEdit(item)}>
        <Ionicons name="pencil" size={24} color={theme.colors.textSecondary} />
      </TouchableOpacity>
    </Card>
  );

  if (isLoadingCategories) {
    return (
      <BackgroundImage>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </BackgroundImage>
    );
  }

  return (
    <BackgroundImage>
      <SafeAreaView style={styles.container} edges={['top']}>
        <HeaderCard title="分类管理" showBack={false} />
        <View style={styles.addButtonContainer}>
          <TouchableOpacity onPress={() => {
            setSelectedCategory(null);
            setEditForm({
              name: '',
              icon: '',
              type: 'expense',
              sortOrder: 0,
              isDefault: false,
              isActive: true
            });
            setModalVisible(true);
          }} style={styles.addButton}>
            <Ionicons name="add-circle" size={28} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
        />
      </SafeAreaView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedCategory ? '编辑分类' : '新增分类'}</Text>
            
            <Text style={styles.inputLabel}>分类名称</Text>
            <TextInput
              style={styles.input}
              value={editForm.name}
              onChangeText={(text) => setEditForm({...editForm, name: text})}
              placeholder="分类名称"
              placeholderTextColor={theme.colors.textTertiary}
            />
            
            <Text style={styles.inputLabel}>图标</Text>
            <TextInput
              style={styles.input}
              value={editForm.icon}
              onChangeText={(text) => setEditForm({...editForm, icon: text})}
              placeholder="图标名称"
              placeholderTextColor={theme.colors.textTertiary}
            />

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>取消</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSubmit}
              >
                <Text style={styles.buttonText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </BackgroundImage>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
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
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
    color: theme.colors.text,
  },
  inputLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    backgroundColor: theme.colors.surfaceDark,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.lg,
  },
  button: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  cancelButton: {
    backgroundColor: theme.colors.backgroundLight,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
  },
  buttonText: {
    color: theme.colors.white,
    textAlign: 'center',
    fontWeight: theme.fontWeight.medium,
  },
}); 