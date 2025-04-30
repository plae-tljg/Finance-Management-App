import { Account } from '../../domain/entities/Account';
import { AccountRepository } from '../../domain/repositories/AccountRepository';
import { BaseRepository } from './BaseRepository';
import { AccountEntity } from '../database/entities/AccountEntity';
import { Money } from '../../domain/value-objects/Money';

export class AccountRepositoryImpl extends BaseRepository<Account> implements AccountRepository {
  private static readonly DEFAULT_ACCOUNT_ID = 'default';

  async findAll(): Promise<Account[]> {
    const rows = await this.executeQuery<any>(`SELECT * FROM ${AccountEntity.TABLE_NAME}`);
    return rows.map(AccountEntity.toDomain);
  }

  async findById(id: string): Promise<Account | null> {
    const rows = await this.executeQuery<any>(
      `SELECT * FROM ${AccountEntity.TABLE_NAME} WHERE id = ?`,
      [id]
    );
    return rows.length > 0 ? AccountEntity.toDomain(rows[0]) : null;
  }

  async create(account: Account): Promise<void> {
    const data = AccountEntity.toPersistence(account);
    await this.executeUpdate(
      `INSERT INTO ${AccountEntity.TABLE_NAME} (id, name, type, opening_balance, closing_balance, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.id,
        data.name,
        data.type,
        data.opening_balance,
        data.closing_balance,
        data.created_at,
        data.updated_at
      ]
    );
  }

  async update(account: Account): Promise<void> {
    const data = AccountEntity.toPersistence(account);
    await this.executeUpdate(
      `UPDATE ${AccountEntity.TABLE_NAME}
       SET name = ?, type = ?, opening_balance = ?, closing_balance = ?, updated_at = ?
       WHERE id = ?`,
      [
        data.name,
        data.type,
        data.opening_balance,
        data.closing_balance,
        data.updated_at,
        data.id
      ]
    );
  }

  async delete(id: string): Promise<void> {
    await this.executeUpdate(
      `DELETE FROM ${AccountEntity.TABLE_NAME} WHERE id = ?`,
      [id]
    );
  }

  async findByType(type: string): Promise<Account[]> {
    const rows = await this.executeQuery<any>(
      `SELECT * FROM ${AccountEntity.TABLE_NAME} WHERE type = ?`,
      [type]
    );
    return rows.map(AccountEntity.toDomain);
  }

  async save(account: Account): Promise<void> {
    await this.create(account);
  }

  async updateBalance(amount: number): Promise<void> {
    await this.executeUpdate(
      `UPDATE ${AccountEntity.TABLE_NAME} 
       SET balance = balance + ? 
       WHERE id = ?`,
      [amount, AccountRepositoryImpl.DEFAULT_ACCOUNT_ID]
    );
  }

  async getBalance(): Promise<Money> {
    const rows = await this.executeQuery<any>(
      `SELECT balance FROM ${AccountEntity.TABLE_NAME} WHERE id = ?`,
      [AccountRepositoryImpl.DEFAULT_ACCOUNT_ID]
    );
    return new Money(rows[0]?.balance || 0);
  }

  async getTotalBalance(): Promise<number> {
    const rows = await this.executeQuery<any>(
      `SELECT SUM(balance) as total FROM ${AccountEntity.TABLE_NAME}`
    );
    return rows[0]?.total || 0;
  }

  async getTotalBalanceByType(type: 'cash' | 'bank' | 'credit'): Promise<number> {
    const rows = await this.executeQuery<any>(
      `SELECT SUM(balance) as total FROM ${AccountEntity.TABLE_NAME} WHERE type = ?`,
      [type]
    );
    return rows[0]?.total || 0;
  }
} 