import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useTransactionService } from '@/services/business/TransactionService';
import { useBudgetService } from '@/services/business/BudgetService';
import { useAccountService } from '@/services/business/AccountService';
import { useCategoryService } from '@/services/business/CategoryService';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';
import { getDefaultProvider } from '@/utils/aiStorage';
import { extractTransactionsFromImages, ExtractedTransaction } from '@/services/business/AIService';
import type { Category } from '@/services/database/schemas/Category';
import type { Account } from '@/services/database/schemas/Account';

export interface EditableTransaction extends ExtractedTransaction {
  categoryId: number;
  accountId: number;
  budgetId: number | null;
  budgetName?: string;
  included: boolean;
  importError?: string;
}

export type ImportStep = 'select' | 'analyzing' | 'review' | 'importing' | 'done';

export function useImageImport(options: { onSuccess?: () => void } = {}) {
  const { onSuccess } = options;
  const { isReady, databaseService } = useDatabaseSetup();
  const transactionService = useTransactionService(databaseService);
  const budgetService = useBudgetService(databaseService);
  const accountService = useAccountService(databaseService);
  const categoryService = useCategoryService(databaseService);

  const [step, setStep] = useState<ImportStep>('select');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [extractedTransactions, setExtractedTransactions] = useState<EditableTransaction[]>([]);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importFailures, setImportFailures] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [thinkingText, setThinkingText] = useState('');
  const [responseText, setResponseText] = useState('');

  const pickImages = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setSelectedImages(result.assets.map(a => a.uri));
      setError(null);
    }
  }, []);

  const analyzeImages = useCallback(async () => {
    if (selectedImages.length === 0) return;

    setStep('analyzing');
    setError(null);
    setThinkingText('');
    setResponseText('');

    try {
      const provider = await getDefaultProvider();
      if (!provider) {
        throw new Error('未配置 AI 服务商，请先在设置中添加');
      }

      const categories = await categoryService.getActiveCategories();
      const accounts = await accountService.getAccounts();

      const extracted = await extractTransactionsFromImages(
        provider,
        selectedImages,
        (type, _chunk, fullText) => {
          if (type === 'thinking') {
            setThinkingText(fullText);
          } else {
            setResponseText(fullText);
          }
        }
      );

      if (extracted.length === 0) {
        throw new Error('未能从图片中识别出任何交易记录');
      }

      // Sort by date+time descending (newest first)
      const sorted = [...extracted].sort((a, b) => {
        const dateA = `${a.date} ${a.time || '00:00'}`;
        const dateB = `${b.date} ${b.time || '00:00'}`;
        return dateB.localeCompare(dateA);
      });

      // Resolve category, account, budget for each extracted transaction
      const editable: EditableTransaction[] = [];
      for (const t of sorted) {
        const categoryId = resolveCategoryId(t.categoryName, categories);
        const accountId = resolveAccountId(t.paymentMethod, accounts);
        const budgetResult = await resolveBudget(budgetService, categoryId, t.date);

        editable.push({
          ...t,
          categoryId,
          accountId,
          budgetId: budgetResult?.id ?? null,
          budgetName: budgetResult?.name,
          included: budgetResult != null, // Only include if budget exists
        });
      }

      setExtractedTransactions(editable);
      setStep('review');
    } catch (err: any) {
      setError(err.message || '识别失败');
      setStep('select');
    }
  }, [selectedImages, categoryService, accountService, budgetService]);

  const updateTransaction = useCallback((index: number, updates: Partial<EditableTransaction>) => {
    setExtractedTransactions(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  }, []);

  const toggleTransaction = useCallback((index: number) => {
    setExtractedTransactions(prev => {
      const next = [...prev];
      next[index] = { ...next[index], included: !next[index].included };
      return next;
    });
  }, []);

  const toggleAll = useCallback((included: boolean) => {
    setExtractedTransactions(prev => prev.map(t => ({ ...t, included })));
  }, []);

  const importAll = useCallback(async (): Promise<{ success: number; failed: string[] }> => {
    setStep('importing');
    const included = extractedTransactions.filter(t => t.included);
    setImportProgress({ current: 0, total: included.length });
    setImportFailures([]);

    let successCount = 0;
    const failures: string[] = [];

    for (let i = 0; i < included.length; i++) {
      const t = included[i];
      try {
        // Need a budget to import
        if (!t.budgetId) {
          failures.push(`${t.name} (${t.date}): 未找到匹配预算`);
          setImportFailures([...failures]);
          setImportProgress({ current: i + 1, total: included.length });
          continue;
        }

        // Parse date with time
        let transactionDate: Date;
        if (t.time) {
          transactionDate = new Date(`${t.date}T${t.time}:00`);
        } else {
          transactionDate = new Date(`${t.date}T12:00:00`);
        }

        const newTransaction = await transactionService.createTransaction({
          name: t.name,
          amount: t.amount,
          categoryId: t.categoryId,
          budgetId: t.budgetId,
          accountId: t.accountId,
          description: t.description || null,
          date: transactionDate.toISOString(),
          type: t.type,
        });

        if (newTransaction) {
          const adjustment = t.type === 'income' ? t.amount : -t.amount;
          await accountService.adjustAccountBalance(t.accountId, adjustment);
          successCount++;
        } else {
          failures.push(`${t.name}: 创建失败`);
        }
      } catch (err: any) {
        console.error(`导入交易失败: ${t.name}`, err);
        failures.push(`${t.name}: ${err.message || '未知错误'}`);
      }
      setImportFailures([...failures]);
      setImportProgress({ current: i + 1, total: included.length });
    }

    setStep('done');
    return { success: successCount, failed: failures };
  }, [extractedTransactions, transactionService, accountService]);

  const reset = useCallback(() => {
    setStep('select');
    setSelectedImages([]);
    setExtractedTransactions([]);
    setError(null);
    setThinkingText('');
    setResponseText('');
    setImportProgress({ current: 0, total: 0 });
    setImportFailures([]);
  }, []);

  return {
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
  };
}

function resolveCategoryId(categoryName: string, categories: Category[]): number {
  const match = categories.find(c => c.name === categoryName);
  if (match) return match.id;
  const fallback = categories.find(c => c.type === 'expense');
  return fallback?.id ?? 1;
}

function resolveAccountId(paymentMethod: string | undefined, accounts: Account[]): number {
  if (paymentMethod?.includes('支付宝') || paymentMethod?.includes('微信')) {
    const wallet = accounts.find(a => a.type === 'digital_wallet');
    return wallet?.id ?? accounts[0]?.id ?? 1;
  }
  return accounts[0]?.id ?? 1;
}

async function resolveBudget(
  budgetService: ReturnType<typeof useBudgetService>,
  categoryId: number,
  dateStr: string
): Promise<{ id: number; name: string } | null> {
  try {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const budgets = await budgetService.getBudgetsByCategoryAndMonth(categoryId, year, month);
    if (budgets.length > 0) {
      return { id: budgets[0].id, name: budgets[0].name };
    }
    return null;
  } catch {
    return null;
  }
}
