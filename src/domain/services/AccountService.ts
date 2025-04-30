import { Money } from '../value-objects/Money';
import { AccountRepository } from '../repositories/AccountRepository';
import { TransactionRepository } from '../repositories/TransactionRepository';

export class AccountService {
  constructor(
    private accountRepository: AccountRepository,
    private transactionRepository: TransactionRepository
  ) {}

  async getBalance(): Promise<Money> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const transactions = await this.transactionRepository.findByDateRange(startOfMonth, endOfMonth);
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return new Money(totalIncome - totalExpense);
  }

  async getMonthlyIncome(): Promise<Money> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const transactions = await this.transactionRepository.findByDateRange(startOfMonth, endOfMonth);
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    return new Money(totalIncome);
  }

  async getMonthlyExpense(): Promise<Money> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const transactions = await this.transactionRepository.findByDateRange(startOfMonth, endOfMonth);
    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return new Money(totalExpense);
  }

  async getBalanceByDateRange(startDate: Date, endDate: Date): Promise<Money> {
    const transactions = await this.transactionRepository.findByDateRange(startDate, endDate);
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return new Money(totalIncome - totalExpense);
  }
} 