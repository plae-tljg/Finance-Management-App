import { DomainEvent } from '../DomainEvent';
import { TransactionCreatedEvent, TransactionUpdatedEvent, TransactionDeletedEvent } from '../TransactionEvents';
import { BudgetService } from '../../services/BudgetService';

export class BudgetEventHandler {
  constructor(private budgetService: BudgetService) {}

  async handleTransactionCreated(event: TransactionCreatedEvent): Promise<void> {
    if (event.transaction.type === 'expense') {
      // 检查是否有相关的预算
      const budgets = await this.budgetService.getActiveBudgets();
      const relevantBudget = budgets.find(b => b.categoryId === event.transaction.categoryId);
      
      if (relevantBudget) {
        // 更新预算状态
        const status = await this.budgetService.getBudgetStatus(relevantBudget.id);
        if (status.percentage >= 90) {
          // 可以在这里添加通知逻辑
          console.log(`Budget alert: ${relevantBudget.id} is at ${status.percentage}% of its limit`);
        }
      }
    }
  }

  async handleTransactionUpdated(event: TransactionUpdatedEvent): Promise<void> {
    if (event.transaction.type === 'expense' || event.oldType === 'expense') {
      // 检查是否有相关的预算
      const budgets = await this.budgetService.getActiveBudgets();
      const relevantBudget = budgets.find(b => b.categoryId === event.transaction.categoryId);
      
      if (relevantBudget) {
        // 更新预算状态
        const status = await this.budgetService.getBudgetStatus(relevantBudget.id);
        if (status.percentage >= 90) {
          // 可以在这里添加通知逻辑
          console.log(`Budget alert: ${relevantBudget.id} is at ${status.percentage}% of its limit`);
        }
      }
    }
  }

  async handleTransactionDeleted(event: TransactionDeletedEvent): Promise<void> {
    if (event.transaction.type === 'expense') {
      // 检查是否有相关的预算
      const budgets = await this.budgetService.getActiveBudgets();
      const relevantBudget = budgets.find(b => b.categoryId === event.transaction.categoryId);
      
      if (relevantBudget) {
        // 更新预算状态
        const status = await this.budgetService.getBudgetStatus(relevantBudget.id);
        if (status.percentage >= 90) {
          // 可以在这里添加通知逻辑
          console.log(`Budget alert: ${relevantBudget.id} is at ${status.percentage}% of its limit`);
        }
      }
    }
  }
} 