import { useState, useCallback, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDatabaseSetup } from '@/hooks/useDatabaseSetup';
import {
  useMonthPreparationService,
  type MonthPreparationStatus,
  type PrepareMonthResult,
} from '@/services/business/MonthPreparationService';

const dismissalKey = (year: number, month: number) =>
  `monthPrep.dismissed.${year}-${month}`;

/**
 * Tracks how ready the given month is and runs the one-tap setup.
 *
 * The dismissal is persisted per month, so a user who already handled the
 * month-of setup does not get nagged on every launch — but it comes back
 * automatically for the next month.
 */
export function useMonthPreparation(year: number, month: number) {
  const { isReady, databaseService } = useDatabaseSetup();

  const service = useMemo(
    () =>
      isReady && databaseService
        ? useMonthPreparationService(databaseService)
        : null,
    [isReady, databaseService],
  );

  const [status, setStatus] = useState<MonthPreparationStatus | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true);

  const refresh = useCallback(async () => {
    if (!service) return;
    try {
      const next = await service.getStatus(year, month);
      setStatus(next);
      const dismissed = await AsyncStorage.getItem(dismissalKey(year, month));
      setIsDismissed(dismissed === '1');
    } catch (error) {
      console.error('检查本月准备状态失败:', error);
    }
  }, [service, year, month]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const prepare = useCallback(async (): Promise<PrepareMonthResult | null> => {
    if (!service) return null;
    setIsPreparing(true);
    try {
      const result = await service.prepareMonth(year, month);
      // Having prepared it, the nudge has served its purpose.
      await AsyncStorage.setItem(dismissalKey(year, month), '1');
      setIsDismissed(true);
      await refresh();
      return result;
    } catch (error) {
      console.error('准备本月失败:', error);
      throw error;
    } finally {
      setIsPreparing(false);
    }
  }, [service, year, month, refresh]);

  const dismiss = useCallback(async () => {
    await AsyncStorage.setItem(dismissalKey(year, month), '1');
    setIsDismissed(true);
  }, [year, month]);

  const isActionable =
    !!status && !status.isComplete && !isDismissed && !isPreparing;

  return { status, isPreparing, isDismissed, isActionable, prepare, dismiss, refresh };
}
