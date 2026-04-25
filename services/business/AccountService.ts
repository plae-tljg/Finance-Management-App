import { AccountRepository } from '../database/repositories/AccountRepository';
import type { Account } from '../database/schemas/Account';
import { DatabaseService } from '../database/DatabaseService';

export function useAccountService(databaseService: DatabaseService) {
  const repository = new AccountRepository(databaseService);

  const getAccounts = async () => {
    return await repository.findAll();
  };

  const getActiveAccounts = async () => {
    return await repository.findActive();
  };

  const getAccountById = async (id: number) => {
    return await repository.findById(id);
  };

  const getAccountsByType = async (type: Account['type']) => {
    return await repository.findByType(type);
  };

  const createAccount = async (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => {
    return await repository.create(account);
  };

  const updateAccount = async (id: number, account: Partial<Account>) => {
    return await repository.update(id, account);
  };

  const deleteAccount = async (id: number) => {
    return await repository.delete(id);
  };

  const updateAccountBalance = async (id: number, balance: number) => {
    return await repository.updateBalance(id, balance);
  };

  const adjustAccountBalance = async (id: number, amount: number) => {
    return await repository.adjustBalance(id, amount);
  };

  return {
    getAccounts,
    getActiveAccounts,
    getAccountById,
    getAccountsByType,
    createAccount,
    updateAccount,
    deleteAccount,
    updateAccountBalance,
    adjustAccountBalance
  };
}