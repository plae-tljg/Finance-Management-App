import { Account } from '../../../domain/entities/Account';

export class AccountEntity {
  static readonly TABLE_NAME = 'accounts';
  
  static readonly CREATE_TABLE_SQL = `
    CREATE TABLE IF NOT EXISTS ${AccountEntity.TABLE_NAME} (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      opening_balance REAL NOT NULL,
      closing_balance REAL NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `;

  static toDomain(row: any): Account {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      openingBalance: row.opening_balance,
      closingBalance: row.closing_balance,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  static toPersistence(account: Account): any {
    return {
      id: account.id,
      name: account.name,
      type: account.type,
      opening_balance: account.openingBalance,
      closing_balance: account.closingBalance,
      created_at: account.createdAt.toISOString(),
      updated_at: account.updatedAt.toISOString()
    };
  }
} 