import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text } from '@/components/base/Text';
import { useBudgetService } from '@/services/business/BudgetService';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';
import { LoadingView } from '@/components/base/LoadingView';
import { ErrorView } from '@/components/base/ErrorView';

interface BudgetSelectorProps {
  categoryId: number;
  onSelect: (budget: { id: number; name: string } | null) => void;
  selectedId?: number;
}

export function BudgetSelector({ categoryId, onSelect, selectedId }: BudgetSelectorProps) {
  const { isReady, error, databaseService, retry } = useDatabaseSetup();
  const [budgets, setBudgets] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const budgetService = React.useMemo(
    () => databaseService ? useBudgetService(databaseService) : null,
    [databaseService]
  );

  React.useEffect(() => {
    if (!isReady || !budgetService || !categoryId) return;
    loadBudgets();
  }, [isReady, budgetService, categoryId]);

  async function loadBudgets() {
    if (!budgetService) return;
    
    try {
      setIsLoading(true);
      const data = await budgetService.getBudgetsByCategory(categoryId);
      setBudgets(data);
    } catch (err) {
      console.error('加载预算失败:', err);
    } finally {
      setIsLoading(false);
    }
  }

  if (error) {
    return <ErrorView 
      error={error} 
      onRetry={retry}
      message="加载预算失败" 
    />;
  }

  if (!isReady || isLoading || !budgetService || !categoryId) {
    return null;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between'
      }}>
        {budgets.map((budget) => (
          <TouchableOpacity
            key={budget.id}
            style={[
              styles.budgetItem,
              selectedId === budget.id && styles.selectedBudget
            ]}
            onPress={() => onSelect(selectedId === budget.id ? null : budget)}
          >
            <Text style={[
              styles.budgetName,
              selectedId === budget.id && styles.selectedBudgetName
            ]}>
              {budget.name}
            </Text>
            <Text style={[
              styles.budgetAmount,
              selectedId === budget.id && styles.selectedBudgetAmount
            ]}>
              ¥{budget.amount.toFixed(2)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 4,
  },
  budgetItem: {
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    width: '49%',
    marginBottom: 6,
  },
  selectedBudget: {
    backgroundColor: '#007AFF',
  },
  budgetName: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 4,
  },
  selectedBudgetName: {
    color: '#FFFFFF',
  },
  budgetAmount: {
    fontSize: 12,
    color: '#666666',
  },
  selectedBudgetAmount: {
    color: '#FFFFFF',
  },
}); 