import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface FinanceOverviewCardProps {
  totalBudget: number;
  totalExpense: number;
  totalIncome: number;
  isDanger?: boolean;
}

export const FinanceOverviewCard: React.FC<FinanceOverviewCardProps> = ({
  totalBudget,
  totalExpense,
  totalIncome,
  isDanger = false,
}) => {
  return (
    <View style={styles.container}>
      <View style={[styles.card, isDanger && styles.dangerCard]}>
        <View style={styles.header}>
          <Icon name="account-balance-wallet" size={24} color="#4CAF50" />
          <Text style={styles.title}>总预算</Text>
        </View>
        <Text style={[styles.amount, { color: '#4CAF50' }]}>
          ¥{totalBudget.toLocaleString()}
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.header}>
          <Icon name="remove-circle" size={24} color="#FF5722" />
          <Text style={styles.title}>总支出</Text>
        </View>
        <Text style={[styles.amount, { color: '#FF5722' }]}>
          ¥{totalExpense.toLocaleString()}
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.header}>
          <Icon name="add-circle" size={24} color="#2196F3" />
          <Text style={styles.title}>总收入</Text>
        </View>
        <Text style={[styles.amount, { color: '#2196F3' }]}>
          ¥{totalIncome.toLocaleString()}
        </Text>
      </View>

      {isDanger && (
        <View style={styles.dangerIndicator}>
          <Icon name="warning" size={16} color="#ff3b30" />
          <Text style={styles.dangerText}>支出已超出预算</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dangerCard: {
    borderWidth: 1,
    borderColor: '#ff3b30',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#333',
  },
  amount: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  dangerIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff2f2',
    borderRadius: 8,
  },
  dangerText: {
    color: '#ff3b30',
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
}); 