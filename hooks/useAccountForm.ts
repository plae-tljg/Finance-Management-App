import { useState, useCallback } from 'react';
import { useAccountService } from '@/services/business/AccountService';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';
import type { Account } from '@/services/database/schemas/Account';

interface UseAccountFormOptions {
  account?: Account | null;
  onSuccess?: () => void;
}

interface UseAccountFormReturn {
  name: string;
  type: Account['type'];
  icon: string;
  color: string;
  balance: string;
  isActive: boolean;
  sortOrder: number;
  isLoading: boolean;
  setName: (name: string) => void;
  setType: (type: Account['type']) => void;
  setIcon: (icon: string) => void;
  setColor: (color: string) => void;
  setBalance: (balance: string) => void;
  setIsActive: (active: boolean) => void;
  setSortOrder: (order: number) => void;
  resetForm: () => void;
  submit: () => Promise<boolean>;
}

export function useAccountForm(options: UseAccountFormOptions = {}): UseAccountFormReturn {
  const { account, onSuccess } = options;
  const { isReady, databaseService } = useDatabaseSetup();
  const accountService = useAccountService(databaseService);

  const [name, setName] = useState(account?.name || '');
  const [type, setType] = useState<Account['type']>(account?.type || 'cash');
  const [icon, setIcon] = useState(account?.icon || '💵');
  const [color, setColor] = useState(account?.color || '#34C759');
  const [balance, setBalance] = useState(account?.balance.toString() || '0');
  const [isActive, setIsActive] = useState(account?.isActive ?? true);
  const [sortOrder, setSortOrder] = useState(account?.sortOrder || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setName('');
    setType('cash');
    setIcon('💵');
    setColor('#34C759');
    setBalance('0');
    setIsActive(true);
    setSortOrder(0);
  }, []);

  const submit = useCallback(async (): Promise<boolean> => {
    if (!accountService || !isReady) {
      console.error('账户服务未初始化');
      return false;
    }

    if (!name.trim()) {
      alert('请输入账户名称');
      return false;
    }

    setIsSubmitting(true);

    try {
      const accountData = {
        name: name.trim(),
        type,
        icon,
        color,
        balance: parseFloat(balance) || 0,
        isActive,
        sortOrder,
      };

      if (account?.id) {
        await accountService.updateAccount(account.id, accountData);
      } else {
        await accountService.createAccount(accountData);
      }

      onSuccess?.();
      return true;
    } catch (error) {
      console.error('保存账户失败:', error);
      alert('保存账户失败，请重试');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [accountService, isReady, account, name, type, icon, color, balance, isActive, sortOrder, onSuccess]);

  return {
    name,
    type,
    icon,
    color,
    balance,
    isActive,
    sortOrder,
    isLoading: isSubmitting,
    setName,
    setType,
    setIcon,
    setColor,
    setBalance,
    setIsActive,
    setSortOrder,
    resetForm,
    submit,
  };
}