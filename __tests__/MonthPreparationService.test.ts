/**
 * The "准备本月" (prepare this month) flow is the feature that removes the
 * monthly manual ritual:
 *   - budgets are created from the saved per-category defaults, falling back
 *     to last month's amount when a category has no default;
 *   - each account's opening balance is seeded from last month's closing
 *     balance.
 *
 * It has to be idempotent — running it twice must not duplicate anything.
 */
const mockBudgetRepo = {
  findByMonth: jest.fn(),
  create: jest.fn(),
};

const mockBudgetDefaultRepo = {
  findAll: jest.fn(),
};

const mockAccountRepo = {
  findActive: jest.fn(),
};

const mockBalanceRepo = {
  findByYearMonth: jest.fn(),
  upsert: jest.fn(),
};

jest.mock('@/services/database/repositories/BudgetRepository', () => ({
  BudgetRepository: jest.fn(() => mockBudgetRepo),
}));
jest.mock('@/services/database/repositories/BudgetDefaultRepository', () => ({
  BudgetDefaultRepository: jest.fn(() => mockBudgetDefaultRepo),
}));
jest.mock('@/services/database/repositories/AccountRepository', () => ({
  AccountRepository: jest.fn(() => mockAccountRepo),
}));
jest.mock(
  '@/services/database/repositories/AccountMonthlyBalanceRepository',
  () => ({
    AccountMonthlyBalanceRepository: jest.fn(() => mockBalanceRepo),
  }),
);

import { useMonthPreparationService } from '@/services/business/MonthPreparationService';

const fakeDb = { executeQuery: jest.fn() } as any;

function service() {
  return useMonthPreparationService(fakeDb);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockBudgetRepo.findByMonth.mockResolvedValue([]);
  mockBudgetDefaultRepo.findAll.mockResolvedValue([]);
  mockAccountRepo.findActive.mockResolvedValue([]);
  mockBalanceRepo.findByYearMonth.mockResolvedValue([]);
  mockBalanceRepo.upsert.mockResolvedValue(undefined);
  mockBudgetRepo.create.mockResolvedValue({});
});

describe('MonthPreparationService.carryOverBudgets', () => {
  it('creates budgets from the saved defaults', async () => {
    mockBudgetDefaultRepo.findAll.mockResolvedValue([
      { categoryId: 1, amount: 800, categoryName: '餐饮' },
      { categoryId: 2, amount: 300, categoryName: '交通' },
    ]);

    const created = await service().carryOverBudgets(2026, 12);

    expect(created).toBe(2);
    expect(mockBudgetRepo.create).toHaveBeenCalledTimes(2);
    expect(mockBudgetRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryId: 1,
        amount: 800,
        month: '2026-12',
        period: 'monthly',
      }),
    );
  });

  it('falls back to last month amount for categories without a default', async () => {
    mockBudgetRepo.findByMonth.mockImplementation(async (month: string) =>
      month === '2026-11'
        ? [{ categoryId: 9, amount: 150, name: '预算-娱乐' }]
        : [],
    );

    const created = await service().carryOverBudgets(2026, 12);

    expect(created).toBe(1);
    expect(mockBudgetRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ categoryId: 9, amount: 150 }),
    );
  });

  it('does not touch categories that already have a budget this month', async () => {
    mockBudgetDefaultRepo.findAll.mockResolvedValue([
      { categoryId: 1, amount: 800, categoryName: '餐饮' },
    ]);
    mockBudgetRepo.findByMonth.mockImplementation(async (month: string) =>
      month === '2026-12' ? [{ categoryId: 1, amount: 999 }] : [],
    );

    const created = await service().carryOverBudgets(2026, 12);

    expect(created).toBe(0);
    expect(mockBudgetRepo.create).not.toHaveBeenCalled();
  });
});

