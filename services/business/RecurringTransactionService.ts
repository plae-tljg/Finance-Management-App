import { RecurringTransactionRepository } from '../database/repositories/RecurringTransactionRepository';
import { TransactionRepository } from '../database/repositories/TransactionRepository';
import { BudgetRepository } from '../database/repositories/BudgetRepository';
import { DatabaseService } from '../database/DatabaseService';
import {
  RecurringTransaction,
  RecurringTransactionWithCategory,
  calculateNextDueDate,
} from '../database/schemas/RecurringTransaction';

export function createRecurringTransactionService(databaseService: DatabaseService) {
  const recurringRepo = new RecurringTransactionRepository(databaseService);
  const transactionRepo = new TransactionRepository(databaseService);
  const budgetRepo = new BudgetRepository(databaseService);

  const getRecurringTransactions = async (): Promise<RecurringTransactionWithCategory[]> => {
    return await recurringRepo.findAll();
  };

  const getActiveRecurringTransactions = async (): Promise<RecurringTransactionWithCategory[]> => {
    return await recurringRepo.findAllActive();
  };

  const getRecurringTransactionById = async (id: number): Promise<RecurringTransactionWithCategory | null> => {
    return await recurringRepo.findByIdWithCategory(id);
  };

  const createRecurringTransaction = async (
    data: Omit<RecurringTransaction, 'id' | 'createdAt' | 'updatedAt' | 'lastGeneratedDate'>
  ): Promise<RecurringTransaction> => {
    return await recurringRepo.create({
      ...data,
      lastGeneratedDate: null,
    });
  };

  const updateRecurringTransaction = async (
    id: number,
    data: Partial<RecurringTransaction>
  ): Promise<boolean> => {
    return await recurringRepo.update(id, data);
  };

  const deleteRecurringTransaction = async (id: number): Promise<boolean> => {
    return await recurringRepo.delete(id);
  };

  const toggleRecurringTransaction = async (id: number): Promise<boolean> => {
    const existing = await recurringRepo.findById(id);
    if (!existing) return false;
    return await recurringRepo.update(id, { isActive: !existing.isActive });
  };

  const generateDueTransactions = async (): Promise<{ generated: number; errors: string[] }> => {
    const dueTransactions = await recurringRepo.findDueForGeneration();
    const errors: string[] = [];
    let generated = 0;

    for (const recurring of dueTransactions) {
      try {
        const now = new Date().toISOString();

        await transactionRepo.create({
          name: recurring.name,
          amount: recurring.amount,
          categoryId: recurring.categoryId,
          budgetId: recurring.budgetId ?? 0,
          accountId: 1,
          description: recurring.description ?? recurring.name,
          date: now,
          type: recurring.type,
        });

        const nextDueDate = calculateNextDueDate(
          recurring.nextDueDate,
          recurring.recurrenceType,
          recurring.recurrenceDay
        );

        await recurringRepo.updateLastGenerated(recurring.id, now, nextDueDate);
        generated++;
      } catch (error) {
        errors.push(`Failed to generate transaction for "${recurring.name}": ${error}`);
      }
    }

    return { generated, errors };
  };

  const getDueCount = async (): Promise<number> => {
    return await recurringRepo.countDue();
  };

  return {
    getRecurringTransactions,
    getActiveRecurringTransactions,
    getRecurringTransactionById,
    createRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    toggleRecurringTransaction,
    generateDueTransactions,
    getDueCount,
  };
}

export type RecurringTransactionService = ReturnType<typeof createRecurringTransactionService>;