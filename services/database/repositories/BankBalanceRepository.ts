import { BankBalance, BankBalanceQueries } from '../schemas/BankBalance';
import { BaseRepository } from './BaseRepository';
import { QueryExecutor } from '../types';

export class BankBalanceRepository implements BaseRepository<BankBalance> {
  constructor(private db: QueryExecutor) {}

  getDatabase(): QueryExecutor {
    return this.db;
  }

  async findById(id: number): Promise<BankBalance | null> {
    const result = await this.db.executeQuery<BankBalance>(
      BankBalanceQueries.FIND_BY_ID,
      [id]
    );
    return result.rows._array[0] || null;
  }

  async findAll(): Promise<BankBalance[]> {
    const result = await this.db.executeQuery<BankBalance>(
      BankBalanceQueries.FIND_ALL
    );
    return result.rows._array;
  }

  async create(balance: Omit<BankBalance, 'id' | 'createdAt' | 'updatedAt'>): Promise<BankBalance> {
    const result = await this.db.executeQuery<BankBalance>(
      BankBalanceQueries.INSERT,
      [balance.year, balance.month, balance.openingBalance, balance.closingBalance]
    );
    return result.rows._array[0];
  }

  async update(id: number, balance: Partial<BankBalance>): Promise<boolean> {
    const result = await this.db.executeQuery<BankBalance>(
      BankBalanceQueries.UPDATE,
      [balance.openingBalance, balance.closingBalance, id]
    );
    return (result.changes ?? 0) > 0;
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db.executeQuery<BankBalance>(
      BankBalanceQueries.DELETE,
      [id]
    );
    return (result.changes ?? 0) > 0;
  }

  async count(): Promise<number> {
    const result = await this.db.executeQuery<{count: number}>(
      BankBalanceQueries.COUNT_ALL
    );
    return result.rows._array[0]?.count ?? 0;
  }

  async findByYearMonth(year: number, month: number): Promise<BankBalance | null> {
    const result = await this.db.executeQuery<BankBalance>(
      BankBalanceQueries.FIND_BY_YEAR_MONTH,
      [year, month]
    );
    return result.rows._array[0] || null;
  }

  async findByYear(year: number): Promise<BankBalance[]> {
    const result = await this.db.executeQuery<BankBalance>(
      BankBalanceQueries.FIND_BY_YEAR,
      [year]
    );
    return result.rows._array;
  }

  async initializeYear(year: number): Promise<void> {
    try {
      const existingBalances = await this.findByYear(year);
      if (existingBalances.length > 0) return;

      const balances = Array.from({ length: 12 }, (_, i) => ({
        year,
        month: i + 1,
        openingBalance: 0,
        closingBalance: 0
      }));

      await this.db.transaction(async (tx) => {
        for (const balance of balances) {
          await tx.executeQuery(
            BankBalanceQueries.INSERT,
            [balance.year, balance.month, balance.openingBalance, balance.closingBalance]
          );
        }
      });
    } catch (error) {
      console.error('初始化年度银行余额失败:', error);
      throw error;
    }
  }
} 