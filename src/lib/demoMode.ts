/**
 * Demo mode detection utilities.
 *
 * Demo mode is active when:
 *   1. VITE_DEMO_MODE=true in .env
 *   2. The stored auth token is a demo token (starts with 'demo_token_')
 *   3. Explicitly passed network error signals unavailability
 */

import { getToken } from './api';

const DEMO_TOKEN_PREFIX = 'demo_token_';

/** Check if demo mode is forced via env */
export const isDemoModeEnv = (): boolean =>
  (import.meta.env.VITE_DEMO_MODE as string) === 'true';

/** Check if the current session is using a demo (offline) token */
export const isDemoSession = (): boolean => {
  const token = getToken();
  return token !== null && token.startsWith(DEMO_TOKEN_PREFIX);
};

/**
 * Returns true if we should use demo services for data fetching.
 * Auth: always tries real backend first, falls back on network error.
 * Data services: use demo if session is demo-based OR demo mode is forced.
 */
export const shouldUseDemo = (): boolean => isDemoModeEnv() || isDemoSession();

/**
 * Wraps a real service call with an automatic demo fallback.
 * If the network call throws a TypeError (network failure), calls demoFn instead.
 * Other errors (4xx, 5xx) are re-thrown as-is.
 */
export const withDemoFallback = async <T>(
  realFn: () => Promise<T>,
  demoFn: () => Promise<T>
): Promise<T> => {
  if (shouldUseDemo()) {
    return demoFn();
  }
  try {
    return await realFn();
  } catch (err: unknown) {
    // Network error (TypeError: Failed to fetch) → fall back to demo
    if (err instanceof TypeError) {
      console.warn('[Chovique] Backend unreachable — using demo fallback.');
      return demoFn();
    }
    throw err;
  }
};
