import React from 'react';
import { View, StyleSheet, FlatList, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

// 模拟数据
const mockTransactions = [
  {
    id: '1',
    type: 'expense',
    amount: 100,
    category: '餐饮',
    date: '2024-03-20',
    description: '午餐',
  },
  {
    id: '2',
    type: 'income',
    amount: 5000,
    category: '工资',
    date: '2024-03-19',
    description: '3月工资',
  },
];

export const TransactionRecordsScreen = () => {
  const renderTransaction = ({ item }: { item: typeof mockTransactions[0] }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionIcon}>
        <Icon
          name={item.type === 'expense' ? 'remove-circle' : 'add-circle'}
          size={32}
          color={item.type === 'expense' ? '#f4511e' : '#4caf50'}
        />
      </View>
      <View style={styles.transactionInfo}>
        <Text style={styles.category}>{item.category}</Text>
        <Text style={styles.description}>{item.description}</Text>
        <Text style={styles.date}>{item.date}</Text>
      </View>
      <Text
        style={[
          styles.amount,
          { color: item.type === 'expense' ? '#f4511e' : '#4caf50' },
        ]}
      >
        {item.type === 'expense' ? '-' : '+'}¥{item.amount}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={mockTransactions}
        renderItem={renderTransaction}
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
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
  transactionIcon: {
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  category: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 