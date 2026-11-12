/**
 * The service factories in `services/business` are named `use*Service` but are
 * plain functions — they are not React hooks. Many call sites put them in a
 * `useEffect` dependency array, so the object they return has to keep a
 * stable identity across renders.
 *
 * When the factories returned a fresh object literal on every call, those
 * effects re-ran on every render and any `setState` they performed with a
 * fresh array kicked off another render — an unbounded render + query loop.
 */
import { useAccountService } from '@/services/business/AccountService';
import { useBudgetService } from '@/services/business/BudgetService';
import { useCategoryService } from '@/services/business/CategoryService';
import { useTransactionService } from '@/services/business/TransactionService';
import { useAccountMonthlyBalanceService } from '@/services/business/AccountMonthlyBalanceService';
import { useGoalService } from '@/services/business/GoalService';
import { useBudgetDefaultService } from '@/services/business/BudgetDefaultService';

const fakeDb = { executeQuery: jest.fn() } as any;

describe('service factory identity stability', () => {
  it.each([
    ['useAccountService', useAccountService],
    ['useBudgetService', useBudgetService],
    ['useCategoryService', useCategoryService],
    ['useTransactionService', useTransactionService],
    ['useAccountMonthlyBalanceService', useAccountMonthlyBalanceService],
    ['useGoalService', useGoalService],
    ['useBudgetDefaultService', useBudgetDefaultService],
  ])('%s returns the same instance for the same database', (_name, factory) => {
    const first = (factory as any)(fakeDb);
    const second = (factory as any)(fakeDb);

    expect(first).toBe(second);
  });
});
