import React from 'react';

/**
 * Web passthrough — no SQLiteProvider since the web bundle talks to the
 * native HTTP server through the `WebDatabase` REST adapter. The web
 * counterpart of `DatabaseProviders.native.tsx`.
 */
export function DatabaseProviders({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
