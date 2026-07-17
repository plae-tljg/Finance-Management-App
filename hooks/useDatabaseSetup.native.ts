import { useState, useCallback, useEffect } from 'react';
import { databaseService, getDatabaseService } from '@/services/database';
import type { DatabaseServiceType } from '@/services/database';

// 全局初始化状态
let isDatabaseInitialized = false;
let initializationPromise: Promise<any> | null = null;
let initializationInProgress = false;

export function useDatabaseSetup() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const setupDatabase = useCallback(async () => {
    if (isDatabaseInitialized) {
      setIsReady(true);
      return;
    }

    if (initializationInProgress && initializationPromise) {
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
      const db = getDatabaseService() as DatabaseServiceType;

      // Native 模式：expo-sqlite 初始化路径。Metro 在 web 打包时把
      // `expo-sqlite` 替换为 stub（见 metro.config.js），所以这里只在原生
      // 构建里真正工作。
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const SQLite = require('expo-sqlite');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { initializeDatabase } = require('@/services/database/initialize');

      const sqliteDb = await SQLite.openDatabaseAsync('FinanceManager.db', {
        useNewConnection: true,
      });

      initializationPromise = (async () => {
        try {
          await initializeDatabase(sqliteDb);
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
