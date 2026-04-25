import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text } from '@/components/base/Text';
import { Card } from '@/components/base/Card';
import { HeaderCard } from '@/components/base/HeaderCard';
import { BackgroundImage } from '@/components/base/BackgroundImage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TransactionForm } from '@/components/finance/transactions/TransactionAdd';
import { BudgetForm } from '@/components/finance/budgets/BudgetAdd';
import { router } from 'expo-router';
import theme from '@/theme';

type AddType = 'transaction' | 'budget';

export default function AddScreen() {
  const [addType, setAddType] = useState<AddType>('transaction');

  const handleSubmit = () => {
    router.back();
  };

  return (
    <BackgroundImage blurTint="light" overlayOpacity={0.05}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <HeaderCard title="添加记录" showBack={false} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
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

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {addType === 'transaction' ? (
              <TransactionForm onSubmit={handleSubmit} />
            ) : (
              <BudgetForm onSubmit={handleSubmit} />
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </BackgroundImage>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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