describe('MonthPreparationService.carryOverBalances', () => {
  it('seeds opening balance from the previous month closing balance', async () => {
    mockAccountRepo.findActive.mockResolvedValue([
      { id: 1, name: '现金', balance: 500 },
    ]);
    mockBalanceRepo.findByYearMonth.mockImplementation(
      async (year: number, month: number) =>
        year === 2026 && month === 11
          ? [{ accountId: 1, year: 2026, month: 11, openingBalance: 100, closingBalance: 250 }]
          : [],
    );

    // December 2026 is not the month in progress, so nothing is known about
    // the closing balance yet and it starts equal to the opening balance.
    const created = await service().carryOverBalances(2026, 12);

    expect(created).toBe(1);
    expect(mockBalanceRepo.upsert).toHaveBeenCalledWith(1, 2026, 12, 250, 250);
  });

  it('uses the running account balance as the closing balance for the month in progress', async () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;

    mockAccountRepo.findActive.mockResolvedValue([
      { id: 1, name: '现金', balance: 500 },
    ]);
    mockBalanceRepo.findByYearMonth.mockImplementation(
      async (y: number, m: number) =>
        y === prevYear && m === prevMonth
          ? [{ accountId: 1, year: prevYear, month: prevMonth, openingBalance: 100, closingBalance: 250 }]
          : [],
    );

    await service().carryOverBalances(year, month);

    expect(mockBalanceRepo.upsert).toHaveBeenCalledWith(1, year, month, 250, 500);
  });

  it('falls back to the account balance when there is no previous month', async () => {
    mockAccountRepo.findActive.mockResolvedValue([
      { id: 1, name: '现金', balance: 500 },
    ]);

    const created = await service().carryOverBalances(2030, 1);

    expect(created).toBe(1);
    expect(mockBalanceRepo.upsert).toHaveBeenCalledWith(1, 2030, 1, 500, 500);
  });

  it('skips accounts that already have a row for this month', async () => {
    mockAccountRepo.findActive.mockResolvedValue([
      { id: 1, name: '现金', balance: 500 },
    ]);
    mockBalanceRepo.findByYearMonth.mockImplementation(
      async (year: number, month: number) =>
        year === 2026 && month === 12
          ? [{ accountId: 1, year: 2026, month: 12, openingBalance: 5, closingBalance: 5 }]
          : [],
    );

    const created = await service().carryOverBalances(2026, 12);

    expect(created).toBe(0);
    expect(mockBalanceRepo.upsert).not.toHaveBeenCalled();
  });
});

describe('MonthPreparationService.getStatus', () => {
  it('reports a month with nothing set up as incomplete', async () => {
    mockBudgetDefaultRepo.findAll.mockResolvedValue([
      { categoryId: 1, amount: 800, categoryName: '餐饮' },
    ]);
    mockAccountRepo.findActive.mockResolvedValue([
      { id: 1, name: '现金', balance: 500 },
    ]);

    const status = await service().getStatus(2026, 12);

    expect(status.budgetCount).toBe(0);
    expect(status.expectedBudgetCount).toBe(1);
    expect(status.missingBudgets).toBe(true);
    expect(status.missingBalances).toBe(true);
    expect(status.isComplete).toBe(false);
  });

  it('reports a fully prepared month as complete', async () => {    mockBudgetDefaultRepo.findAll.mockResolvedValue([
      { categoryId: 1, amount: 800, categoryName: '餐饮' },
    ]);
    mockBudgetRepo.findByMonth.mockImplementation(async (month: string) =>
      month === '2026-12' ? [{ categoryId: 1, amount: 800 }] : [],
    );
    mockAccountRepo.findActive.mockResolvedValue([
      { id: 1, name: '现金', balance: 500 },
    ]);
    mockBalanceRepo.findByYearMonth.mockImplementation(
      async (year: number, month: number) =>
        year === 2026 && month === 12
          ? [{ accountId: 1, year: 2026, month: 12, openingBalance: 5, closingBalance: 5 }]
          : [],
    );

    const status = await service().getStatus(2026, 12);

    expect(status.isComplete).toBe(true);
    expect(status.missingBudgets).toBe(false);
    expect(status.missingBalances).toBe(false);
  });

  it('does not ask for balances on a fresh install where every balance is zero', async () => {
    mockAccountRepo.findActive.mockResolvedValue([
      { id: 1, name: '现金', balance: 0 },
      { id: 2, name: '银行账户', balance: 0 },
    ]);

    const status = await service().getStatus(2026, 12);

    // Nothing to carry forward and nothing recorded, so nagging would be
    // noise on a brand new install.
    expect(status.missingBalances).toBe(false);
    expect(status.missingBudgets).toBe(false);
    expect(status.isComplete).toBe(true);
  });
});
