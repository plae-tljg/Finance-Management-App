import { useState, useCallback, useEffect } from 'react';
import { databaseService, getDatabaseService } from '@/services/database';

// 全局初始化状态
let isDatabaseInitialized = false;
let initializationInProgress = false;

export function useDatabaseSetup() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const setupDatabase = useCallback(async () => {
    if (isDatabaseInitialized) {
      setIsReady(true);
      return;
    }

    if (initializationInProgress) {
      // Wait for the in-flight init to finish.
      await new Promise<void>((resolve) => {
        const t = setInterval(() => {
          if (isDatabaseInitialized) {
            clearInterval(t);
            resolve();
          }
        }, 50);
      });
      setIsReady(true);
      return;
    }

    initializationInProgress = true;

    try {
      const db = getDatabaseService();

      // Web 模式：直接通过 REST API 连接手机端宿主。
      // 默认使用浏览器当前 origin (即手机端 host)。
      // 从 URL query 中读取 `?token=<PIN>` 并作为 Bearer token 传给服务端。
      const defaultBaseUrl =
        typeof window !== 'undefined'
          ? `${window.location.protocol}//${window.location.host}`
          : '';
      const tokenFromUrl =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('token') ?? undefined
          : undefined;
      await (db as any).connect?.(defaultBaseUrl, tokenFromUrl);

      isDatabaseInitialized = true;
      setIsReady(true);
      setError(null);
    } catch (err) {
      console.error('数据库初始化失败:', err);
      setError(err instanceof Error ? err : new Error('数据库初始化失败'));
      setIsReady(false);
    } finally {
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
