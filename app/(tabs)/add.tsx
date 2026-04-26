import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text } from '@/components/base/Text';
import { Card } from '@/components/base/Card';
import { PageTemplate } from '@/components/base/PageTemplate';
import { TransactionAdd } from '@/components/finance/transactions/TransactionAdd';
import { BudgetAdd } from '@/components/finance/budgets/BudgetAdd';
import { router } from 'expo-router';
import theme from '@/theme';

type AddType = 'transaction' | 'budget';

export default function AddScreen() {
  const [addType, setAddType] = useState<AddType>('transaction');

  const handleSubmit = () => {
    router.back();
  };

  return (
    <PageTemplate title="添加记录" showBack={false}>
      <View style={styles.typeSelector}>
        <TouchableOpacity
          style={[
            styles.typeButton,
            addType === 'transaction' && styles.activeTypeButton
          ]}
          onPress={() => setAddType('transaction')}
        >
          <Text style={[
            styles.typeButtonText,
            addType === 'transaction' && styles.activeTypeButtonText
          ]}>交易</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.typeButton,
            addType === 'budget' && styles.activeTypeButton
          ]}
          onPress={() => setAddType('budget')}
        >
          <Text style={[
            styles.typeButtonText,
            addType === 'budget' && styles.activeTypeButtonText
          ]}>预算</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {addType === 'transaction' ? (
            <TransactionAdd onSubmit={handleSubmit} />
          ) : (
            <BudgetAdd onSubmit={handleSubmit} />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </PageTemplate>
  );
}

const styles = StyleSheet.create({
  header: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: theme.spacing.sm,
  },
  typeSelector: {
    flexDirection: 'row',
    margin: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceDark,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
  },
  typeButton: {
    flex: 1,
    padding: theme.spacing.sm,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
  },
  activeTypeButton: {
    backgroundColor: theme.colors.primary,
  },
  typeButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  activeTypeButtonText: {
    color: theme.colors.white,
  },
});