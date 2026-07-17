import { getApiClient } from './ApiClient';
import type { Transaction } from '@/services/database/schemas/Transaction';
import type { Budget } from '@/services/database/schemas/Budget';
import type { Category } from '@/services/database/schemas/Category';
import type { Account } from '@/services/database/schemas/Account';
import type { Goal } from '@/services/database/schemas/Goal';
import type { AccountMonthlyBalance } from '@/services/database/schemas/AccountMonthlyBalance';
import type { BudgetDefault } from '@/services/database/schemas/BudgetDefault';

const client = () => getApiClient();

// ---------- Transactions ----------
export interface TransactionWithCategory extends Transaction {
  categoryName?: string;
  categoryIcon?: string;
  accountName?: string;
  accountIcon?: string;
  accountColor?: string;
}

export const TransactionsApi = {
  list: () => client().get<TransactionWithCategory[]>('/api/transactions'),
  listWithCategory: () =>
    client().get<TransactionWithCategory[]>('/api/transactions', { withCategory: 1 }),
  get: (id: number) => client().get<TransactionWithCategory>(`/api/transactions/${id}`),
  create: (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) =>
    client().post<Transaction>('/api/transactions', data),
  update: (id: number, data: Partial<Transaction>) =>
    client().put<Transaction>(`/api/transactions/${id}`, data),
  remove: (id: number) => client().delete<{ id: number }>(`/api/transactions/${id}`),
  byDateRange: (start: string, end: string) =>
    client().get<TransactionWithCategory[]>('/api/transactions', {
      startDate: start,
      endDate: end,
      withCategory: 1,
    }),
  byCategory: (categoryId: number) =>
    client().get<TransactionWithCategory[]>('/api/transactions', { categoryId }),
  byBudget: (budgetId: number) =>
    client().get<TransactionWithCategory[]>('/api/transactions', { budgetId }),
  byAccount: (accountId: number) =>
    client().get<TransactionWithCategory[]>('/api/transactions', { accountId }),
  summaryByCategory: (start: string, end: string) =>
    client().get<
      Array<{
        categoryId: number;
        categoryName: string;
        total: number;
        count: number;
      }>
    >('/api/transactions/summary/by-category', { startDate: start, endDate: end }),
  summaryByBudget: (start: string, end: string) =>
    client().get<
      Array<{
        budgetId: number;
        budgetName: string;
        totalSpent: number;
        budgetAmount: number;
        isExceeded: number;
      }>
    >('/api/transactions/summary/by-budget', { startDate: start, endDate: end }),
  summaryByAccount: (start: string, end: string) =>
    client().get<
      Array<{
        accountId: number;
        accountName: string;
        accountIcon: string;
        accountColor: string;
        totalIncome: number;
        totalExpense: number;
        transactionCount: number;
      }>
    >('/api/transactions/summary/by-account', { startDate: start, endDate: end }),
};

// ---------- Budgets ----------
export interface BudgetWithCategory extends Budget {
  categoryName?: string;
  categoryIcon?: string;
  spent?: number;
  isExceeded?: number;
}

export const BudgetsApi = {
  list: () => client().get<BudgetWithCategory[]>('/api/budgets'),
  listWithCategory: () =>
    client().get<BudgetWithCategory[]>('/api/budgets', { withCategory: 1 }),
  get: (id: number) => client().get<BudgetWithCategory>(`/api/budgets/${id}`),
  create: (data: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) =>
    client().post<Budget>('/api/budgets', data),
  update: (id: number, data: Partial<Budget>) =>
    client().put<Budget>(`/api/budgets/${id}`, data),
  remove: (id: number) => client().delete<{ id: number }>(`/api/budgets/${id}`),
};

// ---------- Budget defaults ----------
export const BudgetDefaultsApi = {
  list: () => client().get<BudgetDefault[]>('/api/budget-defaults'),
  upsert: (data: Partial<BudgetDefault> & { categoryId: number }) =>
    client().post<BudgetDefault>('/api/budget-defaults', data),
  remove: (id: number) => client().delete<{ id: number }>(`/api/budget-defaults/${id}`),
};

// ---------- Categories ----------
export const CategoriesApi = {
  list: () => client().get<Category[]>('/api/categories'),
  get: (id: number) => client().get<Category>(`/api/categories/${id}`),
  create: (data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) =>
    client().post<Category>('/api/categories', data),
  update: (id: number, data: Partial<Category>) =>
    client().put<Category>(`/api/categories/${id}`, data),
  remove: (id: number) => client().delete<{ id: number }>(`/api/categories/${id}`),
};

// ---------- Accounts ----------
export const AccountsApi = {
  list: () => client().get<Account[]>('/api/accounts'),
  get: (id: number) => client().get<Account>(`/api/accounts/${id}`),
  create: (data: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) =>
    client().post<Account>('/api/accounts', data),
  update: (id: number, data: Partial<Account>) =>
    client().put<Account>(`/api/accounts/${id}`, data),
  remove: (id: number) => client().delete<{ id: number }>(`/api/accounts/${id}`),
};

// ---------- Goals ----------
export const GoalsApi = {
  list: () => client().get<Goal[]>('/api/goals'),
  get: (id: number) => client().get<Goal>(`/api/goals/${id}`),
  create: (data: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) =>
    client().post<Goal>('/api/goals', data),
  update: (id: number, data: Partial<Goal>) =>
    client().put<Goal>(`/api/goals/${id}`, data),
  remove: (id: number) => client().delete<{ id: number }>(`/api/goals/${id}`),
};

// ---------- Account monthly balances ----------
export const AccountMonthlyBalancesApi = {
  list: () => client().get<AccountMonthlyBalance[]>('/api/account-monthly-balances'),
  byAccount: (accountId: number) =>
    client().get<AccountMonthlyBalance[]>('/api/account-monthly-balances', { accountId }),
  byMonth: (year: number, month: number) =>
    client().get<AccountMonthlyBalance[]>('/api/account-monthly-balances', {
      year,
      month,
    }),
  totalsByMonth: (year: number, month: number) =>
    client().get<{ openingBalance: number; closingBalance: number }>(
      '/api/account-monthly-balances/totals',
      { year, month },
    ),
  upsert: (
    data: Omit<AccountMonthlyBalance, 'id' | 'createdAt' | 'updatedAt'> &
      Partial<Pick<AccountMonthlyBalance, 'id'>>,
  ) => client().post<AccountMonthlyBalance>('/api/account-monthly-balances', data),
  remove: (id: number) =>
    client().delete<{ id: number }>(`/api/account-monthly-balances/${id}`),
};

// ---------- Reports ----------
export const ReportsApi = {
  weeklyExpenses: () => client().get<{ labels: string[]; totals: number[] }>('/api/reports/weekly-expenses'),
  cashflow: (from: string, to: string) =>
    client().get<{ income: number; expense: number; net: number }>('/api/reports/cashflow', {
      from,
      to,
    }),
  yearlySummary: (year: number) =>
    client().get<
      Array<{
        month: number;
        income: number;
        expense: number;
        net: number;
      }>
    >('/api/reports/yearly-summary', { year }),
};

// ---------- Schema bootstrap / migrations ----------
export const SchemaApi = {
  status: () =>
    client().get<{ schemaVersion: number; tables: string[] }>('/api/schema/status'),
  migrate: () =>
    client().post<{ schemaVersion: number; migrated: boolean }>('/api/schema/migrate'),
};