import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { RecordsMenuScreen } from '../screens/RecordsMenuScreen';
import { TransactionRecordsScreen } from '../screens/TransactionRecordsScreen';
import { BudgetRecordsScreen } from '../screens/BudgetRecordsScreen';

export type RecordsStackParamList = {
  RecordsMenu: undefined;
  TransactionRecords: undefined;
  BudgetRecords: undefined;
};

const Stack = createStackNavigator<RecordsStackParamList>();

export const RecordsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#f4511e',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="RecordsMenu"
        component={RecordsMenuScreen}
        options={{
          title: '记录',
        }}
      />
      <Stack.Screen
        name="TransactionRecords"
        component={TransactionRecordsScreen}
        options={{
          title: '交易记录',
        }}
      />
      <Stack.Screen
        name="BudgetRecords"
        component={BudgetRecordsScreen}
        options={{
          title: '预算记录',
        }}
      />
    </Stack.Navigator>
  );
}; 