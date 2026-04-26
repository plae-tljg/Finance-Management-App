import React, { useCallback, memo } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { useBudgetForm } from '@/hooks/useBudgetForm';
import {
  FormCard,
  AmountInput,
  CategoryInput,
  PeriodSelector,
  SubmitButton,
} from '@/components/ui/form';
import { TextInput } from 'react-native';
import { Text } from '@/components/base/Text';
import theme from '@/theme';

interface BudgetAddProps {
  onSubmit: () => void;
}

export const BudgetAdd = memo(function BudgetAdd({ onSubmit }: BudgetAddProps) {
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
  } = useBudgetForm({ onSuccess: onSubmit });

  const handleSubmit = useCallback(async () => {
    await submit();
  }, [submit]);

  return (
    <View style={styles.content}>
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
    </View>
  );
});

BudgetAdd.displayName = 'BudgetAdd';

const styles = StyleSheet.create({
  content: {
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