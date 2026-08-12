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
import type { Budget } from '@/services/database/schemas/Budget';

export interface EditableTransaction extends ExtractedTransaction {
  categoryId: number;
  accountId: number;
  budgetId: number | null;
  included: boolean;
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
  const [error, setError] = useState<string | null>(null);
  const [streamText, setStreamText] = useState('');

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
    setStreamText('');

    try {
      const provider = await getDefaultProvider();
      if (!provider) {
        throw new Error('未配置 AI 服务商，请先在设置中添加');
      }

      const categories = await categoryService.getActiveCategories();
      const accounts = await accountService.getAccounts();

      // Send all images in a single request with streaming
      const extracted = await extractTransactionsFromImages(
        provider,
        selectedImages,
        (_chunk, fullText) => {
          setStreamText(fullText);
        }
      );

      if (extracted.length === 0) {
        throw new Error('未能从图片中识别出任何交易记录');
      }

      // Resolve category, account, budget for each extracted transaction
      const editable: EditableTransaction[] = [];
      for (const t of extracted) {
        const categoryId = resolveCategoryId(t.categoryName, categories);
        const accountId = resolveAccountId(t.paymentMethod, accounts);
        const budgetId = await resolveBudgetId(budgetService, categoryId, t.date);

        editable.push({
          ...t,
          categoryId,
          accountId,
          budgetId,
          included: true,
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

  const importAll = useCallback(async (): Promise<number> => {
    setStep('importing');
    const included = extractedTransactions.filter(t => t.included);
    setImportProgress({ current: 0, total: included.length });

    let successCount = 0;
    for (let i = 0; i < included.length; i++) {
      const t = included[i];
      try {
        if (!t.budgetId) continue;
        const newTransaction = await transactionService.createTransaction({
          name: t.name,
          amount: t.amount,
          categoryId: t.categoryId,
          budgetId: t.budgetId,
          accountId: t.accountId,
          description: t.description || null,
          date: new Date(t.date).toISOString(),
          type: t.type,
        });

        if (newTransaction) {
          const adjustment = t.type === 'income' ? t.amount : -t.amount;
          await accountService.adjustAccountBalance(t.accountId, adjustment);
          successCount++;
        }
      } catch (err) {
        console.error(`导入交易失败: ${t.name}`, err);
      }
      setImportProgress({ current: i + 1, total: included.length });
    }

    setStep('done');
    return successCount;
  }, [extractedTransactions, transactionService, accountService]);

  const reset = useCallback(() => {
    setStep('select');
    setSelectedImages([]);
    setExtractedTransactions([]);
    setError(null);
    setStreamText('');
    setImportProgress({ current: 0, total: 0 });
  }, []);

  return {
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

async function resolveBudgetId(
  budgetService: ReturnType<typeof useBudgetService>,
  categoryId: number,
  dateStr: string
): Promise<number | null> {
  try {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const budgets = await budgetService.getBudgetsByCategoryAndMonth(categoryId, year, month);
    return budgets.length > 0 ? budgets[0].id : null;
  } catch {
    return null;
  }
}
