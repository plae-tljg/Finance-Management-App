import React, { useState, useEffect, memo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  TextInput,
} from 'react-native';
import { Text } from '@/components/base/Text';
import { Card } from '@/components/base/Card';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/theme';
import { useImageImport } from '@/hooks/useImageImport';
import { useCategoryService } from '@/services/business/CategoryService';
import { useAccountService } from '@/services/business/AccountService';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';
import type { Category } from '@/services/database/schemas/Category';
import type { Account } from '@/services/database/schemas/Account';

interface ImageImportProps {
  onSubmit: () => void;
}

export const ImageImport = memo(function ImageImport({ onSubmit }: ImageImportProps) {
  const { isReady, databaseService } = useDatabaseSetup();
  const categoryService = useCategoryService(databaseService);
  const accountService = useAccountService(databaseService);

  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  const {
    step,
    selectedImages,
    extractedTransactions,
    importProgress,
    importFailures,
    thinkingText,
    responseText,
    error,
    pickImages,
    analyzeImages,
    updateTransaction,
    toggleTransaction,
    toggleAll,
    importAll,
    reset,
  } = useImageImport({ onSuccess: onSubmit });

  useEffect(() => {
    if (!isReady) return;
    categoryService.getActiveCategories().then(setCategories);
    accountService.getAccounts().then(setAccounts);
  }, [isReady, categoryService, accountService]);

  const includedCount = extractedTransactions.filter(t => t.included).length;
  const noBudgetCount = extractedTransactions.filter(t => !t.budgetId).length;

  // Select step
  if (step === 'select') {
    return (
      <ScrollView style={styles.content}>
        <TouchableOpacity style={styles.pickButton} onPress={pickImages}>
          <Ionicons name="images-outline" size={32} color={theme.colors.primary} />
          <Text style={styles.pickButtonText}>选择账单截图</Text>
          <Text style={styles.pickButtonHint}>支持支付宝、微信支付等账单截图，可多选</Text>
        </TouchableOpacity>

        {selectedImages.length > 0 && (
          <Card style={styles.previewCard}>
            <Text style={styles.previewTitle}>已选择 {selectedImages.length} 张图片</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewScroll}>
              {selectedImages.map((uri, i) => (
                <Image key={i} source={{ uri }} style={styles.previewImage} />
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.analyzeButton} onPress={analyzeImages}>
              <Ionicons name="sparkles" size={18} color={theme.colors.white} />
              <Text style={styles.analyzeButtonText}>开始识别</Text>
            </TouchableOpacity>
          </Card>
        )}

        {error && (
          <Card style={styles.errorCard}>
            <Ionicons name="alert-circle" size={18} color={theme.colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        )}
      </ScrollView>
    );
  }

  // Analyzing step - chat with thinking + response
  if (step === 'analyzing') {
    return (
      <View style={styles.chatContainer}>
        <ScrollView style={styles.chatScroll} contentContainerStyle={styles.chatContent}>
          {/* User bubble */}
          <View style={styles.chatRowUser}>
            <View style={styles.chatBubbleUser}>
              <Text style={styles.chatBubbleUserText}>请识别这些账单截图中的交易记录</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chatImageRow}>
                {selectedImages.map((uri, i) => (
                  <Image key={i} source={{ uri }} style={styles.chatImage} />
                ))}
              </ScrollView>
            </View>
            <View style={styles.chatAvatarUser}>
              <Ionicons name="person" size={16} color={theme.colors.white} />
            </View>
          </View>

          {/* AI thinking bubble */}
          {thinkingText && (
            <View style={styles.chatRowAI}>
              <View style={styles.chatAvatarAI}>
                <Ionicons name="sparkles" size={16} color={theme.colors.white} />
              </View>
              <View style={styles.chatThinkingBubble}>
                <View style={styles.thinkingLabel}>
                  <Ionicons name="bulb-outline" size={12} color={theme.colors.textSecondary} />
                  <Text style={styles.thinkingLabelText}>思考中</Text>
                </View>
                <Text style={styles.chatThinkingText} numberOfLines={3} ellipsizeMode="tail">
                  {thinkingText}
                </Text>
              </View>
            </View>
          )}

          {/* AI response bubble */}
          {(responseText || (!thinkingText && !responseText)) && (
            <View style={styles.chatRowAI}>
              <View style={styles.chatAvatarAI}>
                <Ionicons name="sparkles" size={16} color={theme.colors.white} />
              </View>
              <View style={styles.chatBubbleAI}>
                {responseText ? (
                  <Text style={styles.chatAIText} selectable>{responseText}</Text>
                ) : (
                  <View style={styles.chatWaiting}>
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                    <Text style={styles.chatWaitingText}>等待 AI 响应...</Text>
                  </View>
                )}
                {thinkingText && !responseText && (
                  <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginTop: 6 }} />
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  // Review step - card-based
  if (step === 'review') {
    return (
      <ScrollView style={styles.content}>
        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>
              识别到 {extractedTransactions.length} 笔交易，已选 {includedCount}
            </Text>
            <TouchableOpacity onPress={() => toggleAll(includedCount < extractedTransactions.length)}>
              <Text style={styles.selectAllText}>
                {includedCount === extractedTransactions.length ? '取消全选' : '全选'}
              </Text>
            </TouchableOpacity>
          </View>
          {noBudgetCount > 0 && (
            <View style={styles.budgetWarning}>
              <Ionicons name="warning" size={14} color={theme.colors.warning} />
              <Text style={styles.budgetWarningText}>
                {noBudgetCount} 笔无匹配预算的交易已自动取消选中，请在预算页面创建对应预算后再导入
              </Text>
            </View>
          )}
        </Card>

        {/* Transaction cards */}
        {extractedTransactions.map((t, i) => (
          <TransactionCard
            key={i}
            transaction={t}
            categories={categories}
            accounts={accounts}
            onUpdate={updates => updateTransaction(i, updates)}
            onToggle={() => toggleTransaction(i)}
          />
        ))}

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.secondaryButton} onPress={reset}>
            <Text style={styles.secondaryButtonText}>重新选择</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryButton, includedCount === 0 && styles.disabledButton]}
            onPress={() => importAll()}
            disabled={includedCount === 0}
          >
            <Text style={styles.primaryButtonText}>导入选中 ({includedCount})</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // Importing step
  if (step === 'importing') {
    return (
      <View style={styles.centerContent}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.analyzingText}>导入中...</Text>
        <Text style={styles.analyzingSubtext}>
          {importProgress.current}/{importProgress.total}
        </Text>
      </View>
    );
  }

  // Done step
  if (step === 'done') {
    const successCount = importProgress.current - importFailures.length;
    return (
      <ScrollView style={styles.content}>
        <View style={styles.doneContainer}>
          <Ionicons name="checkmark-circle" size={64} color={theme.colors.success} />
          <Text style={styles.doneText}>导入完成</Text>
          <Text style={styles.doneSubtext}>成功 {successCount} 笔，失败 {importFailures.length} 笔</Text>
        </View>

        {importFailures.length > 0 && (
          <Card style={styles.failuresCard}>
            <Text style={styles.failuresTitle}>失败明细</Text>
            {importFailures.map((f, i) => (
              <View key={i} style={styles.failureRow}>
                <Ionicons name="close-circle" size={14} color={theme.colors.danger} />
                <Text style={styles.failureText}>{f}</Text>
              </View>
            ))}
          </Card>
        )}

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.primaryButton} onPress={reset}>
            <Text style={styles.primaryButtonText}>继续导入</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return null;
});

// Transaction card component - one per row
interface TransactionCardProps {
  transaction: any;
  categories: Category[];
  accounts: Account[];
  onUpdate: (updates: any) => void;
  onToggle: () => void;
}

const TransactionCard = memo(function TransactionCard({
  transaction,
  categories,
  accounts,
  onUpdate,
  onToggle,
}: TransactionCardProps) {
  const t = transaction;
  const selectedCategory = categories.find(c => c.id === t.categoryId);
  const selectedAccount = accounts.find(a => a.id === t.accountId);
  const typeCategories = categories.filter(c => c.type === (t.type === 'income' ? 'income' : 'expense'));

  return (
    <Card style={[styles.txCard, !t.included && styles.txCardExcluded]}>
      {/* Header: checkbox + type badge */}
      <View style={styles.txCardHeader}>
        <TouchableOpacity onPress={onToggle} style={styles.txCheckbox}>
          <Ionicons
            name={t.included ? 'checkbox' : 'square-outline'}
            size={22}
            color={t.included ? theme.colors.primary : theme.colors.textTertiary}
          />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          onPress={() => onUpdate({ type: t.type === 'expense' ? 'income' : 'expense' })}
          style={[styles.txTypeBadge, t.type === 'income' ? styles.txIncomeBadge : styles.txExpenseBadge]}
        >
          <Text style={styles.txTypeBadgeText}>{t.type === 'income' ? '收入' : '支出'}</Text>
        </TouchableOpacity>
      </View>

      {/* Name - editable, full width */}
      <TextInput
        style={styles.txNameInput}
        value={t.name}
        onChangeText={text => onUpdate({ name: text })}
        placeholder="交易名称"
      />

      {/* Amount - large */}
      <View style={styles.txAmountRow}>
        <Text style={styles.txCurrencySign}>$</Text>
        <TextInput
          style={styles.txAmountInput}
          value={String(t.amount)}
          onChangeText={text => onUpdate({ amount: parseFloat(text) || 0 })}
          keyboardType="decimal-pad"
        />
      </View>

      {/* Date and Time */}
      <View style={styles.txRow}>
        <View style={styles.txField}>
          <Text style={styles.txFieldLabel}>日期</Text>
          <TextInput
            style={styles.txFieldInput}
            value={t.date}
            onChangeText={text => onUpdate({ date: text })}
            placeholder="YYYY-MM-DD"
          />
        </View>
        <View style={styles.txField}>
          <Text style={styles.txFieldLabel}>时间</Text>
          <TextInput
            style={styles.txFieldInput}
            value={t.time || ''}
            onChangeText={text => onUpdate({ time: text })}
            placeholder="HH:MM"
          />
        </View>
      </View>

      {/* Category - tap to cycle */}
      <View style={styles.txField}>
        <Text style={styles.txFieldLabel}>分类</Text>
        <View style={styles.txChipRow}>
          {typeCategories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.txChip, cat.id === t.categoryId && styles.txChipActive]}
              onPress={() => onUpdate({ categoryId: cat.id })}
            >
              <Text style={[styles.txChipText, cat.id === t.categoryId && styles.txChipTextActive]}>
                {cat.icon} {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Account - tap to select */}
      <View style={styles.txField}>
        <Text style={styles.txFieldLabel}>账户</Text>
        <View style={styles.txChipRow}>
          {accounts.map(acc => (
            <TouchableOpacity
              key={acc.id}
              style={[styles.txChip, acc.id === t.accountId && styles.txChipActive]}
              onPress={() => onUpdate({ accountId: acc.id })}
            >
              <Text style={[styles.txChipText, acc.id === t.accountId && styles.txChipTextActive]}>
                {acc.icon} {acc.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Budget warning */}
      {!t.budgetId && (
        <View style={styles.txWarning}>
          <Ionicons name="warning" size={12} color={theme.colors.warning} />
          <Text style={styles.txWarningText}>未找到匹配预算</Text>
        </View>
      )}

      {/* Optional metadata */}
      {(t.paymentMethod || t.description) && (
        <View style={styles.txMeta}>
          {t.paymentMethod && <Text style={styles.txMetaText}>支付: {t.paymentMethod}</Text>}
          {t.description && <Text style={styles.txMetaText}>备注: {t.description}</Text>}
        </View>
      )}
    </Card>
  );
});

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    gap: 12,
  },
  pickButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
    backgroundColor: theme.colors.primary + '08',
    margin: 8,
  },
  pickButtonText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
    marginTop: 8,
  },
  pickButtonHint: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  previewCard: {
    padding: 12,
    margin: 8,
  },
  previewTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    marginBottom: 8,
  },
  previewScroll: {
    marginBottom: 12,
  },
  previewImage: {
    width: 80,
    height: 120,
    borderRadius: theme.borderRadius.sm,
    marginRight: 8,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.sm,
  },
  analyzeButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    margin: 8,
    backgroundColor: theme.colors.danger + '10',
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: theme.fontSize.sm,
    flex: 1,
  },

  // Chat UI
  chatContainer: {
    flex: 1,
    backgroundColor: theme.colors.surfaceDark,
  },
  chatScroll: { flex: 1 },
  chatContent: { padding: 12, paddingBottom: 20 },
  chatRowUser: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
    gap: 8,
  },
  chatRowAI: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  chatAvatarUser: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatAvatarAI: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatBubbleUser: {
    maxWidth: '75%',
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    borderTopRightRadius: 4,
    padding: 12,
  },
  chatBubbleUserText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.sm,
    marginBottom: 8,
  },
  chatImageRow: { marginTop: 4 },
  chatImage: {
    width: 60,
    height: 90,
    borderRadius: 8,
    marginRight: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  chatBubbleAI: {
    maxWidth: '80%',
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 12,
    minHeight: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  chatThinkingBubble: {
    maxWidth: '80%',
    backgroundColor: theme.colors.surfaceDark,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.textTertiary,
  },
  thinkingLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  thinkingLabelText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  chatThinkingText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  chatAIText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    lineHeight: 20,
    fontFamily: 'monospace',
  },
  chatWaiting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatWaitingText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },

  // Summary card
  summaryCard: {
    padding: 12,
    margin: 8,
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  selectAllText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  budgetWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 8,
    padding: 8,
    backgroundColor: theme.colors.warning + '15',
    borderRadius: theme.borderRadius.sm,
  },
  budgetWarningText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.warning,
    flex: 1,
    lineHeight: 16,
  },

  // Transaction card
  txCard: {
    padding: 12,
    margin: 8,
    marginBottom: 4,
  },
  txCardExcluded: {
    opacity: 0.5,
  },
  txCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  txCheckbox: {
    padding: 2,
  },
  txTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.sm,
  },
  txIncomeBadge: {
    backgroundColor: theme.colors.income,
  },
  txExpenseBadge: {
    backgroundColor: theme.colors.expense,
  },
  txTypeBadgeText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
  },
  txNameInput: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    padding: 8,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: theme.borderRadius.sm,
    marginBottom: 8,
  },
  txAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  txCurrencySign: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.textSecondary,
    marginRight: 4,
  },
  txAmountInput: {
    flex: 1,
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    padding: 4,
  },
  txRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  txField: {
    flex: 1,
    marginBottom: 8,
  },
  txFieldLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  txFieldInput: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    padding: 6,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: theme.borderRadius.sm,
  },
  txChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  txChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  txChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '15',
  },
  txChipText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  txChipTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  txWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 4,
  },
  txWarningText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.warning,
  },
  txMeta: {
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  txMetaText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textTertiary,
    marginTop: 2,
  },

  // Done screen
  doneContainer: {
    alignItems: 'center',
    padding: 32,
    gap: 8,
  },
  doneText: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginTop: 8,
  },
  doneSubtext: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  failuresCard: {
    padding: 12,
    margin: 8,
    backgroundColor: theme.colors.danger + '10',
  },
  failuresTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.danger,
    marginBottom: 8,
  },
  failureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 4,
  },
  failureText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text,
    flex: 1,
  },

  // Action buttons
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    padding: 8,
    marginTop: 8,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: theme.colors.surfaceDark,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
  },
  disabledButton: {
    opacity: 0.5,
  },
  analyzingText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  analyzingSubtext: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
});
