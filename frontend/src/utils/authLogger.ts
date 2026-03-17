/**
 * authLogger.ts
 *
 * Structured auth event logger for the Firebase Google OAuth mobile flow.
 * Events are gated behind an AUTH_DEBUG flag so they are silent in production
 * unless explicitly activated (e.g. via sessionStorage or env flag).
 *
 * Usage:
 *   authLog('AUTH_REDIRECT_START', { provider: 'google' });
 *
 * Enable debug mode at runtime:
 *   sessionStorage.setItem('auth:debug', '1');
 */

export type AuthEvent =
  | 'AUTH_REDIRECT_START'
  | 'AUTH_REDIRECT_RESULT_RESOLVED'
  | 'AUTH_STATE_USER_PRESENT'
  | 'AUTH_STATE_NO_USER'
  | 'AUTH_REDIRECT_TIMEOUT'
  | 'AUTH_NAVIGATE_AFTER_SUCCESS';

const ENV_DEBUG = import.meta.env.DEV || import.meta.env.VITE_AUTH_DEBUG === '1';

function isDebugEnabled(): boolean {
  if (ENV_DEBUG) return true;
  try {
    return sessionStorage.getItem('auth:debug') === '1';
  } catch {
    return false;
  }
}

export function authLog(event: AuthEvent, detail?: Record<string, unknown>): void {
  if (!isDebugEnabled()) return;
  const entry = {
    event,
    ts: new Date().toISOString(),
    ...(detail ? { detail } : {}),
  };
  // eslint-disable-next-line no-console
  console.log(`[AUTH_EVENT] ${event}`, entry);
}
