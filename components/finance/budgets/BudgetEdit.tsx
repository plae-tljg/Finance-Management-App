import React, { useCallback, memo } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { useBudgetEditForm } from '@/hooks/useBudgetEditForm';
import {
  FormCard,
  AmountInput,
  CategoryInput,
  PeriodSelector,
  SubmitButton,
} from '@/components/ui/form';
import { TextInput } from 'react-native';
import { Text } from '@/components/base/Text';
import type { Budget } from '@/services/database/schemas/Budget';
import theme from '@/theme';

interface BudgetEditProps {
  budget: Budget;
  onSave: () => void;
}

export const BudgetEdit = memo(function BudgetEdit({ budget, onSave }: BudgetEditProps) {
  const {
    name,
    description,
    amount,
    selectedCategory,
    period,
    isLoading,
    setName,
    setDescription,
    setAmount,
    setSelectedCategory,
    setPeriod,
    submit,
  } = useBudgetEditForm({ budget, onSuccess: onSave });

  const handleSubmit = useCallback(async () => {
    await submit();
  }, [submit]);

  return (
    <ScrollView style={styles.container}>
      <FormCard>
        <View style={styles.row}>
          <Text style={styles.label}>预算名称</Text>
          <TextInput
            style={[styles.input, styles.nameInput]}
            placeholder="输入预算名称"
            placeholderTextColor="#666"
            value={name}
            onChangeText={setName}
          />
        </View>
      </FormCard>

      <FormCard>
        <AmountInput
          value={amount}
          onChange={setAmount}
        />
      </FormCard>

      <FormCard>
        <CategoryInput
          selectedId={selectedCategory}
          onSelect={(category) => setSelectedCategory(category?.id || null)}
        />
      </FormCard>

      <FormCard>
        <PeriodSelector
          value={period}
          onChange={setPeriod}
        />
      </FormCard>

      <FormCard>
        <View style={styles.row}>
          <Text style={styles.label}>描述</Text>
          <TextInput
            style={[styles.input, styles.nameInput]}
            placeholder="输入描述（可选）"
            placeholderTextColor="#666"
            value={description}
            onChangeText={setDescription}
          />
        </View>
      </FormCard>

      <SubmitButton
        onPress={handleSubmit}
        loading={isLoading}
      />
    </ScrollView>
  );
});

BudgetEdit.displayName = 'BudgetEdit';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    backgroundColor: theme.colors.surfaceDark,
  },
  nameInput: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
});