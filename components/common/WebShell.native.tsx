import React from 'react';

/**
 * Native counterpart to `WebShell.web.tsx`. On web, `WebShell` wraps the
 * navigator with a desktop-friendly top nav, a max-width content column,
 * and a real connecting / error state. On native, the phone UI is
 * authoritative (bottom tab bar, native stack), so this just renders
 * children unchanged.
 *
 * The `.web.tsx` / `.native.tsx` split lets the same `import` resolve to
 * the right module per platform via Metro's default platform resolver —
 * no conditional `require`, no bundler config needed.
 */
export function WebShell({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export default WebShell;
