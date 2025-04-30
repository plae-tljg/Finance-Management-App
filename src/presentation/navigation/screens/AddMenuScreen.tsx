import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface AddMenuScreenProps {
  navigation: NavigationProp<ParamListBase>;
}

export const AddMenuScreen: React.FC<AddMenuScreenProps> = ({ navigation }) => (
  <View style={styles.menuContainer}>
    <TouchableOpacity 
      style={styles.menuItem}
      onPress={() => navigation.navigate('AddTransaction')}
    >
      <Icon name="swap-horiz" size={32} color="#f4511e" />
      <Text style={styles.menuText}>添加交易</Text>
    </TouchableOpacity>
    <TouchableOpacity 
      style={styles.menuItem}
      onPress={() => navigation.navigate('AddBudget')}
    >
      <Icon name="account-balance-wallet" size={32} color="#f4511e" />
      <Text style={styles.menuText}>添加预算</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  menuContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F5FCFF',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
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
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 16,
    color: '#333',
  },
}); 