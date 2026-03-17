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
 *
 * The module also exposes a tiny in-memory event bus so that
 * AuthDebugPanel can subscribe to live auth events without prop-drilling.
 */

import { useEffect, useState } from 'react';

export type AuthEvent =
  | 'AUTH_REDIRECT_START'
  | 'AUTH_REDIRECT_RESULT_RESOLVED'
  | 'AUTH_STATE_USER_PRESENT'
  | 'AUTH_STATE_NO_USER'
  | 'AUTH_REDIRECT_TIMEOUT'
  | 'AUTH_NAVIGATE_AFTER_SUCCESS';

export interface AuthLogEntry {
  event: AuthEvent;
  ts: string;
  detail?: Record<string, unknown>;
}

const ENV_DEBUG = import.meta.env.DEV || import.meta.env.VITE_AUTH_DEBUG === '1';

export function isAuthDebugEnabled(): boolean {
  if (ENV_DEBUG) return true;
  try {
    return sessionStorage.getItem('auth:debug') === '1';
  } catch {
    return false;
  }
}

/* ── In-memory event bus (max 20 entries, FIFO) ─────────────────────── */

type Listener = (entry: AuthLogEntry) => void;
const listeners = new Set<Listener>();
const history: AuthLogEntry[] = [];
const MAX_HISTORY = 20;

function notifyListeners(entry: AuthLogEntry): void {
  history.push(entry);
  if (history.length > MAX_HISTORY) history.shift();
  listeners.forEach((fn) => fn(entry));
}

export function subscribeToAuthEvents(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Returns a copy of the current in-memory event history. */
export function getAuthEventHistory(): AuthLogEntry[] {
  return [...history];
}

/* ── React hook ─────────────────────────────────────────────────────── */

/**
 * Returns the live list of auth log entries (re-renders on each new event).
 * Only meaningful inside components — does nothing on the server.
 */
export function useAuthEvents(): AuthLogEntry[] {
  const [entries, setEntries] = useState<AuthLogEntry[]>(() => getAuthEventHistory());

  useEffect(() => {
    const unsubscribe = subscribeToAuthEvents((entry) => {
      setEntries((prev) => {
        const next = [...prev, entry];
        return next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next;
      });
    });
    return unsubscribe;
  }, []);

  return entries;
}

/* ── Main log function ───────────────────────────────────────────────── */

export function authLog(event: AuthEvent, detail?: Record<string, unknown>): void {
  const entry: AuthLogEntry = {
    event,
    ts: new Date().toISOString(),
    ...(detail ? { detail } : {}),
  };

  // Always push to bus (so AuthDebugPanel works even when console logs are off).
  notifyListeners(entry);

  if (!isAuthDebugEnabled()) return;

  // eslint-disable-next-line no-console
  console.log(`[AUTH_EVENT] ${event}`, entry);
}
