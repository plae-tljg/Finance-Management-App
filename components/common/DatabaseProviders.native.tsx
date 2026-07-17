import React from 'react';

/**
 * Native-only wrapper around `expo-sqlite`'s `SQLiteProvider`. Loaded only
 * on Android via Metro's `*.native.tsx` resolution. The matching
 * `DatabaseProviders.web.tsx` provides the web passthrough so the web
 * bundle never imports `expo-sqlite`.
 */
export function DatabaseProviders({ children }: { children: React.ReactNode }) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { SQLiteProvider } = require('expo-sqlite') as typeof import('expo-sqlite');
  return (
    <SQLiteProvider databaseName="finance.db">{children}</SQLiteProvider>
  );
}
