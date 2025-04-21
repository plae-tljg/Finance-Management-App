import { BankBalanceRepository } from '../database/repositories/BankBalanceRepository';
import { DatabaseService } from '../database/DatabaseService';
import type { BankBalance } from '../database/schemas/BankBalance';
import { BankBalanceQueries } from '../database/schemas/BankBalance';

export function useBankBalanceService(databaseService: DatabaseService) {
  const repository = new BankBalanceRepository(databaseService);
  
  const getBankBalance = async (year: number, month: number): Promise<BankBalance | null> => {
    return await repository.findByYearMonth(year, month);
  };

  const getBankBalancesByYear = async (year: number): Promise<BankBalance[]> => {
    return await repository.findByYear(year);
  };

  const updateBankBalance = async (
    year: number,
    month: number,
    balance: Partial<BankBalance>
  ): Promise<BankBalance | null> => {
    try {
      const existingBalance = await repository.findByYearMonth(year, month);
      if (!existingBalance) {
        console.error(`未找到银行余额记录: ${year}年${month}月`);
        return null;
      }

      const success = await repository.getDatabase().transaction(async (tx) => {
        const result = await tx.executeQuery(
          BankBalanceQueries.UPDATE,
          [balance.openingBalance, balance.closingBalance, existingBalance.id]
        );
        return (result.changes ?? 0) > 0;
      });

      if (!success) {
        console.error(`更新银行余额失败: ${year}年${month}月`);
        return null;
      }

      const updatedBalance = await repository.findById(existingBalance.id);
      if (!updatedBalance) {
        console.error(`无法获取更新后的银行余额: ${year}年${month}月`);
        return null;
      }

      return updatedBalance;
    } catch (error) {
      console.error('更新银行余额时发生错误:', error);
      return null;
    }
  };

  const initializeYear = async (year: number): Promise<void> => {
    try {
      const currentMonth = new Date().getMonth() + 1;
      const existingBalance = await repository.findByYearMonth(year, currentMonth);
      
      if (!existingBalance) {
        // 查找上个月的记录
        let previousMonth = currentMonth - 1;
        let previousYear = year;
        if (previousMonth === 0) {
          previousMonth = 12;
          previousYear = year - 1;
        }

        const previousBalance = await repository.findByYearMonth(previousYear, previousMonth);
        const openingBalance = previousBalance?.closingBalance || 0;

        await repository.create({
          year,
          month: currentMonth,
          openingBalance,
          closingBalance: openingBalance // 初始时期末余额等于期初余额
        });
      }
    } catch (error) {
      console.error('初始化银行余额失败:', error);
      throw error;
    }
  };

  return {
    getBankBalance,
    getBankBalancesByYear,
    updateBankBalance,
    initializeYear
  };
} 