import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFinance } from '@/contexts/FinanceContext';
import { BackgroundImage } from '@/components/base/BackgroundImage';
import { Card } from '@/components/base/Card';
import { HeaderCard } from '@/components/base/HeaderCard';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/theme';
import type { Goal } from '@/services/database/schemas/Goal';

export default function GoalsPage() {
  const router = useRouter();
  const { goals, isLoadingGoals, loadGoals } = useFinance();
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    targetAmount: 0,
    currentAmount: 0,
    icon: '',
    color: '#5856D6',
    deadline: '',
    isActive: true,
    isCompleted: false
  });

  useEffect(() => {
    loadGoals();
  }, []);

  const handleEdit = (goal: Goal) => {
    setSelectedGoal(goal);
    setEditForm({
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      icon: goal.icon,
      color: goal.color,
      deadline: goal.deadline || '',
      isActive: goal.isActive,
      isCompleted: goal.isCompleted
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    console.log('Save goal:', editForm);
    setModalVisible(false);
  };

  const getProgress = (goal: Goal) => {
    if (goal.targetAmount === 0) return 0;
    return Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  };

  const renderGoalItem = ({ item }: { item: Goal }) => {
    const progress = getProgress(item);
    return (
      <Card style={styles.goalItem}>
        <View style={styles.goalHeader}>
          <View style={styles.goalIcon}>
            <Text style={styles.iconText}>{item.icon}</Text>
          </View>
          <View style={styles.goalInfo}>
            <Text style={styles.goalName}>{item.name}</Text>
            <Text style={styles.goalDeadline}>
              {item.deadline ? `截止: ${item.deadline}` : '无截止日期'}
            </Text>
          </View>
          <TouchableOpacity onPress={() => handleEdit(item)}>
            <Ionicons name="pencil" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: item.color }]} />
          </View>
          <Text style={styles.progressText}>{progress.toFixed(0)}%</Text>
        </View>
        <View style={styles.amountContainer}>
          <Text style={styles.currentAmount}>¥{item.currentAmount.toFixed(2)}</Text>
          <Text style={styles.targetAmount}>/ ¥{item.targetAmount.toFixed(2)}</Text>
        </View>
      </Card>
    );
  };

  if (isLoadingGoals) {
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
        <HeaderCard title="目标管理" />
        <View style={styles.addButtonContainer}>
          <TouchableOpacity onPress={() => {
            setSelectedGoal(null);
            setEditForm({
              name: '',
              targetAmount: 0,
              currentAmount: 0,
              icon: '🎯',
              color: '#5856D6',
              deadline: '',
              isActive: true,
              isCompleted: false
            });
            setModalVisible(true);
          }} style={styles.addButton}>
            <Ionicons name="add-circle" size={28} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
        <FlatList
          data={goals}
          renderItem={renderGoalItem}
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
            <Text style={styles.modalTitle}>{selectedGoal ? '编辑目标' : '新增目标'}</Text>

            <Text style={styles.inputLabel}>目标名称</Text>
            <TextInput
              style={styles.input}
              value={editForm.name}
              onChangeText={(text) => setEditForm({...editForm, name: text})}
              placeholder="目标名称"
              placeholderTextColor={theme.colors.textTertiary}
            />

            <Text style={styles.inputLabel}>图标</Text>
            <TextInput
              style={styles.input}
              value={editForm.icon}
              onChangeText={(text) => setEditForm({...editForm, icon: text})}
              placeholder="图标"
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
  goalItem: {
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  goalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  iconText: {
    fontSize: 20,
  },
  goalInfo: {
    flex: 1,
  },
  goalName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  goalDeadline: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: theme.colors.surfaceDark,
    borderRadius: 4,
    marginRight: theme.spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
    width: 40,
    textAlign: 'right',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currentAmount: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  targetAmount: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
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