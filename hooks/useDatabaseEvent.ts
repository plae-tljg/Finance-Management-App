import { useEffect, useRef } from 'react';
import { databaseService } from '@/services/database/DatabaseService';
import type { DatabaseEvent } from '@/services/database/DatabaseService';

const DEBOUNCE_MS = 100;

export function useDatabaseEvent(event: DatabaseEvent, callback: () => void) {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const handler = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current();
        timeoutRef.current = null;
      }, DEBOUNCE_MS);
    };
    const unsubscribe = databaseService.on(event, handler);
    return () => {
      unsubscribe();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [event]);
}

export function useTransactionUpdate(callback: () => void) {
  useDatabaseEvent('transaction_updated', callback);
}

export function useBudgetUpdate(callback: () => void) {
  useDatabaseEvent('budget_updated', callback);
}

export function useCategoryUpdate(callback: () => void) {
  useDatabaseEvent('category_updated', callback);
} 