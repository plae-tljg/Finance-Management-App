import { useState, useCallback, useEffect } from 'react';
import * as SQLite from 'expo-sqlite';
import { initializeDatabase } from '@/services/database/initialize';
import { databaseService } from '@/services/database/DatabaseService';

// 全局初始化状态
let isDatabaseInitialized = false;
let initializationPromise: Promise<any> | null = null;
let initializationInProgress = false;

export function useDatabaseSetup() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const setupDatabase = useCallback(async () => {
    // 如果数据库已经初始化，直接返回
    if (isDatabaseInitialized) {
      setIsReady(true);
      return;
    }

    // 如果正在初始化，等待初始化完成
    if (initializationInProgress) {
      try {
        await initializationPromise;
        setIsReady(true);
        return;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('数据库初始化失败'));
        setIsReady(false);
        return;
      }
    }

    initializationInProgress = true;
    
    try {
      // 创建新的数据库连接
      const db = await SQLite.openDatabaseAsync('FinanceManager.db', {
        useNewConnection: true
      });

      // 开始初始化
      initializationPromise = (async () => {
        try {
          // 初始化数据库服务
          await initializeDatabase(db);
          isDatabaseInitialized = true;
          console.log('数据库初始化完成');
        } catch (err) {
          console.error('数据库初始化失败:', err);
          throw err;
        } finally {
          initializationPromise = null;
          initializationInProgress = false;
        }
      })();

      await initializationPromise;
      setIsReady(true);
      setError(null);
    } catch (err) {
      console.error('数据库初始化失败:', err);
      setError(err instanceof Error ? err : new Error('数据库初始化失败'));
      setIsReady(false);
      initializationInProgress = false;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      await setupDatabase();
      if (!isMounted) return;
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, [setupDatabase]);

  const retry = useCallback(async () => {
    setError(null);
    await setupDatabase();
  }, [setupDatabase]);

  return { isReady, error, databaseService, retry };
}