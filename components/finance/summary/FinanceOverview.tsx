import React from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Text } from '@/components/base/Text';
import { Card } from '@/components/base/Card';
import { FinanceSummary } from './FinanceSummary';
import { withDataLoading } from '@/components/base/withDataLoading';
import { useFinance } from '@/contexts/FinanceContext';

const summaryStyles = StyleSheet.create({
  content: {
    padding: 10,
  },
  card: {
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  }
});

function FinanceOverviewBase() {
  const { chartData } = useFinance();
  
  return (
    <View style={summaryStyles.content}>
      <Card style={summaryStyles.card}>
        <FinanceSummary />
      </Card>
      
      <Card style={summaryStyles.card}>
        <Text variant="subtitle">本周支出趋势</Text>
        <LineChart
          data={chartData}
          width={Dimensions.get('window').width - 40}
          height={220}
          chartConfig={{
            backgroundColor: '#e26a00',
            backgroundGradientFrom: '#fb8c00',
            backgroundGradientTo: '#ffa726',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            style: {
              borderRadius: 16
            }
          }}
          bezier
          style={summaryStyles.chart}
        />
      </Card>
    </View>
  );
}

export const FinanceOverview = withDataLoading(FinanceOverviewBase, {
  loadingMessage: "加载财务概览...",
  errorMessage: "加载财务概览失败"
}); 