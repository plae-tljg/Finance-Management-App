import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { FinanceOverviewCard } from './FinanceOverviewCard';
import { useBudgetService } from '../../contexts/ServiceContext';
import { useTransactionService } from '../../contexts/ServiceContext';

export const HomeScreen: React.FC = () => {
  const [totalBudget, setTotalBudget] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [isDanger, setIsDanger] = useState(false);

  const budgetService = useBudgetService();
  const transactionService = useTransactionService();

  const loadData = async () => {
    try {
      // 获取总预算
      const totalBudgetAmount = await budgetService.getTotalBudgetAmount();
      setTotalBudget(totalBudgetAmount);

      // 获取总支出
      const totalExpenseAmount = await transactionService.getTotalAmountByType('expense');
      setTotalExpense(totalExpenseAmount);

      // 获取总收入
      const totalIncomeAmount = await transactionService.getTotalAmountByType('income');
      setTotalIncome(totalIncomeAmount);

      // 检查是否超出预算
      setIsDanger(totalExpenseAmount > totalBudgetAmount);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.content}>
        <FinanceOverviewCard
          totalBudget={totalBudget}
          totalExpense={totalExpense}
          totalIncome={totalIncome}
          isDanger={isDanger}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
  },
  content: {
    padding: 16,
  },
}); 