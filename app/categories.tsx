import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput } from 'react-native';
import { useFinance } from '@/contexts/FinanceContext';
import { Ionicons } from '@expo/vector-icons';

export default function CategoriesPage() {
  const { categories, isLoadingCategories, loadCategories, updateCategory } = useFinance();
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

  const handleUpdate = async () => {
    if (!selectedCategory) return;
    
    try {
      await updateCategory(selectedCategory.id, {
        name: editForm.name,
        icon: editForm.icon,
        type: editForm.type as "income" | "expense",
        sortOrder: editForm.sortOrder,
        isDefault: editForm.isDefault,
        isActive: editForm.isActive
      });
      setModalVisible(false);
      loadCategories();
    } catch (error) {
      console.error('更新分类失败:', error);
    }
  };

  const renderCategoryItem = ({ item }: { item: any }) => (
    <View style={styles.categoryItem}>
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryName}>{item.name}</Text>
        <Text style={styles.categoryType}>{item.type === 'income' ? '收入' : '支出'}</Text>
      </View>
      <TouchableOpacity onPress={() => handleEdit(item)}>
        <Ionicons name="pencil" size={24} color="#666" />
      </TouchableOpacity>
    </View>
  );

  if (isLoadingCategories) {
    return (
      <View style={styles.container}>
        <Text>加载中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={categories}
        renderItem={renderCategoryItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>编辑分类</Text>
            
            <TextInput
              style={styles.input}
              value={editForm.name}
              onChangeText={(text) => setEditForm({...editForm, name: text})}
              placeholder="分类名称"
            />
            
            <TextInput
              style={styles.input}
              value={editForm.icon}
              onChangeText={(text) => setEditForm({...editForm, icon: text})}
              placeholder="图标名称"
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
                onPress={handleUpdate}
              >
                <Text style={styles.buttonText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listContainer: {
    padding: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
  },
  categoryType: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#ddd',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '500',
  },
}); 