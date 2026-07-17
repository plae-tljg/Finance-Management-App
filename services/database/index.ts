import { Platform } from 'react-native';
import type { QueryExecutor, DatabaseQueryResult } from './types';
import type { DatabaseServiceType } from './DatabaseService';

export type {
  DatabaseServiceType,
  DatabaseEvent,
} from './DatabaseService';

export type FacadeExtras = {
  isConnected?(): boolean;
  connect?(baseUrl?: string): Promise<void>;
  disconnect?(): void;
};

export type DatabaseServiceFacade = DatabaseServiceType & FacadeExtras;

let _instance: DatabaseServiceFacade | null = null;

const createInstance = (): DatabaseServiceFacade => {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { webDatabase } = require('./web/WebDatabase');
    return webDatabase as DatabaseServiceFacade;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { databaseService } = require('./DatabaseService');
  return databaseService as DatabaseServiceFacade;
};

export const getDatabaseService = (): DatabaseServiceFacade => {
  if (!_instance) {
    _instance = createInstance();
  }
  return _instance;
};

// Back-compat named export — many files import `databaseService` directly.
export const databaseService: DatabaseServiceFacade = new Proxy({} as DatabaseServiceFacade, {
  get(_target, prop: string | symbol) {
    const inst = getDatabaseService();
    const value = (inst as any)[prop];
    return typeof value === 'function' ? value.bind(inst) : value;
  },
});

export type { QueryExecutor, DatabaseQueryResult };