import { AccountMonthlyBalanceRepository } from '../database/repositories/AccountMonthlyBalanceRepository';
import { DatabaseServiceType } from '../database/DatabaseService';
import type { AccountMonthlyBalance } from '../database/schemas/AccountMonthlyBalance';
import { createServiceCache } from './serviceCache';

function createAccountMonthlyBalanceService(databaseService: DatabaseServiceType) {
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

  /**
   * Balances recorded for the month right before the given one. Used to seed
   * a new month: its opening balance is the previous month's closing balance.
   */
  const getPreviousMonthBalances = async (
    year: number,
    month: number,
  ): Promise<AccountMonthlyBalance[]> => {
    const previousMonth = month === 1 ? 12 : month - 1;
    const previousYear = month === 1 ? year - 1 : year;
    return await repository.findByYearMonth(previousYear, previousMonth);
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

  return {
    getAccountBalance,
    getAccountBalancesByAccount,
    getAllAccountBalances,
    getAccountBalancesByMonth,
    getAccountBalancesByYear,
    getPreviousMonthBalances,
    updateAccountBalance,
    upsertAccountBalance,
    deleteAccountBalance,
    getTotalBalanceByAccount,
    getMonthlyTotalBalances,
    getYearlyTotalBalances
  };
}

const accountMonthlyBalanceServiceCache = createServiceCache<
  ReturnType<typeof createAccountMonthlyBalanceService>
>();

export function useAccountMonthlyBalanceService(
  databaseService: DatabaseServiceType,
): ReturnType<typeof createAccountMonthlyBalanceService> {
  return accountMonthlyBalanceServiceCache(databaseService, () =>
    createAccountMonthlyBalanceService(databaseService),
  );
}