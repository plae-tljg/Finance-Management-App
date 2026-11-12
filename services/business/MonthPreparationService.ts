import { BudgetRepository } from '../database/repositories/BudgetRepository';
import { BudgetDefaultRepository } from '../database/repositories/BudgetDefaultRepository';
import { AccountRepository } from '../database/repositories/AccountRepository';
import { AccountMonthlyBalanceRepository } from '../database/repositories/AccountMonthlyBalanceRepository';
import { DatabaseServiceType } from '../database/DatabaseService';
import { createServiceCache } from './serviceCache';

export interface MonthPreparationStatus {
  year: number;
  month: number;
  /** e.g. "2026年12月" */
  monthLabel: string;
  /** Budgets already created for this month. */
  budgetCount: number;
  /**
   * How many budgets this month is expected to have, based on the saved
   * per-category defaults plus whatever existed last month. Used to tell
   * "you have no budgets at all" apart from "one category is missing".
   */
  expectedBudgetCount: number;
  /** Active accounts. */
  totalAccounts: number;
  /** Accounts that already have a monthly balance row for this month. */
  accountsWithBalance: number;
  missingBudgets: boolean;
  missingBalances: boolean;
  /** Nothing left to prepare for this month. */
  isComplete: boolean;
}

export interface PrepareMonthResult {
  budgetsCreated: number;
  balancesCreated: number;
  /** Active accounts that were left alone (already had a row). */
  accountsSkipped: number;
  /** Human readable summary for the confirmation dialog. */
  summary: string;
}

function monthKey(year: number, month: number): string {
  return `${year}-${month.toString().padStart(2, '0')}`;
}

function previousMonth(year: number, month: number): { year: number; month: number } {
  return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
}

