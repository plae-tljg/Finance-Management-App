import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RecordsStackParamList } from '../stacks/RecordsStack';
import Icon from 'react-native-vector-icons/MaterialIcons';

type RecordsMenuScreenNavigationProp = StackNavigationProp<RecordsStackParamList, 'RecordsMenu'>;

export const RecordsMenuScreen = () => {
  const navigation = useNavigation<RecordsMenuScreenNavigationProp>();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => navigation.navigate('TransactionRecords')}
      >
        <Icon name="receipt" size={32} color="#f4511e" />
        <Text style={styles.menuText}>交易记录</Text>
        <Icon name="chevron-right" size={24} color="#999" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => navigation.navigate('BudgetRecords')}
      >
        <Icon name="account-balance-wallet" size={32} color="#f4511e" />
        <Text style={styles.menuText}>预算记录</Text>
        <Icon name="chevron-right" size={24} color="#999" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  menuItem: {
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
  menuText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
    color: '#333',
  },
}); 