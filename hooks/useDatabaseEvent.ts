import { useEffect } from 'react';
import { databaseService } from '@/services/database/DatabaseService';
import type { DatabaseEvent } from '@/services/database/DatabaseService';

export function useDatabaseEvent(event: DatabaseEvent, callback: () => void) {
  useEffect(() => {
    const unsubscribe = databaseService.on(event, callback);
    return () => {
      unsubscribe();
    };
  }, [event, callback]);
}

// 预定义的事件hook
export function useTransactionUpdate(callback: () => void) {
  useDatabaseEvent('transaction_updated', callback);
}

export function useBudgetUpdate(callback: () => void) {
  useDatabaseEvent('budget_updated', callback);
}

export function useCategoryUpdate(callback: () => void) {
  useDatabaseEvent('category_updated', callback);
} 