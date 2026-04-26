import { useState, useCallback, useEffect } from 'react';
import { useTransactionService } from '@/services/business/TransactionService';
import { useBudgetService } from '@/services/business/BudgetService';
import { useAccountService } from '@/services/business/AccountService';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';
import type { Account } from '@/services/database/schemas/Account';

interface UseTransactionFormOptions {
  onSuccess?: () => void;
}

interface UseTransactionFormReturn {
  type: 'income' | 'expense';
  name: string;
  amount: string;
  selectedCategory: number | null;
  selectedCategoryName: string;
  selectedBudget: number | null;
  selectedAccount: number | null;
  description: string;
  date: Date;
  time: Date;
  templateMode: boolean;
  isLoading: boolean;
  accountList: Account[];
  setType: (type: 'income' | 'expense') => void;
  setName: (name: string) => void;
  setAmount: (amount: string) => void;
  setSelectedCategory: (id: number | null, name?: string) => void;
  setSelectedBudget: (id: number | null) => void;
  setSelectedAccount: (id: number | null) => void;
  setDescription: (description: string) => void;
  setDate: (date: Date) => void;
  setTime: (time: Date) => void;
  setTemplateMode: (mode: boolean) => void;
  resetForm: () => void;
  submit: () => Promise<boolean>;
}

export function useTransactionForm(options: UseTransactionFormOptions = {}): UseTransactionFormReturn {
  const { onSuccess } = options;
  const { isReady, databaseService } = useDatabaseSetup();
  const transactionService = useTransactionService(databaseService);
  const budgetService = useBudgetService(databaseService);
  const accountService = useAccountService(databaseService);

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategoryState] = useState<number | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState('');
  const [selectedBudget, setSelectedBudget] = useState<number | null>(null);
  const [selectedAccount, setSelectedAccountState] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [templateMode, setTemplateModeState] = useState(false);
  const [accountList, setAccountList] = useState<Account[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadAccounts = async () => {
      if (!accountService || !isReady) return;
      const accounts = await accountService.getAccounts();
      setAccountList(accounts);
      if (accounts.length > 0 && !selectedAccount) {
        const bankAccount = accounts.find(a => a.type === 'bank');
        setSelectedAccountState(bankAccount ? bankAccount.id : accounts[0].id);
      }
    };
    loadAccounts();
  }, [accountService, isReady, selectedAccount]);

  useEffect(() => {
    const loadBudgets = async () => {
      if (!budgetService || !isReady || !selectedCategory) {
        setSelectedBudget(null);
        return;
      }

      try {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const budgets = await budgetService.getBudgetsByCategoryAndMonth(
          selectedCategory,
          year,
          month
        );
        if (budgets.length > 0) {
          setSelectedBudget(budgets[0].id);
        } else {
          setSelectedBudget(null);
        }
      } catch (error) {
        console.error('加载预算失败:', error);
      }
    };

    loadBudgets();
  }, [budgetService, isReady, selectedCategory, date]);

  useEffect(() => {
    if (templateMode && selectedCategoryName) {
      setName(selectedCategoryName);
    }
  }, [templateMode, selectedCategoryName]);

  const setSelectedCategory = useCallback((id: number | null, catName = '') => {
    setSelectedCategoryState(id);
    setSelectedCategoryName(catName);
    setSelectedBudget(null);
    if (templateMode && catName) {
      setName(catName);
    }
  }, [templateMode]);

  const setSelectedAccount = useCallback((id: number | null) => {
    setSelectedAccountState(id);
  }, []);

  const setTemplateMode = useCallback((mode: boolean) => {
    if (!mode) {
      setTemplateModeState(false);
    } else {
      setTemplateModeState(true);
      setDescription('');
      setName(selectedCategoryName || '');
    }
  }, [selectedCategoryName]);

  const resetForm = useCallback(() => {
    setType('expense');
    setName('');
    setAmount('');
    setSelectedCategoryState(null);
    setSelectedCategoryName('');
    setSelectedBudget(null);
    setDescription('');
    setDate(new Date());
    setTime(new Date());
    setTemplateModeState(false);
  }, []);

  const submit = useCallback(async (): Promise<boolean> => {
    if (!transactionService || !isReady) {
      console.error('交易服务未初始化');
      return false;
    }

    if (!selectedCategory) {
      alert('请选择类别');
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

    if (!selectedBudget && !templateMode) {
      alert('请选择预算');
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

      const newTransaction = await transactionService.createTransaction({
        name: name.trim(),
        amount: parseFloat(amount),
        categoryId: selectedCategory,
        budgetId: selectedBudget!,
        accountId: selectedAccount!,
        description: description.trim() || null,
        date: transactionDate.toISOString(),
        type,
      });

      if (!newTransaction) {
        throw new Error('创建交易失败');
      }

      if (accountService) {
        const adjustment = type === 'income'
          ? parseFloat(amount)
          : -parseFloat(amount);
        await accountService.adjustAccountBalance(selectedAccount!, adjustment);
      }

      resetForm();
      onSuccess?.();
      return true;
    } catch (error) {
      console.error('创建交易失败:', error);
      alert('创建交易失败，请重试');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [transactionService, accountService, isReady, selectedCategory, name, amount, selectedBudget, templateMode, selectedAccount, description, date, time, type, onSuccess, resetForm]);

  return {
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
    isLoading: isSubmitting,
    accountList,
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
    resetForm,
    submit,
  };
}