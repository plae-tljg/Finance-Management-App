import { Account, AccountFields, UpdatableFields } from '../schemas/Account';
import { AccountQueries } from '../schemas/Account';
import { BaseRepository } from './BaseRepository';
import { QueryExecutor } from '../types';

export class AccountRepository implements BaseRepository<Account> {
  constructor(private db: QueryExecutor) {}

  async findById(id: number): Promise<Account | null> {
    const result = await this.db.executeQuery<Account>(
      AccountQueries.FIND_BY_ID,
      [id]
    );
    return result.rows._array[0] || null;
  }

  async findAll(): Promise<Account[]> {
    const result = await this.db.executeQuery<Account>(
      AccountQueries.FIND_ALL
    );
    return result.rows._array;
  }

  async findActive(): Promise<Account[]> {
    const result = await this.db.executeQuery<Account>(
      AccountQueries.FIND_ACTIVE
    );
    return result.rows._array;
  }

  async findByType(type: Account['type']): Promise<Account[]> {
    const result = await this.db.executeQuery<Account>(
      AccountQueries.FIND_BY_TYPE,
      [type]
    );
    return result.rows._array;
  }

  async create(account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Promise<Account> {
    const result = await this.db.executeQuery<Account>(
      AccountQueries.INSERT,
      [
        account.name,
        account.type,
        account.icon,
        account.color,
        account.balance ?? 0,
        account.isActive ? 1 : 0,
        account.sortOrder ?? 0
      ]
    );

    if (!result.insertId) {
      throw new Error('Failed to create account');
    }

    return {
      id: result.insertId,
      ...account,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  async update(id: number, entity: Partial<Account>): Promise<boolean> {
    const updates: { fields: string[]; values: any[] } = {
      fields: [],
      values: []
    };

    Object.entries(entity).forEach(([field, value]) => {
      if (value !== undefined && AccountFields.UPDATABLE.includes(field as UpdatableFields)) {
        if (field === 'isActive') {
          updates.values.push(value ? 1 : 0);
        } else {
          updates.values.push(value);
        }
        updates.fields.push(field);
      }
    });

    if (updates.fields.length === 0) return false;

    const query = AccountQueries.generateUpdateQuery(updates.fields);
    updates.values.push(id);

    const result = await this.db.executeQuery<never>(query, updates.values);
    return (result.changes ?? 0) > 0;
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db.executeQuery(
      AccountQueries.DELETE,
      [id]
    );
    return (result.changes ?? 0) > 0;
  }

  async count(): Promise<number> {
    const result = await this.db.executeQuery<{count: number}>(
      AccountQueries.COUNT_ALL
    );
    return result.rows._array[0]?.count ?? 0;
  }

  async updateBalance(id: number, balance: number): Promise<boolean> {
    const result = await this.db.executeQuery(
      AccountQueries.UPDATE_BALANCE,
      [balance, id]
    );
    return (result.changes ?? 0) > 0;
  }

  async adjustBalance(id: number, amount: number): Promise<boolean> {
    const account = await this.findById(id);
    if (!account) return false;
    const newBalance = account.balance + amount;
    return this.updateBalance(id, newBalance);
  }
}