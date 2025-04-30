import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AddMenuScreen } from '../screens/AddMenuScreen';
import { AddTransactionScreen } from '../../screens/AddRecord/AddTransactionScreen';
import { AddBudgetScreen } from '../../screens/AddRecord/AddBudgetScreen';
import { useCategoryService } from '../../contexts/ServiceContext';

// 定义导航参数类型
type AddStackParamList = {
  AddMenu: undefined;
  AddTransaction: undefined;
  AddBudget: undefined;
};

const Stack = createStackNavigator<AddStackParamList>();

export const AddStack = () => {
  const categoryService = useCategoryService();

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
        name="AddMenu" 
        component={AddMenuScreen}
        options={{ title: '添加记录' }}
      />
      <Stack.Screen 
        name="AddTransaction" 
        options={{
          title: '添加交易',
        }}
      >
        {() => <AddTransactionScreen />}
      </Stack.Screen>
      <Stack.Screen 
        name="AddBudget" 
        options={{
          title: '添加预算',
        }}
      >
        {() => <AddBudgetScreen />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}; 