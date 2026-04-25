import { AccountMonthlyBalanceRepository } from '../database/repositories/AccountMonthlyBalanceRepository';
import { DatabaseService } from '../database/DatabaseService';
import type { AccountMonthlyBalance } from '../database/schemas/AccountMonthlyBalance';

export function useAccountMonthlyBalanceService(databaseService: DatabaseService) {
  const repository = new AccountMonthlyBalanceRepository(databaseService);

  const getAccountBalance = async (
    accountId: number,
    year: number,
    month: number
  ): Promise<AccountMonthlyBalance | null> => {
    return await repository.findByAccountYearMonth(accountId, year, month);
  };

  const getAccountBalancesByAccount = async (accountId: number): Promise<AccountMonthlyBalance[]> => {
    return await repository.findByAccount(accountId);
  };

  const getAllAccountBalances = async (): Promise<AccountMonthlyBalance[]> => {
    return await repository.findAll();
  };

  const getAccountBalancesByMonth = async (year: number, month: number): Promise<AccountMonthlyBalance[]> => {
    return await repository.findByYearMonth(year, month);
  };

  const getAccountBalancesByYear = async (year: number): Promise<AccountMonthlyBalance[]> => {
    return await repository.findByYear(year);
  };

  const updateAccountBalance = async (
    id: number,
    balance: Partial<AccountMonthlyBalance>
  ): Promise<boolean> => {
    return await repository.update(id, balance);
  };

  const upsertAccountBalance = async (
    accountId: number,
    year: number,
    month: number,
    opening: number,
    closing: number
  ): Promise<void> => {
    await repository.upsert(accountId, year, month, opening, closing);
  };

  const deleteAccountBalance = async (id: number): Promise<boolean> => {
    return await repository.delete(id);
  };

  const getTotalBalanceByAccount = async (accountId: number): Promise<number> => {
    const balances = await repository.findByAccount(accountId);
    return balances.reduce((sum, b) => sum + b.openingBalance, 0);
  };

  const getMonthlyTotalBalances = async (year: number, month: number): Promise<{ openingBalance: number; closingBalance: number }> => {
    const balances = await repository.findByYearMonth(year, month);
    return balances.reduce(
      (acc, b) => ({
        openingBalance: acc.openingBalance + b.openingBalance,
        closingBalance: acc.closingBalance + b.closingBalance
      }),
      { openingBalance: 0, closingBalance: 0 }
    );
  };

  const getYearlyTotalBalances = async (year: number): Promise<{ openingBalance: number; closingBalance: number }> => {
    const balances = await repository.findByYear(year);
    return balances.reduce(
      (acc, b) => ({
        openingBalance: acc.openingBalance + b.openingBalance,
        closingBalance: acc.closingBalance + b.closingBalance
      }),
      { openingBalance: 0, closingBalance: 0 }
    );
  };

  const initializeYearForAccount = async (accountId: number, year: number): Promise<void> => {
    const currentMonth = new Date().getMonth() + 1;
    const existingBalance = await repository.findByAccountYearMonth(accountId, year, currentMonth);

    if (!existingBalance) {
      let previousMonth = currentMonth - 1;
      let previousYear = year;
      if (previousMonth === 0) {
        previousMonth = 12;
        previousYear = year - 1;
      }

      const previousBalance = await repository.findByAccountYearMonth(accountId, previousYear, previousMonth);
      const openingBalance = previousBalance?.closingBalance || 0;

      await repository.create({
        accountId,
        year,
        month: currentMonth,
        openingBalance,
        closingBalance: openingBalance
      });
    }
  };

  return {
    getAccountBalance,
    getAccountBalancesByAccount,
    getAllAccountBalances,
    getAccountBalancesByMonth,
    getAccountBalancesByYear,
    updateAccountBalance,
    upsertAccountBalance,
    deleteAccountBalance,
    getTotalBalanceByAccount,
    getMonthlyTotalBalances,
    getYearlyTotalBalances,
    initializeYearForAccount
  };
}