type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel: LogLevel = __DEV__ ? 'debug' : 'info';

function formatMessage(level: LogLevel, context: string, message: string, data?: unknown): string {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}] [${context}]`;
  if (data !== undefined) {
    return `${prefix} ${message} ${JSON.stringify(data)}`;
  }
  return `${prefix} ${message}`;
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

export const logger = {
  debug(context: string, message: string, data?: unknown) {
    if (shouldLog('debug')) {
      console.debug(formatMessage('debug', context, message, data));
    }
  },

  info(context: string, message: string, data?: unknown) {
    if (shouldLog('info')) {
      console.info(formatMessage('info', context, message, data));
    }
  },

  warn(context: string, message: string, data?: unknown) {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', context, message, data));
    }
  },

  error(context: string, message: string, error?: unknown) {
    if (shouldLog('error')) {
      if (error instanceof Error) {
        console.error(formatMessage('error', context, message), error.message, error.stack);
      } else {
        console.error(formatMessage('error', context, message, error));
      }
    }
  },
};

export type { LogLevel };