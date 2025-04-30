import { Transaction, TransactionType, TransactionEntity } from '../entities/Transaction';
import { TransactionRepository } from '../repositories/TransactionRepository';
import { AccountRepository } from '../repositories/AccountRepository';
import { CategoryRepository } from '../repositories/CategoryRepository';
import { Money } from '../value-objects/Money';
import { EventBus } from '../events/EventBus';
import { TransactionCreatedEvent, TransactionUpdatedEvent, TransactionDeletedEvent } from '../events/TransactionEvents';

export class TransactionService {
  private eventBus: EventBus;

  constructor(
    private transactionRepository: TransactionRepository,
    private accountRepository: AccountRepository,
    private categoryRepository: CategoryRepository
  ) {
    this.eventBus = EventBus.getInstance();
  }

  async createTransaction(
    name: string,
    amount: number,
    type: TransactionType,
    categoryId: string,
    date: Date,
    description?: string
  ): Promise<Transaction> {
    // 验证分类是否存在
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) {
      throw new Error('Category not found');
    }

    // 验证分类类型是否匹配
    if (category.type !== type) {
      throw new Error('Category type does not match transaction type');
    }

    // 创建交易
    const transaction = TransactionEntity.create({
      name,
      amount,
      type,
      categoryId,
      date,
      description,
    });

    // 更新账户余额
    const amountToUpdate = type === 'income' ? amount : -amount;
    await this.accountRepository.updateBalance(amountToUpdate);

    // 保存交易
    await this.transactionRepository.save(transaction);

    // 发布事件
    await this.eventBus.publish(new TransactionCreatedEvent(transaction));

    return transaction;
  }

  async updateTransaction(
    id: string,
    data: Partial<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Transaction> {
    const transaction = await this.transactionRepository.findById(id);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    const oldAmount = transaction.amount;
    const oldType = transaction.type;

    // 如果更新了金额或类型，需要调整账户余额
    if (data.amount !== undefined || data.type !== undefined) {
      const newAmount = data.amount ?? oldAmount;
      const newType = data.type ?? oldType;

      const oldAmountToUpdate = oldType === 'income' ? -oldAmount : oldAmount;
      const newAmountToUpdate = newType === 'income' ? newAmount : -newAmount;

      await this.accountRepository.updateBalance(oldAmountToUpdate + newAmountToUpdate);
    }

    // 如果更新了分类，需要验证新分类
    if (data.categoryId !== undefined) {
      const category = await this.categoryRepository.findById(data.categoryId);
      if (!category) {
        throw new Error('Category not found');
      }
      if (category.type !== (data.type ?? transaction.type)) {
        throw new Error('Category type does not match transaction type');
      }
    }

    // 更新交易
    const updatedTransaction = new TransactionEntity(transaction);
    updatedTransaction.update(data);
    await this.transactionRepository.update(updatedTransaction);

    // 发布事件
    await this.eventBus.publish(
      new TransactionUpdatedEvent(updatedTransaction, oldAmount, oldType)
    );

    return updatedTransaction;
  }

  async deleteTransaction(id: string): Promise<void> {
    const transaction = await this.transactionRepository.findById(id);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // 调整账户余额
    const amountToUpdate = transaction.type === 'income' ? -transaction.amount : transaction.amount;
    await this.accountRepository.updateBalance(amountToUpdate);

    // 删除交易
    await this.transactionRepository.delete(id);

    // 发布事件
    await this.eventBus.publish(new TransactionDeletedEvent(transaction));
  }

  async getTotalIncome(startDate: Date, endDate: Date): Promise<Money> {
    const transactions = await this.transactionRepository.findByDateRange(startDate, endDate);
    const totalAmount = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    return new Money(totalAmount);
  }

  async getTotalExpense(startDate: Date, endDate: Date): Promise<Money> {
    const transactions = await this.transactionRepository.findByDateRange(startDate, endDate);
    const totalAmount = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return new Money(totalAmount);
  }

  async getTotalAmountByType(type: 'income' | 'expense'): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const transactions = await this.transactionRepository.findByDateRange(startOfMonth, endOfMonth);
    return transactions
      .filter(t => t.type === type)
      .reduce((sum, t) => sum + t.amount, 0);
  }
} 