/**
 * authStorage.ts
 *
 * Single access layer for all auth-related sessionStorage state.
 * No component should read/write auth sessionStorage directly.
 *
 * Keys managed here:
 *  auth:return:pending  — redirect pending flag (provider + next + TTL)
 *  auth:retry-count     — auto-recovery attempt counter
 *  auth:last-provider   — last known provider (survives flag cleanup)
 *  auth:last-next       — last known next-path (survives flag cleanup)
 */

import { authLog } from '@/utils/authLogger';

/* ── Constants ──────────────────────────────────────────────────────────── */

export const REDIRECT_PENDING_KEY     = 'auth:return:pending';
export const AUTH_RETRY_COUNT_KEY     = 'auth:retry-count';
export const AUTH_LAST_PROVIDER_KEY   = 'auth:last-provider';
export const AUTH_LAST_NEXT_KEY       = 'auth:last-next';

/** Maximum age (ms) for the redirect-pending flag before auto-expiry. */
export const REDIRECT_PENDING_TTL_MS = 5 * 60 * 1000; // 5 minutes

/** Maximum number of auto-recovery retries per flow. */
export const MAX_AUTH_RECOVERY_RETRIES = 1;

/* ── Types ──────────────────────────────────────────────────────────────── */

export type AuthProviderName = 'google' | 'facebook' | 'apple';

export interface RedirectPendingData {
  provider: AuthProviderName;
  /** Destination path after successful sign-in. */
  next: string;
  /** Unix ms timestamp of when the redirect was initiated. */
  ts: number;
}

/* ── Storage access ─────────────────────────────────────────────────────── */

function safeStorage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/* ── Redirect pending flag ──────────────────────────────────────────────── */

/**
 * Writes the redirect-pending flag to sessionStorage.
 * Also persists last-known provider and next-path for diagnostic use.
 */
export function setRedirectPendingFlag(
  data: Omit<RedirectPendingData, 'ts'>,
): void {
  const storage = safeStorage();
  if (!storage) return;

  const payload: RedirectPendingData = { ...data, ts: Date.now() };
  storage.setItem(REDIRECT_PENDING_KEY, JSON.stringify(payload));
  storage.setItem(AUTH_LAST_PROVIDER_KEY, data.provider);
  storage.setItem(AUTH_LAST_NEXT_KEY, data.next);
}

/**
 * Reads the redirect-pending flag.
 * Returns null if:
 *  - flag is absent
 *  - flag JSON is malformed  → logs AUTH_PENDING_FLAG_INVALID
 *  - flag is older than TTL  → logs AUTH_PENDING_FLAG_EXPIRED
 */
export function getRedirectPendingFlag(): RedirectPendingData | null {
  const storage = safeStorage();
  if (!storage) return null;

  const raw = storage.getItem(REDIRECT_PENDING_KEY);
  if (!raw) return null;

  let data: RedirectPendingData;
  try {
    data = JSON.parse(raw) as RedirectPendingData;
  } catch {
    storage.removeItem(REDIRECT_PENDING_KEY);
    authLog('AUTH_PENDING_FLAG_INVALID', { reason: 'json-parse-error' });
    return null;
  }

  if (!data?.provider || !data?.next || typeof data?.ts !== 'number') {
    storage.removeItem(REDIRECT_PENDING_KEY);
    authLog('AUTH_PENDING_FLAG_INVALID', { reason: 'missing-fields', raw: raw.slice(0, 80) });
    return null;
  }

  if (Date.now() - data.ts > REDIRECT_PENDING_TTL_MS) {
    storage.removeItem(REDIRECT_PENDING_KEY);
    authLog('AUTH_PENDING_FLAG_EXPIRED', { ts: data.ts, ageMs: Date.now() - data.ts });
    return null;
  }

  return data;
}

/** Removes the redirect-pending flag. */
export function clearRedirectPendingFlag(): void {
  safeStorage()?.removeItem(REDIRECT_PENDING_KEY);
}

/* ── Retry counter ──────────────────────────────────────────────────────── */

/** Returns the current number of auto-recovery attempts (0 if none). */
export function getAuthRetryCount(): number {
  const raw = safeStorage()?.getItem(AUTH_RETRY_COUNT_KEY) ?? '0';
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/** Increments the retry counter and returns the new value. */
export function incrementAuthRetryCount(): number {
  const next = getAuthRetryCount() + 1;
  safeStorage()?.setItem(AUTH_RETRY_COUNT_KEY, String(next));
  return next;
}

/** Resets the retry counter. */
export function resetAuthRetryCount(): void {
  safeStorage()?.removeItem(AUTH_RETRY_COUNT_KEY);
}

/* ── Diagnostic helpers ─────────────────────────────────────────────────── */

/** Returns the last known provider (persists after flag cleanup). */
export function getLastAuthProvider(): AuthProviderName | null {
  const v = safeStorage()?.getItem(AUTH_LAST_PROVIDER_KEY) ?? null;
  if (v === 'google' || v === 'facebook' || v === 'apple') return v;
  return null;
}

/** Returns the last known next-path (persists after flag cleanup). */
export function getLastAuthNext(): string | null {
  return safeStorage()?.getItem(AUTH_LAST_NEXT_KEY) ?? null;
}

/**
 * Clears all transient auth state from sessionStorage.
 * Call after successful auth or final failure.
 */
export function clearAuthTransientStorage(): void {
  const storage = safeStorage();
  if (!storage) return;
  storage.removeItem(REDIRECT_PENDING_KEY);
  storage.removeItem(AUTH_RETRY_COUNT_KEY);
  storage.removeItem(AUTH_LAST_PROVIDER_KEY);
  storage.removeItem(AUTH_LAST_NEXT_KEY);
}
