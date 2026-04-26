import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/base/Text';
import { Card } from '@/components/base/Card';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { useFinance } from '@/contexts/FinanceContext';
import { withDataLoading } from '@/components/base/withDataLoading';
import theme from '@/theme';

interface FinanceOverviewProps {
  isReady: boolean;
}

function FinanceOverviewBase({ isReady }: FinanceOverviewProps) {
  const { chartData, loadChartData } = useFinance();

  useEffect(() => {
    if (isReady) {
      loadChartData();
    }
  }, [isReady, loadChartData]);

  return (
    <View style={styles.content}>
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>本周支出趋势</Text>
        <LineChart
          data={chartData}
          width={Dimensions.get('window').width - 64}
          height={200}
          chartConfig={{
            backgroundColor: theme.colors.surface,
            backgroundGradientFrom: theme.colors.surface,
            backgroundGradientTo: theme.colors.surface,
            decimalPlaces: 0,
            color: () => theme.colors.primary,
            labelColor: () => theme.colors.textSecondary,
            style: {
              borderRadius: theme.borderRadius.md,
            },
            propsForDots: {
              r: '4',
              strokeWidth: '2',
              stroke: theme.colors.primary,
            },
          }}
          bezier
          style={styles.chart}
        />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: theme.spacing.md,
  },
  card: {
    padding: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  chart: {
    marginVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
});

export const FinanceOverview = withDataLoading(FinanceOverviewBase, {
  loadingMessage: "加载财务概览...",
  errorMessage: "加载财务概览失败"
});