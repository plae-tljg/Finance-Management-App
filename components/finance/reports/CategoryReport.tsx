import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from '@/components/base/Text';
import { useTransactionService } from '@/services/business/TransactionService';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';

interface CategorySummary {
  categoryId: number;
  categoryName: string;
  total: number;
  count: number;
}

interface CategoryReportProps {
  month: Date;
}

export function CategoryReport({ month }: CategoryReportProps) {
  const { databaseService } = useDatabaseSetup();
  const [categorySummaries, setCategorySummaries] = useState<CategorySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const transactionService = React.useMemo(
    () => databaseService ? useTransactionService(databaseService) : null,
    [databaseService]
  );

  useEffect(() => {
    if (!transactionService) return;

    const loadCategoryData = async () => {
      try {
        setIsLoading(true);
        
        const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
        const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);
        
        const summaries = await transactionService.getTransactionsSummaryByCategory(
          startDate.toISOString(),
          endDate.toISOString()
        );
        setCategorySummaries(summaries);
      } catch (error) {
        console.error('加载分类报告失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCategoryData();
  }, [transactionService, month]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>加载中...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text variant="title" style={styles.sectionTitle}>分类统计</Text>
        {categorySummaries.map((summary) => (
          <View key={summary.categoryId} style={styles.categoryCard}>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryName}>{summary.categoryName}</Text>
              <Text style={styles.transactionCount}>{summary.count}笔交易</Text>
            </View>
            <View style={styles.amountContainer}>
              <Text style={[
                styles.amount,
                summary.total > 0 ? styles.income : styles.expense
              ]}>
                ¥{Math.abs(summary.total).toFixed(2)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
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
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  transactionCount: {
    fontSize: 14,
    color: '#666',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 18,
    fontWeight: '600',
  },
  income: {
    color: '#34C759',
  },
  expense: {
    color: '#FF3B30',
  },
}); 