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
    streamText,
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

  // Analyzing step - chat-like streaming
  if (step === 'analyzing') {
    return (
      <View style={styles.chatContainer}>
        <ScrollView style={styles.chatScroll} contentContainerStyle={styles.chatContent}>
          {/* User bubble with images */}
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

          {/* AI bubble with streaming response */}
          <View style={styles.chatRowAI}>
            <View style={styles.chatAvatarAI}>
              <Ionicons name="sparkles" size={16} color={theme.colors.white} />
            </View>
            <View style={styles.chatBubbleAI}>
              {streamText ? (
                <>
                  <Text style={styles.chatAIText} selectable>{streamText}</Text>
                  <ActivityIndicator size="small" color={theme.colors.primary} style={styles.chatTyping} />
                </>
              ) : (
                <View style={styles.chatThinking}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                  <Text style={styles.chatThinkingText}>正在思考...</Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Review step - table-like approval
  if (step === 'review') {
    return (
      <ScrollView style={styles.content}>
        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>
              识别到 {extractedTransactions.length} 笔交易
            </Text>
            <TouchableOpacity onPress={() => toggleAll(includedCount < extractedTransactions.length)}>
              <Text style={styles.selectAllText}>
                {includedCount === extractedTransactions.length ? '取消全选' : '全选'}
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Table header */}
        <View style={styles.tableHeader}>
          <View style={styles.checkCol}><Text style={styles.tableHeaderText}>✓</Text></View>
          <View style={styles.nameCol}><Text style={styles.tableHeaderText}>名称</Text></View>
          <View style={styles.amountCol}><Text style={styles.tableHeaderText}>金额</Text></View>
          <View style={styles.catCol}><Text style={styles.tableHeaderText}>分类</Text></View>
          <View style={styles.dateCol}><Text style={styles.tableHeaderText}>日期</Text></View>
        </View>

        {/* Table rows */}
        {extractedTransactions.map((t, i) => {
          const cat = categories.find(c => c.id === t.categoryId);
          const typeCategories = categories.filter(c => c.type === (t.type === 'income' ? 'income' : 'expense'));
          return (
            <View key={i} style={[styles.tableRow, !t.included && styles.tableRowExcluded]}>
              {/* Checkbox */}
              <TouchableOpacity style={styles.checkCol} onPress={() => toggleTransaction(i)}>
                <Ionicons
                  name={t.included ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={t.included ? theme.colors.primary : theme.colors.textTertiary}
                />
              </TouchableOpacity>

              {/* Name - editable */}
              <View style={styles.nameCol}>
                <TextInput
                  style={styles.tableInput}
                  value={t.name}
                  onChangeText={text => updateTransaction(i, { name: text })}
                />
              </View>

              {/* Amount - editable */}
              <View style={styles.amountCol}>
                <TextInput
                  style={[styles.tableInput, styles.amountInput]}
                  value={String(t.amount)}
                  onChangeText={text => updateTransaction(i, { amount: parseFloat(text) || 0 })}
                  keyboardType="decimal-pad"
                />
              </View>

              {/* Category - tap to cycle */}
              <TouchableOpacity
                style={styles.catCol}
                onPress={() => {
                  const idx = typeCategories.findIndex(c => c.id === t.categoryId);
                  const next = typeCategories[(idx + 1) % typeCategories.length];
                  updateTransaction(i, { categoryId: next.id });
                }}
              >
                <Text style={styles.catText}>{cat?.icon} {cat?.name}</Text>
              </TouchableOpacity>

              {/* Date */}
              <View style={styles.dateCol}>
                <TextInput
                  style={styles.tableInput}
                  value={t.date}
                  onChangeText={text => updateTransaction(i, { date: text })}
                />
              </View>

              {/* Type toggle */}
              <TouchableOpacity
                style={[styles.typeChip, t.type === 'income' ? styles.incomeChip : styles.expenseChip]}
                onPress={() => updateTransaction(i, { type: t.type === 'expense' ? 'income' : 'expense' })}
              >
                <Text style={styles.typeChipText}>{t.type === 'income' ? '收' : '支'}</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Budget warnings */}
        {extractedTransactions.filter(t => t.included && !t.budgetId).length > 0 && (
          <Card style={styles.warningCard}>
            <Ionicons name="warning" size={16} color={theme.colors.warning} />
            <Text style={styles.warningText}>
              部分交易未找到匹配预算，将跳过导入。请先在"预算"页面创建对应预算。
            </Text>
          </Card>
        )}

        {/* Extra details for each transaction */}
        <Card style={styles.detailSection}>
          <Text style={styles.detailSectionTitle}>详细信息</Text>
          {extractedTransactions.map((t, i) => (
            t.paymentMethod || t.description ? (
              <View key={i} style={styles.detailRow}>
                <Text style={styles.detailName} numberOfLines={1}>{t.name}</Text>
                {t.paymentMethod && <Text style={styles.detailMeta}>支付: {t.paymentMethod}</Text>}
                {t.description && <Text style={styles.detailMeta}>备注: {t.description}</Text>}
              </View>
            ) : null
          ))}
        </Card>

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
    return (
      <View style={styles.centerContent}>
        <Ionicons name="checkmark-circle" size={64} color={theme.colors.success} />
        <Text style={styles.doneText}>导入完成</Text>
        <Text style={styles.doneSubtext}>成功导入 {importProgress.current} 笔交易</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.primaryButton} onPress={reset}>
            <Text style={styles.primaryButtonText}>继续导入</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return null;
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

  // Chat-like analyzing UI
  chatContainer: {
    flex: 1,
    backgroundColor: theme.colors.surfaceDark,
  },
  chatScroll: {
    flex: 1,
  },
  chatContent: {
    padding: 12,
    paddingBottom: 20,
  },
  chatRowUser: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
    gap: 8,
  },
  chatRowAI: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 16,
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
  chatImageRow: {
    marginTop: 4,
  },
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
  chatAIText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    lineHeight: 20,
  },
  chatTyping: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  chatThinking: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatThinkingText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
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

  // Review table
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
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 8,
    backgroundColor: theme.colors.surfaceDark,
    borderTopLeftRadius: theme.borderRadius.sm,
    borderTopRightRadius: theme.borderRadius.sm,
  },
  tableHeaderText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.semibold,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
    backgroundColor: theme.colors.surface,
  },
  tableRowExcluded: {
    opacity: 0.4,
  },
  checkCol: {
    width: 30,
    alignItems: 'center',
  },
  nameCol: {
    flex: 3,
  },
  amountCol: {
    width: 70,
  },
  catCol: {
    width: 60,
    alignItems: 'center',
  },
  dateCol: {
    width: 80,
  },
  tableInput: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text,
    padding: 4,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: 4,
  },
  amountInput: {
    textAlign: 'right',
  },
  catText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text,
  },
  typeChip: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  incomeChip: {
    backgroundColor: theme.colors.income,
  },
  expenseChip: {
    backgroundColor: theme.colors.expense,
  },
  typeChipText: {
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: theme.fontWeight.bold,
  },

  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    margin: 8,
    backgroundColor: theme.colors.warning + '15',
  },
  warningText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.warning,
    flex: 1,
  },

  detailSection: {
    padding: 12,
    margin: 8,
  },
  detailSectionTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    marginBottom: 8,
  },
  detailRow: {
    marginBottom: 6,
  },
  detailName: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  detailMeta: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginLeft: 8,
  },

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
});
