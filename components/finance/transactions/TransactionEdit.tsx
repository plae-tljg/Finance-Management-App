import React, { useCallback, memo } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { useTransactionEditForm } from '@/hooks/useTransactionEditForm';
import {
  FormCard,
  TypeSelector,
  AmountInput,
  AccountSelector,
  DateTimeSelector,
  NameInput,
  DescriptionInput,
  CategoryInput,
  BudgetInput,
  SubmitButton,
} from '@/components/ui/form';
import type { Transaction } from '@/services/database/schemas/Transaction';
import theme from '@/theme';

interface TransactionEditProps {
  transaction: Transaction;
  onSave: () => void;
}

export const TransactionEdit = memo(function TransactionEdit({ transaction, onSave }: TransactionEditProps) {
  const {
    name,
    description,
    amount,
    selectedCategory,
    selectedBudget,
    selectedAccount,
    type,
    date,
    time,
    isLoading,
    setName,
    setDescription,
    setAmount,
    setSelectedCategory,
    setSelectedBudget,
    setSelectedAccount,
    setType,
    setDate,
    setTime,
    submit,
  } = useTransactionEditForm({ transaction, onSuccess: onSave });

  const handleSubmit = useCallback(async () => {
    await submit();
  }, [submit]);

  return (
    <ScrollView style={styles.container}>
      <FormCard>
        <NameInput
          value={name}
          onChange={setName}
        />
      </FormCard>

      <FormCard>
        <DescriptionInput
          value={description}
          onChange={setDescription}
        />
      </FormCard>

      <FormCard>
        <AmountInput
          value={amount}
          onChange={setAmount}
        />
      </FormCard>

      <FormCard>
        <AccountSelector
          selectedId={selectedAccount}
          onSelect={setSelectedAccount}
        />
      </FormCard>

      <FormCard>
        <DateTimeSelector
          date={date}
          time={time}
          onDateChange={setDate}
          onTimeChange={setTime}
        />
      </FormCard>

      <FormCard>
        <CategoryInput
          selectedId={selectedCategory}
          onSelect={(category) => setSelectedCategory(category?.id || null)}
        />
      </FormCard>

      {selectedCategory && (
        <FormCard>
          <BudgetInput
            categoryId={selectedCategory}
            selectedId={selectedBudget}
            onSelect={(budget) => setSelectedBudget(budget?.id || null)}
            date={date}
          />
        </FormCard>
      )}

      <FormCard>
        <TypeSelector
          value={type}
          onChange={setType}
        />
      </FormCard>

      <SubmitButton
        onPress={handleSubmit}
        loading={isLoading}
      />
    </ScrollView>
  );
});

TransactionEdit.displayName = 'TransactionEdit';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.md,
  },
});