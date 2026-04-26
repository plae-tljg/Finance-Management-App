import React, { useCallback, memo } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { useTransactionForm } from '@/hooks/useTransactionForm';
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
  TemplateToggle,
  SubmitButton,
} from '@/components/ui/form';
import theme from '@/theme';

interface TransactionAddProps {
  onSubmit: () => void;
}

export const TransactionAdd = memo(function TransactionAdd({ onSubmit }: TransactionAddProps) {
  const {
    type,
    name,
    amount,
    selectedCategory,
    selectedCategoryName,
    selectedBudget,
    selectedAccount,
    description,
    date,
    time,
    templateMode,
    isLoading,
    setType,
    setName,
    setAmount,
    setSelectedCategory,
    setSelectedBudget,
    setSelectedAccount,
    setDescription,
    setDate,
    setTime,
    setTemplateMode,
    submit,
  } = useTransactionForm({ onSuccess: onSubmit });

  const handleSubmit = useCallback(async () => {
    await submit();
  }, [submit]);

  return (
    <ScrollView style={styles.content}>
      <View style={styles.headerRow}>
        <View style={styles.headerSpacer} />
        <TemplateToggle
          active={templateMode}
          onToggle={() => setTemplateMode(!templateMode)}
        />
      </View>

      <FormCard>
        <TypeSelector
          value={type}
          onChange={setType}
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
          onSelect={(category) => setSelectedCategory(category?.id || null, category?.name)}
        />
      </FormCard>

      {selectedCategory && !templateMode && (
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
        <NameInput
          value={name}
          onChange={setName}
          disabled={templateMode}
          placeholder={templateMode
            ? selectedCategoryName || '点击类别自动填充'
            : '输入交易名称'
          }
        />
      </FormCard>

      <FormCard>
        <DescriptionInput
          value={description}
          onChange={setDescription}
          templateMode={templateMode}
        />
      </FormCard>

      <SubmitButton
        onPress={handleSubmit}
        loading={isLoading}
      />
    </ScrollView>
  );
});

TransactionAdd.displayName = 'TransactionAdd';

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: theme.spacing.md,
  },
  headerSpacer: {
    flex: 1,
  },
});