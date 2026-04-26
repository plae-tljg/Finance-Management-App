import React, { useState, useEffect, memo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal } from 'react-native';
import { useFinance } from '@/contexts/FinanceContext';
import { Card } from '@/components/base/Card';
import { PageTemplate } from '@/components/base/PageTemplate';
import { GoalForm } from '@/components/goals/GoalForm';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/theme';
import type { Goal } from '@/services/database/schemas/Goal';

const GoalItem = memo(function GoalItem({ goal, onEdit }: { goal: Goal; onEdit: (goal: Goal) => void }) {
  const getProgress = useCallback((g: Goal) => {
    if (g.targetAmount === 0) return 0;
    return Math.min((g.currentAmount / g.targetAmount) * 100, 100);
  }, []);

  const progress = getProgress(goal);

  return (
    <Card style={styles.goalItem}>
      <View style={styles.goalHeader}>
        <View style={styles.goalIcon}>
          <Text style={styles.iconText}>{goal.icon}</Text>
        </View>
        <View style={styles.goalInfo}>
          <Text style={styles.goalName}>{goal.name}</Text>
          <Text style={styles.goalDeadline}>
            {goal.deadline ? `截止: ${goal.deadline}` : '无截止日期'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => onEdit(goal)}>
          <Ionicons name="pencil" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: goal.color }]} />
        </View>
        <Text style={styles.progressText}>{progress.toFixed(0)}%</Text>
      </View>
      <View style={styles.amountContainer}>
        <Text style={styles.currentAmount}>¥{goal.currentAmount.toFixed(2)}</Text>
        <Text style={styles.targetAmount}>/ ¥{goal.targetAmount.toFixed(2)}</Text>
      </View>
    </Card>
  );
});

export default function GoalsPage() {
  const { goals, isLoadingGoals, loadGoals } = useFinance();
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const handleEdit = useCallback((goal: Goal) => {
    setSelectedGoal(goal);
    setModalVisible(true);
  }, []);

  const handleAdd = useCallback(() => {
    setSelectedGoal(null);
    setModalVisible(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setModalVisible(false);
    setSelectedGoal(null);
  }, []);

  if (isLoadingGoals) {
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
      title="目标管理"
      scrollable={false}
      rightAccessory={
        <TouchableOpacity onPress={handleAdd}>
          <Ionicons name="add-circle" size={28} color={theme.colors.primary} />
        </TouchableOpacity>
      }
    >
      <FlatList
        data={goals}
        renderItem={({ item }) => <GoalItem goal={item} onEdit={handleEdit} />}
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
          <GoalForm
            goal={selectedGoal}
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
});