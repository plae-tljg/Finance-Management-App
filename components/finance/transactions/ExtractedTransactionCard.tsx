import React, { memo } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Text } from '@/components/base/Text';
import { Card } from '@/components/base/Card';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/theme';
import type { EditableTransaction } from '@/hooks/useImageImport';
import type { Category } from '@/services/database/schemas/Category';
import type { Account } from '@/services/database/schemas/Account';

interface ExtractedTransactionCardProps {
  transaction: EditableTransaction;
  categories: Category[];
  accounts: Account[];
  onUpdate: (updates: Partial<EditableTransaction>) => void;
  onToggle: () => void;
}

export const ExtractedTransactionCard = memo(function ExtractedTransactionCard({
  transaction,
  categories,
  accounts,
  onUpdate,
  onToggle,
}: ExtractedTransactionCardProps) {
  const t = transaction;
  const selectedCategory = categories.find(c => c.id === t.categoryId);
  const selectedAccount = accounts.find(a => a.id === t.accountId);

  return (
    <Card style={[styles.card, !t.included && styles.cardExcluded]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onToggle} style={styles.checkbox}>
          <Ionicons
            name={t.included ? 'checkbox' : 'square-outline'}
            size={22}
            color={t.included ? theme.colors.primary : theme.colors.textTertiary}
          />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{t.name}</Text>
        <TouchableOpacity
          onPress={() => onUpdate({ type: t.type === 'expense' ? 'income' : 'expense' })}
          style={[styles.typeBadge, t.type === 'income' ? styles.incomeBadge : styles.expenseBadge]}
        >
          <Text style={styles.typeBadgeText}>
            {t.type === 'income' ? '收入' : '支出'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <View style={styles.field}>
          <Text style={styles.label}>金额</Text>
          <TextInput
            style={styles.input}
            value={String(t.amount)}
            onChangeText={text => onUpdate({ amount: parseFloat(text) || 0 })}
            keyboardType="decimal-pad"
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>日期</Text>
          <TextInput
            style={styles.input}
            value={t.date}
            onChangeText={text => onUpdate({ date: text })}
            placeholder="YYYY-MM-DD"
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.field}>
          <Text style={styles.label}>分类</Text>
          <View style={styles.categoryRow}>
            {categories.filter(c => c.type === (t.type === 'income' ? 'income' : 'expense')).map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  cat.id === t.categoryId && styles.categoryChipActive,
                ]}
                onPress={() => onUpdate({ categoryId: cat.id })}
              >
                <Text style={[
                  styles.categoryChipText,
                  cat.id === t.categoryId && styles.categoryChipTextActive,
                ]}>
                  {cat.icon} {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.field}>
          <Text style={styles.label}>账户</Text>
          <View style={styles.categoryRow}>
            {accounts.map(acc => (
              <TouchableOpacity
                key={acc.id}
                style={[
                  styles.categoryChip,
                  acc.id === t.accountId && styles.categoryChipActive,
                ]}
                onPress={() => onUpdate({ accountId: acc.id })}
              >
                <Text style={[
                  styles.categoryChipText,
                  acc.id === t.accountId && styles.categoryChipTextActive,
                ]}>
                  {acc.icon} {acc.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {t.paymentMethod ? (
        <Text style={styles.meta}>支付方式: {t.paymentMethod}</Text>
      ) : null}

      {!t.budgetId && (
        <View style={styles.warning}>
          <Ionicons name="warning" size={14} color={theme.colors.warning} />
          <Text style={styles.warningText}>未找到匹配预算，请先创建预算或手动选择</Text>
        </View>
      )}
    </Card>
  );
});

const styles = StyleSheet.create({
  card: {
    padding: 12,
    margin: 8,
    marginBottom: 4,
  },
  cardExcluded: {
    opacity: 0.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  checkbox: {
    padding: 2,
  },
  title: {
    flex: 1,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.sm,
  },
  incomeBadge: {
    backgroundColor: theme.colors.income,
  },
  expenseBadge: {
    backgroundColor: theme.colors.expense,
  },
  typeBadgeText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  field: {
    flex: 1,
  },
  label: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: 8,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  categoryChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '15',
  },
  categoryChipText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  categoryChipTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  meta: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textTertiary,
    marginTop: 4,
  },
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    padding: 6,
    backgroundColor: theme.colors.warning + '15',
    borderRadius: theme.borderRadius.sm,
  },
  warningText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.warning,
  },
});
