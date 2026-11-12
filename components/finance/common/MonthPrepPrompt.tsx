import React, { useCallback } from 'react';
import { Alert } from 'react-native';
import { useMonthPreparation } from '@/hooks/useMonthPreparation';
import { useFinance } from '@/contexts/FinanceContext';
import { MonthPrepBanner } from './MonthPrepBanner';

interface MonthPrepPromptProps {
  year: number;
  month: number;
}

/**
 * Drop-in version of the month-preparation nudge: wires up the status check,
 * the one-tap action, the confirmation dialog and the data refresh.
 *
 * Renders nothing when the month is already prepared or when the user has
 * dismissed the nudge for this month.
 */
export function MonthPrepPrompt({ year, month }: MonthPrepPromptProps) {
  const { status, isPreparing, isActionable, prepare, dismiss } =
    useMonthPreparation(year, month);
  const { refreshAllData } = useFinance();

  const handlePrepare = useCallback(async () => {
    try {
      const result = await prepare();
      if (!result) return;
      await refreshAllData();
      Alert.alert('准备完成', result.summary);
    } catch (error) {
      console.error('准备本月失败:', error);
      Alert.alert('准备失败', '请稍后再试，或手动创建预算和期初余额。');
    }
  }, [prepare, refreshAllData]);

  if (!isActionable) return null;

  return (
    <MonthPrepBanner
      status={status}
      isPreparing={isPreparing}
      onPrepare={handlePrepare}
      onDismiss={dismiss}
    />
  );
}
