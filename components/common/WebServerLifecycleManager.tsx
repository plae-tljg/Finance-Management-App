import React from 'react';
import { useWebServerLifecycle } from '@/hooks/useWebServerLifecycle';

interface Props {
  backgroundTimeoutMs?: number;
}

/**
 * Component that wires up auto-stop on background for the Web Mode server.
 * Must be rendered inside the FinanceProvider so the hooks have access to
 * React state. Has no visual output.
 */
export function WebServerLifecycleManager({ backgroundTimeoutMs }: Props) {
  useWebServerLifecycle({ backgroundTimeoutMs });
  return null;
}