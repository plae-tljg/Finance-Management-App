import { BudgetRepository } from '../database/repositories/BudgetRepository';
import { TransactionRepository } from '../database/repositories/TransactionRepository';
import { DatabaseService } from '../database/DatabaseService';

export type AlertThreshold = 50 | 80 | 100;

export interface BudgetAlert {
  budgetId: number;
  budgetName: string;
  categoryName: string;
  threshold: AlertThreshold;
  currentSpending: number;
  budgetAmount: number;
  percentage: number;
  isExceeded: boolean;
}

export interface AlertSettings {
  enabled: boolean;
  thresholds: AlertThreshold[];
  notifyOnExceeded: boolean;
}

const DEFAULT_SETTINGS: AlertSettings = {
  enabled: true,
  thresholds: [50, 80, 100],
  notifyOnExceeded: true,
};

export function createBudgetAlertService(databaseService: DatabaseService) {
  const budgetRepo = new BudgetRepository(databaseService);
  const transactionRepo = new TransactionRepository(databaseService);

  let settings: AlertSettings = { ...DEFAULT_SETTINGS };

  const setSettings = (newSettings: Partial<AlertSettings>) => {
    settings = { ...settings, ...newSettings };
  };

  const getSettings = (): AlertSettings => {
    return { ...settings };
  };

  const checkBudgetSpending = async (budgetId: number): Promise<BudgetAlert | null> => {
    const budget = await budgetRepo.findByIdWithCategory(budgetId);
    if (!budget) return null;

    const startDate = budget.startDate;
    const endDate = new Date().toISOString();

    const transactions = await transactionRepo.findByBudgetId(budgetId);
    const relevantTransactions = transactions.filter(
      t => t.date >= startDate && t.date <= endDate
    );

    const currentSpending = relevantTransactions.reduce((sum, t) => sum + t.amount, 0);
    const percentage = budget.amount > 0 ? (currentSpending / budget.amount) * 100 : 0;

    const exceededThreshold = settings.thresholds
      .filter(t => percentage >= t)
      .pop() ?? null;

    if (!exceededThreshold) return null;

    return {
      budgetId,
      budgetName: budget.name,
      categoryName: budget.categoryName,
      threshold: exceededThreshold,
      currentSpending,
      budgetAmount: budget.amount,
      percentage,
      isExceeded: percentage >= 100,
    };
  };

  const getAllBudgetAlerts = async (): Promise<BudgetAlert[]> => {
    if (!settings.enabled) return [];

    const budgets = await budgetRepo.findAll();
    const alerts: BudgetAlert[] = [];

    for (const budget of budgets) {
      const alert = await checkBudgetSpending(budget.id);
      if (alert) {
        if (alert.isExceeded && settings.notifyOnExceeded) {
          alerts.push(alert);
        } else if (!alert.isExceeded) {
          alerts.push(alert);
        }
      }
    }

    return alerts.sort((a, b) => b.percentage - a.percentage);
  };

  const getExceededBudgets = async (): Promise<BudgetAlert[]> => {
    const alerts = await getAllBudgetAlerts();
    return alerts.filter(a => a.isExceeded);
  };

  const getUpcomingBudgetAlerts = async (): Promise<BudgetAlert[]> => {
    const alerts = await getAllBudgetAlerts();
    return alerts.filter(a => !a.isExceeded);
  };

  const calculateBudgetHealth = async (month?: string): Promise<{
    healthy: number;
    warning: number;
    exceeded: number;
    total: number;
  }> => {
    const filter = month ? { month } : undefined;
    const budgets = filter
      ? await budgetRepo.findByMonthWithCategory(month!)
      : await budgetRepo.findAllWithCategory();

    let healthy = 0;
    let warning = 0;
    let exceeded = 0;

    for (const budget of budgets) {
      const spending = budget.spent ?? 0;
      const percentage = budget.amount > 0 ? (spending / budget.amount) * 100 : 0;

      if (percentage >= 100) {
        exceeded++;
      } else if (percentage >= 80) {
        warning++;
      } else {
        healthy++;
      }
    }

    return {
      healthy,
      warning,
      exceeded,
      total: budgets.length,
    };
  };

  return {
    setSettings,
    getSettings,
    checkBudgetSpending,
    getAllBudgetAlerts,
    getExceededBudgets,
    getUpcomingBudgetAlerts,
    calculateBudgetHealth,
  };
}

export type BudgetAlertService = ReturnType<typeof createBudgetAlertService>;