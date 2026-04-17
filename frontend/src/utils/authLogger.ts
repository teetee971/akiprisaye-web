/**
 * authLogger.ts
 *
 * Structured auth event logger for the Firebase Google OAuth mobile flow.
 *
 * Usage:
 *   authLog('AUTH_REDIRECT_START', { provider: 'google' });
 *
 * Enable debug mode at runtime (production device):
 *   sessionStorage.setItem('auth:debug', '1'); location.reload();
 *
 * The module exposes:
 *  - An in-memory FIFO event bus (max 20 entries) — authLog() ALWAYS records here
 *  - Optional sessionStorage persistence across redirect page reloads (debug mode only)
 *  - subscribeToAuthEvents / useAuthEvents for live panel updates
 *  - getAuthDiagnosticReport for one-click diagnostics export
 *  - clearAuthHistory for debug state reset
 *
 * Note: authLog() pushes every event into the in-memory history and fires
 * all subscribers unconditionally. Console output and sessionStorage
 * persistence are the only things gated behind the AUTH_DEBUG flag.
 */

import { useEffect, useState } from 'react';
import { logDebug } from '@/utils/logger';

/* ── Event types ─────────────────────────────────────────────────────── */

export type AuthEvent =
  // User intent
  | 'AUTH_CLICK_GOOGLE'
  | 'AUTH_FLOW_MODE_SELECTED'
  // Redirect lifecycle
  | 'AUTH_REDIRECT_FLAG_SET'
  | 'AUTH_REDIRECT_START'
  | 'AUTH_REDIRECT_RESULT_RESOLVED'
  | 'AUTH_CALLBACK_PAGE_LOADED'
  // Auth state
  | 'AUTH_STATE_USER_PRESENT'
  | 'AUTH_STATE_NO_USER'
  // Navigation
  | 'AUTH_NAVIGATE_AFTER_SUCCESS'
  // Failures / incidents
  | 'AUTH_REDIRECT_TIMEOUT'
  | 'AUTH_FINAL_FAILURE'
  | 'AUTH_POPUP_BLOCKED'
  | 'AUTH_PENDING_FLAG_EXPIRED'
  | 'AUTH_PENDING_FLAG_INVALID'
  // Recovery
  | 'AUTH_RETRY_TRIGGERED'
  | 'AUTH_RECOVERY_RETRY_EXHAUSTED';

export interface AuthLogEntry {
  event: AuthEvent;
  ts: string;
  detail?: Record<string, unknown>;
}

/* ── Debug flag ──────────────────────────────────────────────────────── */

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

/* ── Trace persistence (debug mode only) ────────────────────────────── */

const TRACE_KEY = 'auth:trace';
const TRACE_TTL = 30 * 60 * 1000; // 30 minutes

interface PersistedTrace {
  events: AuthLogEntry[];
  savedAt: number;
}

function loadPersistedTrace(): void {
  try {
    const raw = sessionStorage.getItem(TRACE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as PersistedTrace;
    if (!parsed?.savedAt || Date.now() - parsed.savedAt > TRACE_TTL) {
      sessionStorage.removeItem(TRACE_KEY);
      return;
    }
    for (const e of parsed.events ?? []) {
      if (!history.some((h) => h.ts === e.ts && h.event === e.event)) {
        history.push(e);
      }
    }
    if (history.length > MAX_HISTORY) {
      history.splice(0, history.length - MAX_HISTORY);
    }
  } catch {
    // sessionStorage unavailable or malformed — fail silently
  }
}

function persistTrace(): void {
  if (!isAuthDebugEnabled()) return;
  try {
    const payload: PersistedTrace = { events: [...history], savedAt: Date.now() };
    sessionStorage.setItem(TRACE_KEY, JSON.stringify(payload));
  } catch {
    // Fail silently
  }
}

function notifyListeners(entry: AuthLogEntry): void {
  history.push(entry);
  if (history.length > MAX_HISTORY) history.shift();
  persistTrace();
  listeners.forEach((fn) => fn(entry));
}

/* ── Public API ──────────────────────────────────────────────────────── */

export function subscribeToAuthEvents(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Returns a snapshot of the current in-memory event history. */
export function getAuthEventHistory(): AuthLogEntry[] {
  return [...history];
}

/** Clears all in-memory events and removes the persisted trace. */
export function clearAuthHistory(): void {
  history.length = 0;
  try {
    sessionStorage.removeItem(TRACE_KEY);
  } catch {
    /* */
  }
}

/* ── Diagnostic report ───────────────────────────────────────────────── */

export interface AuthDiagnosticReport {
  generatedAt: string;
  debugEnabled: boolean;
  eventCount: number;
  events: AuthLogEntry[];
}

/** Generates a safe diagnostic snapshot for copy/export. Never includes tokens. */
export function getAuthDiagnosticReport(): AuthDiagnosticReport {
  return {
    generatedAt: new Date().toISOString(),
    debugEnabled: isAuthDebugEnabled(),
    eventCount: history.length,
    events: getAuthEventHistory(),
  };
}

/* ── React hook ─────────────────────────────────────────────────────── */

/** Re-renders on every new auth event. Use inside AuthDebugPanel. */
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

/**
 * Logs a structured auth event.
 * Always pushes to the in-memory bus (panel works even in production).
 * Only emits a logDebug call when debug mode is active.
 */
export function authLog(event: AuthEvent, detail?: Record<string, unknown>): void {
  const entry: AuthLogEntry = {
    event,
    ts: new Date().toISOString(),
    ...(detail ? { detail } : {}),
  };

  notifyListeners(entry);

  if (isAuthDebugEnabled()) {
    logDebug(`[AUTH_EVENT] ${event}`, entry);
  }
}

// Restore any trace written before an OAuth page redirect on module load.
loadPersistedTrace();
