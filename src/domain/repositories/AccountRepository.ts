import { Account } from '../entities/Account';
import { Money } from '../value-objects/Money';

export interface AccountRepository {
  findById(id: string): Promise<Account | null>;
  findAll(): Promise<Account[]>;
  findByType(type: 'cash' | 'bank' | 'credit'): Promise<Account[]>;
  save(account: Account): Promise<void>;
  update(account: Account): Promise<void>;
  delete(id: string): Promise<void>;
  updateBalance(amount: number): Promise<void>;
  getBalance(): Promise<Money>;
  getTotalBalance(): Promise<number>;
  getTotalBalanceByType(type: 'cash' | 'bank' | 'credit'): Promise<number>;
} 