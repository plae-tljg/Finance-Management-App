import { useCallback, useEffect, useRef, useState } from 'react';
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

const { FinanceWebServer } = NativeModules;

export interface WebServerStatus {
  running: boolean;
  port: number;
  ipAddress: string | null;
  baseUrl: string | null;
  activeConnections: number;
}

export interface ConnectionLogEntry {
  timestamp: number;
  method: string;
  path: string;
  status: number;
  remoteAddress: string | null;
}

const NO_NATIVE_MODULE = !FinanceWebServer;

const initialStatus: WebServerStatus = {
  running: false,
  port: 8080,
  ipAddress: null,
  baseUrl: null,
  activeConnections: 0,
};

/**
 * Hook that wraps the native `FinanceWebServer` module on Android.
 *
 * On web this is a no-op: the running state is always `false` and
 * `start`/`stop` do nothing, because the web build itself IS the client
 * (it talks to whatever native server it discovers via `?host=` query
 * parameter or window.location.host).
 */
export function useWebServer() {
  const [status, setStatus] = useState<WebServerStatus>(initialStatus);
  const [error, setError] = useState<Error | null>(null);
  const startedRef = useRef(false);

  const refresh = useCallback(async () => {
    if (Platform.OS !== 'android' || NO_NATIVE_MODULE) return;
    try {
      const s: any = await FinanceWebServer.getStatus();
      setStatus({
        running: !!s?.running,
        port: s?.port ?? 8080,
        ipAddress: s?.ipAddress ?? null,
        baseUrl: s?.ipAddress ? `http://${s.ipAddress}:${s.port ?? 8080}` : null,
        activeConnections: s?.activeConnections ?? 0,
      });
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android' || NO_NATIVE_MODULE) return;
    refresh();
    let cancelled = false;
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const fetchConnectionLog = useCallback(async (): Promise<ConnectionLogEntry[]> => {
    if (Platform.OS !== 'android' || NO_NATIVE_MODULE) return [];
    try {
      const raw: any[] = await FinanceWebServer.getConnectionLog();
      return raw.map((r) => ({
        timestamp: Number(r.timestamp ?? 0),
        method: String(r.method ?? ''),
        path: String(r.path ?? ''),
        status: Number(r.status ?? 0),
        remoteAddress: r.remoteAddress ?? null,
      }));
    } catch {
      return [];
    }
  }, []);

  const start = useCallback(async (port = 8080, pin?: string): Promise<WebServerStatus> => {
    if (Platform.OS !== 'android' || NO_NATIVE_MODULE) {
      throw new Error('WebServer module is only available on Android in this build');
    }
    setError(null);
    try {
      const res = await FinanceWebServer.start(port, pin ?? null);
      const next: WebServerStatus = {
        running: !!res?.running,
        port: res?.port ?? port,
        ipAddress: res?.ipAddress ?? null,
        baseUrl: res?.baseUrl ?? null,
        activeConnections: 0,
      };
      setStatus(next);
      startedRef.current = next.running;
      return next;
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err);
      throw err;
    }
  }, []);

  const stop = useCallback(async () => {
    if (Platform.OS !== 'android' || NO_NATIVE_MODULE) return;
    try {
      await FinanceWebServer.stop();
      setStatus((prev) => ({ ...prev, running: false, activeConnections: 0 }));
      startedRef.current = false;
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err);
      throw err;
    }
  }, []);

  return {
    status,
    error,
    start,
    stop,
    refresh,
    fetchConnectionLog,
    isAvailable: !NO_NATIVE_MODULE,
  };
}