import { Budget, BudgetEntity } from '../entities/Budget';
import { BudgetRepository } from '../repositories/BudgetRepository';
import { TransactionRepository } from '../repositories/TransactionRepository';
import { CategoryRepository } from '../repositories/CategoryRepository';
import { Money } from '../value-objects/Money';
import { DateRange } from '../value-objects/DateRange';
import { BudgetPeriod } from '../enums/enum';

export class BudgetService {
  constructor(
    private budgetRepository: BudgetRepository,
    private transactionRepository: TransactionRepository,
    private categoryRepository: CategoryRepository
  ) {}

  async createBudget(
    name: string,
    categoryId: string,
    amount: number,
    period: BudgetPeriod,
    startDate: Date,
    endDate: Date,
    description?: string
  ): Promise<Budget> {
    // 验证分类是否存在
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) {
      throw new Error('Category not found');
    }

    // 验证日期范围
    if (startDate >= endDate) {
      throw new Error('Start date must be before end date');
    }

    // 创建预算
    const budget = BudgetEntity.create({
      name,
      categoryId,
      amount,
      period,
      startDate,
      endDate,
      description,
    });

    // 保存预算
    await this.budgetRepository.save(budget);

    return budget;
  }

  async updateBudget(
    id: string,
    data: Partial<Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Budget> {
    const budget = await this.budgetRepository.findById(id);
    if (!budget) {
      throw new Error('Budget not found');
    }

    // 如果更新了分类，需要验证新分类
    if (data.categoryId !== undefined) {
      const category = await this.categoryRepository.findById(data.categoryId);
      if (!category) {
        throw new Error('Category not found');
      }
    }

    // 如果更新了日期范围，需要验证
    if (data.startDate !== undefined && data.endDate !== undefined) {
      if (data.startDate >= data.endDate) {
        throw new Error('Start date must be before end date');
      }
    }

    // 更新预算
    const updatedBudget = new BudgetEntity(budget);
    updatedBudget.update(data);
    await this.budgetRepository.update(updatedBudget);

    return updatedBudget;
  }

  async deleteBudget(id: string): Promise<void> {
    const budget = await this.budgetRepository.findById(id);
    if (!budget) {
      throw new Error('Budget not found');
    }

    await this.budgetRepository.delete(id);
  }

  async getBudgetStatus(budgetId: string): Promise<{
    budget: Budget;
    spent: Money;
    remaining: Money;
    percentage: number;
  }> {
    const budget = await this.budgetRepository.findById(budgetId);
    if (!budget) {
      throw new Error('Budget not found');
    }

    const dateRange = new DateRange(budget.startDate, budget.endDate);
    const transactions = await this.transactionRepository.findByDateRange(
      dateRange.getStartDate(),
      dateRange.getEndDate()
    );

    const spentAmount = transactions
      .filter(t => t.categoryId === budget.categoryId && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const spent = new Money(spentAmount, 'USD');
    const remaining = new Money(budget.amount - spentAmount, 'USD');
    const percentage = (spentAmount / budget.amount) * 100;

    return {
      budget,
      spent,
      remaining,
      percentage,
    };
  }

  async getActiveBudgets(): Promise<Budget[]> {
    return this.budgetRepository.findActive();
  }

  async getBudgetAlerts(): Promise<{
    budget: Budget;
    spent: Money;
    remaining: Money;
    percentage: number;
    isOverBudget: boolean;
  }[]> {
    const activeBudgets = await this.getActiveBudgets();
    const alerts = await Promise.all(
      activeBudgets.map(async budget => {
        const status = await this.getBudgetStatus(budget.id);
        return {
          ...status,
          isOverBudget: status.percentage >= 90,
        };
      })
    );

    return alerts.filter(alert => alert.isOverBudget);
  }

  async getTotalBudgetAmount(): Promise<number> {
    const activeBudgets = await this.budgetRepository.findActive();
    return activeBudgets.reduce((sum, budget) => sum + budget.amount, 0);
  }
} 