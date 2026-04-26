import { useState, useCallback, useEffect, useMemo } from 'react';
import { useTransactionService } from '@/services/business/TransactionService';
import { useBudgetService } from '@/services/business/BudgetService';
import { useAccountService } from '@/services/business/AccountService';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';
import type { Transaction } from '@/services/database/schemas/Transaction';
import type { Account } from '@/services/database/schemas/Account';

interface UseTransactionEditFormOptions {
  transaction: Transaction;
  onSuccess?: () => void;
}

interface UseTransactionEditFormReturn {
  name: string;
  description: string;
  amount: string;
  selectedCategory: number | null;
  selectedBudget: number | null;
  selectedAccount: number | null;
  type: 'income' | 'expense';
  date: Date;
  time: Date;
  isLoading: boolean;
  accountList: Account[];
  setName: (name: string) => void;
  setDescription: (description: string) => void;
  setAmount: (amount: string) => void;
  setSelectedCategory: (id: number | null) => void;
  setSelectedBudget: (id: number | null) => void;
  setSelectedAccount: (id: number | null) => void;
  setType: (type: 'income' | 'expense') => void;
  setDate: (date: Date) => void;
  setTime: (time: Date) => void;
  submit: () => Promise<boolean>;
}

export function useTransactionEditForm(
  options: UseTransactionEditFormOptions
): UseTransactionEditFormReturn {
  const { transaction, onSuccess } = options;
  const { databaseService } = useDatabaseSetup();
  const transactionService = useTransactionService(databaseService);
  const budgetService = useBudgetService(databaseService);
  const accountService = useAccountService(databaseService);

  const txDate = new Date(transaction.date);

  const [name, setName] = useState(transaction.name);
  const [description, setDescription] = useState(transaction.description || '');
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [selectedCategory, setSelectedCategory] = useState<number | null>(transaction.categoryId);
  const [selectedBudget, setSelectedBudget] = useState<number | null>(transaction.budgetId || null);
  const [selectedAccount, setSelectedAccount] = useState<number | null>(transaction.accountId);
  const [type, setType] = useState<'income' | 'expense'>(transaction.type);
  const [date, setDate] = useState(txDate);
  const [time, setTime] = useState(txDate);
  const [accountList, setAccountList] = useState<Account[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadAccounts = async () => {
      if (accountService) {
        const accounts = await accountService.getAccounts();
        setAccountList(accounts);
      }
    };
    loadAccounts();
  }, [accountService]);

  const handleSetSelectedCategory = useCallback((id: number | null) => {
    setSelectedCategory(id);
    setSelectedBudget(null);
  }, []);

  const handleSetAmount = useCallback((value: string) => {
    setAmount(value);
  }, []);

  const submit = useCallback(async (): Promise<boolean> => {
    if (!transactionService) {
      console.error('交易服务未初始化');
      return false;
    }

    if (!name.trim()) {
      alert('请输入交易名称');
      return false;
    }

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      alert('请输入有效金额');
      return false;
    }

    if (!selectedCategory) {
      alert('请选择类别');
      return false;
    }

    if (!selectedAccount) {
      alert('请选择账户');
      return false;
    }

    setIsSubmitting(true);

    try {
      const transactionDate = new Date(date);
      transactionDate.setHours(
        time.getHours(),
        time.getMinutes(),
        time.getSeconds()
      );

      const updatedTransaction = {
        ...transaction,
        name: name.trim(),
        description: description.trim() || null,
        amount: parseFloat(amount),
        categoryId: selectedCategory,
        budgetId: selectedBudget || 0,
        accountId: selectedAccount,
        type,
        date: transactionDate.toISOString(),
      };

      const success = await transactionService.updateTransaction(updatedTransaction.id, updatedTransaction);
      if (success) {
        onSuccess?.();
        return true;
      } else {
        throw new Error('更新交易失败');
      }
    } catch (error) {
      console.error('更新交易失败:', error);
      alert('更新交易失败，请重试');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [transactionService, name, amount, selectedCategory, selectedBudget, selectedAccount, type, date, time, transaction, onSuccess]);

  return {
    name,
    description,
    amount,
    selectedCategory,
    selectedBudget,
    selectedAccount,
    type,
    date,
    time,
    isLoading: isSubmitting,
    accountList,
    setName,
    setDescription,
    setAmount: handleSetAmount,
    setSelectedCategory: handleSetSelectedCategory,
    setSelectedBudget,
    setSelectedAccount,
    setType,
    setDate,
    setTime,
    submit,
  };
}