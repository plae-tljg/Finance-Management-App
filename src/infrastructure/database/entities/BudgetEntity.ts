import { Budget } from '../../../domain/entities/Budget';

export class BudgetEntity {
  static readonly TABLE_NAME = 'budgets';
  
  static readonly CREATE_TABLE_SQL = `
    CREATE TABLE IF NOT EXISTS ${BudgetEntity.TABLE_NAME} (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      category_id TEXT NOT NULL,
      amount REAL NOT NULL,
      period TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `;

  static toDomain(row: any): Budget {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      categoryId: row.category_id,
      amount: row.amount,
      period: row.period,
      startDate: new Date(row.start_date),
      endDate: new Date(row.end_date),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  static toPersistence(budget: Budget): any {
    return {
      id: budget.id,
      name: budget.name,
      description: budget.description,
      category_id: budget.categoryId,
      amount: budget.amount,
      period: budget.period,
      start_date: budget.startDate.toISOString(),
      end_date: budget.endDate.toISOString(),
      created_at: budget.createdAt.toISOString(),
      updated_at: budget.updatedAt.toISOString()
    };
  }
} 