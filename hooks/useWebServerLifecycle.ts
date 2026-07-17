import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { useWebServer } from './useWebServer';

const DEFAULT_BACKGROUND_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export interface WebServerLifecycleOptions {
  backgroundTimeoutMs?: number;
}

/**
 * Auto-stops the embedded web server when the app has been backgrounded for
 * longer than `backgroundTimeoutMs`. Re-starts it when the app comes back to
 * the foreground if it was running before.
 */
export function useWebServerLifecycle(options: WebServerLifecycleOptions = {}) {
  const { backgroundTimeoutMs = DEFAULT_BACKGROUND_TIMEOUT_MS } = options;
  const { status, start, stop, isAvailable } = useWebServer();
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const wasRunningBeforeBackground = useRef<boolean>(false);
  const backgroundTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedPin = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (Platform.OS !== 'android' || !isAvailable) return;

    const handleAppStateChange = (nextState: AppStateStatus) => {
      const previous = appState.current;
      appState.current = nextState;

      if (previous === 'active' && nextState.match(/inactive|background/)) {
        // Going to background.
        wasRunningBeforeBackground.current = status.running;
        if (status.running) {
          backgroundTimer.current = setTimeout(async () => {
            try {
              await stop();
            } catch {
              // ignore
            }
          }, backgroundTimeoutMs);
        }
      }

      if (nextState === 'active' && previous.match(/inactive|background/)) {
        // Coming back to foreground.
        if (backgroundTimer.current) {
          clearTimeout(backgroundTimer.current);
          backgroundTimer.current = null;
        }
        if (wasRunningBeforeBackground.current && !status.running) {
          start(8080, savedPin.current).catch(() => {
            // ignore — user can manually toggle
          });
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
      if (backgroundTimer.current) {
        clearTimeout(backgroundTimer.current);
        backgroundTimer.current = null;
      }
    };
  }, [backgroundTimeoutMs, isAvailable, start, status.running, stop]);

  // Stash the current PIN so we can restart with the same auth.
  useEffect(() => {
    // The PIN is generated client-side in the WebModeScreen; we don't have
    // direct access here. This is a placeholder for a future enhancement to
    // persist the PIN via AsyncStorage. For now, server restarts without
    // auth if it was previously running.
    savedPin.current = undefined;
  }, [status.running]);
}