import { TransactionRepository } from '../repositories/TransactionRepository';
import { CategoryRepository } from '../repositories/CategoryRepository';
import { AccountRepository } from '../repositories/AccountRepository';
import { Money } from '../value-objects/Money';
import { DateRange } from '../value-objects/DateRange';
import { BudgetPeriod } from '../enums/enum';

export interface CategoryReport {
  categoryId: string;
  categoryName: string;
  totalAmount: Money;
  percentage: number;
  transactions: number;
}

export interface AccountReport {
  accountId: string;
  accountName: string;
  balance: Money;
  totalIncome: Money;
  totalExpense: Money;
  netChange: Money;
}

export interface PeriodReport {
  startDate: Date;
  endDate: Date;
  totalIncome: Money;
  totalExpense: Money;
  netChange: Money;
  incomeByCategory: CategoryReport[];
  expenseByCategory: CategoryReport[];
  accountReports: AccountReport[];
}

export class ReportService {
  constructor(
    private transactionRepository: TransactionRepository,
    private categoryRepository: CategoryRepository,
    private accountRepository: AccountRepository
  ) {}

  async generatePeriodReport(startDate: Date, endDate: Date): Promise<PeriodReport> {
    const dateRange = new DateRange(startDate, endDate);
    const transactions = await this.transactionRepository.findByDateRange(
      dateRange.getStartDate(),
      dateRange.getEndDate()
    );

    const categories = await this.categoryRepository.findAll();
    const accounts = await this.accountRepository.findAll();

    // 计算总收入
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    // 计算总支出
    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // 计算净变化
    const netChange = totalIncome - totalExpense;

    // 按分类统计收入
    const incomeByCategory = await this.generateCategoryReport(
      transactions.filter(t => t.type === 'income'),
      categories,
      totalIncome
    );

    // 按分类统计支出
    const expenseByCategory = await this.generateCategoryReport(
      transactions.filter(t => t.type === 'expense'),
      categories,
      totalExpense
    );

    // 生成账户报告
    const accountReports = await Promise.all(
      accounts.map(async account => {
        const accountTransactions = transactions.filter(t => t.accountId === account.id);
        const accountIncome = accountTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        const accountExpense = accountTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        return {
          accountId: account.id,
          accountName: account.name,
          balance: new Money(account.closingBalance),
          totalIncome: new Money(accountIncome),
          totalExpense: new Money(accountExpense),
          netChange: new Money(accountIncome - accountExpense),
        };
      })
    );

    return {
      startDate: dateRange.getStartDate(),
      endDate: dateRange.getEndDate(),
      totalIncome: new Money(totalIncome),
      totalExpense: new Money(totalExpense),
      netChange: new Money(netChange),
      incomeByCategory,
      expenseByCategory,
      accountReports,
    };
  }

  private async generateCategoryReport(
    transactions: any[],
    categories: any[],
    totalAmount: number
  ): Promise<CategoryReport[]> {
    const categoryMap = new Map(
      categories.map(category => [category.id, { ...category, totalAmount: 0, transactions: 0 }])
    );

    transactions.forEach(transaction => {
      const category = categoryMap.get(transaction.categoryId);
      if (category) {
        category.totalAmount += transaction.amount;
        category.transactions += 1;
      }
    });

    return Array.from(categoryMap.values())
      .filter(category => category.totalAmount > 0)
      .map(category => ({
        categoryId: category.id,
        categoryName: category.name,
        totalAmount: new Money(category.totalAmount),
        percentage: (category.totalAmount / totalAmount) * 100,
        transactions: category.transactions,
      }))
      .sort((a, b) => b.totalAmount.getAmount() - a.totalAmount.getAmount());
  }

  async generateTrendReport(
    startDate: Date,
    endDate: Date,
    interval: BudgetPeriod
  ): Promise<{
    dates: string[];
    income: number[];
    expense: number[];
  }> {
    const transactions = await this.transactionRepository.findByDateRange(startDate, endDate);
    const dateMap = new Map<string, { income: number; expense: number }>();

    transactions.forEach(transaction => {
      const date = this.formatDate(transaction.date, interval);
      const current = dateMap.get(date) || { income: 0, expense: 0 };

      if (transaction.type === 'income') {
        current.income += transaction.amount;
      } else {
        current.expense += transaction.amount;
      }

      dateMap.set(date, current);
    });

    const dates = Array.from(dateMap.keys()).sort();
    const income = dates.map(date => dateMap.get(date)!.income);
    const expense = dates.map(date => dateMap.get(date)!.expense);

    return {
      dates,
      income,
      expense,
    };
  }
  private formatDate(date: Date, interval: BudgetPeriod): string {
    switch (interval) {
      case BudgetPeriod.DAILY:
        return date.toISOString().split('T')[0];
      case BudgetPeriod.WEEKLY:
        const weekNumber = Math.ceil(date.getDate() / 7);
        return `${date.getFullYear()}-W${weekNumber}`;
      case BudgetPeriod.MONTHLY:
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      default:
        throw new Error(`Unsupported interval: ${interval}`);
    }
  }
} 