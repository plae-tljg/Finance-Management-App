import React from 'react';
import { View, StyleSheet, FlatList, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

// 模拟数据
const mockBudgets = [
  {
    id: '1',
    category: '餐饮',
    amount: 2000,
    spent: 1500,
    period: '2024-03',
  },
  {
    id: '2',
    category: '交通',
    amount: 1000,
    spent: 800,
    period: '2024-03',
  },
];

export const BudgetRecordsScreen = () => {
  const renderBudget = ({ item }: { item: typeof mockBudgets[0] }) => {
    const progress = (item.spent / item.amount) * 100;
    const isOverBudget = progress > 100;

    return (
      <View style={styles.budgetItem}>
        <View style={styles.budgetHeader}>
          <Text style={styles.category}>{item.category}</Text>
          <Text style={styles.period}>{item.period}</Text>
        </View>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${Math.min(progress, 100)}%` }]} />
        </View>
        <View style={styles.budgetFooter}>
          <Text style={styles.amount}>
            已用: ¥{item.spent} / ¥{item.amount}
          </Text>
          <Text
            style={[
              styles.remaining,
              { color: isOverBudget ? '#f4511e' : '#4caf50' },
            ]}
          >
            {isOverBudget
              ? `超出 ¥${item.spent - item.amount}`
              : `剩余 ¥${item.amount - item.spent}`}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={mockBudgets}
        renderItem={renderBudget}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    padding: 16,
  },
  budgetItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  category: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  period: {
    fontSize: 14,
    color: '#666',
  },
  progressContainer: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4caf50',
    borderRadius: 4,
  },
  budgetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amount: {
    fontSize: 14,
    color: '#666',
  },
  remaining: {
    fontSize: 14,
    fontWeight: 'bold',
  },
}); 