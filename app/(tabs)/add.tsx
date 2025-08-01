import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text } from '@/components/base/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TransactionForm } from '@/components/finance/transactions/TransactionAdd';
import { BudgetForm } from '@/components/finance/budgets/BudgetAdd';
import { router } from 'expo-router';

type AddType = 'transaction' | 'budget';

export default function AddScreen() {
  const [addType, setAddType] = useState<AddType>('transaction');

  const handleSubmit = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>添加记录</Text>
      </View>
      
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 8,
  },
  typeSelector: {
    flexDirection: 'row',
    margin: 8,
    backgroundColor: '#fff',
    borderRadius: 6,
    overflow: 'hidden',
  },
  typeButton: {
    flex: 1,
    padding: 8,
    alignItems: 'center',
    borderRadius: 4,
  },
  activeTypeButton: {
    backgroundColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#666',
  },
  activeTypeButtonText: {
    color: '#fff',
  },
});