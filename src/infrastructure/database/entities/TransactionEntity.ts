import { Transaction } from '../../../domain/entities/Transaction';

export class TransactionEntity {
  static readonly TABLE_NAME = 'transactions';
  
  static readonly CREATE_TABLE_SQL = `
    CREATE TABLE IF NOT EXISTS ${TransactionEntity.TABLE_NAME} (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      category_id TEXT NOT NULL,
      date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories (id)
    );
  `;

  static toDomain(row: any): Transaction {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      amount: row.amount,
      type: row.type,
      categoryId: row.category_id,
      date: new Date(row.date),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  static toPersistence(transaction: Transaction): any {
    return {
      id: transaction.id,
      name: transaction.name,
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      category_id: transaction.categoryId,
      date: transaction.date.toISOString(),
      created_at: transaction.createdAt.toISOString(),
      updated_at: transaction.updatedAt.toISOString()
    };
  }
} 