function createMonthPreparationService(databaseService: DatabaseServiceType) {
  const budgetRepository = new BudgetRepository(databaseService);
  const budgetDefaultRepository = new BudgetDefaultRepository(databaseService);
  const accountRepository = new AccountRepository(databaseService);
  const balanceRepository = new AccountMonthlyBalanceRepository(databaseService);

  /**
   * What still has to be done before this month is ready to use.
   */
  const getStatus = async (year: number, month: number): Promise<MonthPreparationStatus> => {
    const current = monthKey(year, month);
    const prev = previousMonth(year, month);
    const prevKey = monthKey(prev.year, prev.month);

    const [budgets, defaults, previousBudgets, accounts, balances, previousBalances] =
      await Promise.all([
        budgetRepository.findByMonth(current),
        budgetDefaultRepository.findAll(),
        budgetRepository.findByMonth(prevKey),
        accountRepository.findActive(),
        balanceRepository.findByYearMonth(year, month),
        balanceRepository.findByYearMonth(prev.year, prev.month),
      ]);

    // Categories that "should" have a budget this month: the ones with a
    // saved default, plus any category that had one last month.
    const expectedCategoryIds = new Set<number>([
      ...defaults.map((d) => d.categoryId),
      ...previousBudgets.map((b) => b.categoryId),
    ]);

    const accountsWithRow = new Set(balances.map((b) => b.accountId));
    const accountsWithBalance = accounts.filter((a) => accountsWithRow.has(a.id)).length;

    // Only accounts that actually have something to carry forward count as
    // "missing" a balance. On a brand new install every balance is zero, so
    // nagging about them would be noise.
    const previousClosingByAccount = new Map(
      previousBalances.map((b) => [b.accountId, b.closingBalance]),
    );
    const accountsNeedingBalance = accounts.filter((account) => {
      if (accountsWithRow.has(account.id)) return false;
      const previous = previousClosingByAccount.get(account.id);
      if (previous !== undefined && previous !== 0) return true;
      return account.balance !== 0;
    });

    const missingBudgets =
      expectedCategoryIds.size > 0 && budgets.length < expectedCategoryIds.size;
    const missingBalances = accountsNeedingBalance.length > 0;

    return {
      year,
      month,
      monthLabel: `${year}年${month}月`,
      budgetCount: budgets.length,
      expectedBudgetCount: expectedCategoryIds.size,
      totalAccounts: accounts.length,
      accountsWithBalance,
      missingBudgets,
      missingBalances,
      isComplete: !missingBudgets && !missingBalances,
    };
  };

  /**
   * Creates this month's budgets from the saved per-category defaults,
   * falling back to last month's amount for categories that have no default
   * but did have a budget last month.
   *
   * Existing budgets are never touched — running it twice is safe.
   * Returns the number of budgets created.
   */
  const carryOverBudgets = async (
    year: number,
    month: number,
  ): Promise<number> => {
    const current = monthKey(year, month);
    const prev = previousMonth(year, month);
    const prevKey = monthKey(prev.year, prev.month);

    const [existingBudgets, defaults, previousBudgets] = await Promise.all([
      budgetRepository.findByMonth(current),
      budgetDefaultRepository.findAll(),
      budgetRepository.findByMonth(prevKey),
    ]);

    const alreadyBudgeted = new Set(existingBudgets.map((b) => b.categoryId));
    const defaultByCategory = new Map(defaults.map((d) => [d.categoryId, d]));

    // Candidates: defaults first, then last month's budgets without a default.
    const candidates: Array<{
      categoryId: number;
      amount: number;
      categoryName?: string;
    }> = [];

    for (const item of defaults) {
      candidates.push({
        categoryId: item.categoryId,
        amount: item.amount,
        categoryName: item.categoryName,
      });
    }
    for (const budget of previousBudgets) {
      if (defaultByCategory.has(budget.categoryId)) continue;
      if (candidates.some((c) => c.categoryId === budget.categoryId)) continue;
      candidates.push({
        categoryId: budget.categoryId,
        amount: budget.amount,
        categoryName: budget.name,
      });
    }

    const lastDay = new Date(year, month, 0).getDate();
    const startDate = `${current}-01`;
    const endDate = `${current}-${lastDay.toString().padStart(2, '0')}`;

    let budgetsCreated = 0;
    for (const candidate of candidates) {
      if (alreadyBudgeted.has(candidate.categoryId)) continue;

      await budgetRepository.create({
        name: candidate.categoryName ? `预算-${candidate.categoryName}` : '预算',
        description: '由「准备本月」创建',
        categoryId: candidate.categoryId,
        accountId: null,
        amount: candidate.amount,
        period: 'monthly',
        startDate,
        endDate,
        month: current,
        isRegular: true,
        isBudgetExceeded: false,
      });
      budgetsCreated += 1;
    }

    return budgetsCreated;
  };

  /**
   * Seeds each account's opening balance from last month's closing balance.
   * Accounts that already have a row for this month are left alone.
   * Returns the number of accounts seeded.
   */
  const carryOverBalances = async (
    year: number,
    month: number,
  ): Promise<number> => {
    const prev = previousMonth(year, month);

    const [accounts, currentBalances, previousBalances] = await Promise.all([
      accountRepository.findActive(),
      balanceRepository.findByYearMonth(year, month),
      balanceRepository.findByYearMonth(prev.year, prev.month),
    ]);

    const previousClosingByAccount = new Map(
      previousBalances.map((b) => [b.accountId, b.closingBalance]),
    );
    const accountsWithRow = new Set(currentBalances.map((b) => b.accountId));

    const now = new Date();
    const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;

    let balancesCreated = 0;
    for (const account of accounts) {
      if (accountsWithRow.has(account.id)) continue;

      const opening = previousClosingByAccount.get(account.id) ?? account.balance;
      // For the month in progress the running account balance already
      // reflects everything recorded so far, so it is the better closing
      // figure. For any other month, nothing is known yet.
      const closing = isCurrentMonth ? account.balance : opening;

      await balanceRepository.upsert(account.id, year, month, opening, closing);
      balancesCreated += 1;
    }

    return balancesCreated;
  };

  /**
   * One-tap month setup: budgets + opening balances in a single action.
   */
  const prepareMonth = async (
    year: number,
    month: number,
  ): Promise<PrepareMonthResult> => {
    const budgetsCreated = await carryOverBudgets(year, month);
    const balancesCreated = await carryOverBalances(year, month);

    const parts: string[] = [];
    if (budgetsCreated > 0) parts.push(`创建 ${budgetsCreated} 个预算`);
    if (balancesCreated > 0) parts.push(`设置 ${balancesCreated} 个账户的期初余额`);
    if (parts.length === 0) parts.push('这个月已经准备好了，无需改动');

    return {
      budgetsCreated,
      balancesCreated,
      accountsSkipped: 0,
      summary: parts.join('，'),
    };
  };

  return { getStatus, carryOverBudgets, carryOverBalances, prepareMonth };
}

const monthPreparationServiceCache = createServiceCache<
  ReturnType<typeof createMonthPreparationService>
>();

export function useMonthPreparationService(
  databaseService: DatabaseServiceType,
): ReturnType<typeof createMonthPreparationService> {
  return monthPreparationServiceCache(databaseService, () =>
    createMonthPreparationService(databaseService),
  );
}
