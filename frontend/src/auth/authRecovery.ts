/**
 * authRecovery.ts
 *
 * Orchestrates automatic recovery logic for Firebase Auth failures.
 * Centralizes: popup-blocked detection, retry decisions, flag resolution.
 * No React, no Firebase — pure logic, fully testable.
 */

import {
  MAX_AUTH_RECOVERY_RETRIES,
  getAuthRetryCount,
  incrementAuthRetryCount,
  clearAuthTransientStorage,
  getRedirectPendingFlag,
  getLastAuthNext,
} from './authStorage';
import type { AuthIncidentCode } from './authIncidents';

/**
 * Returns true when the current browser should prefer redirect-based sign-in
 * (mobile, tablets, Samsung Internet, etc.) over popup-based sign-in.
 * Popups are typically blocked on mobile.
 */
export function shouldUseRedirectLogin(): boolean {
  if (typeof window === 'undefined') return false;
  return /android|iphone|ipad|ipod|mobile|samsungbrowser|opera mini/i.test(
    window.navigator.userAgent.toLowerCase(),
  );
}

/**
 * Returns true if an automatic recovery retry is still within the allowed limit.
 * Once the limit is reached, the caller must surface a terminal failure.
 */
export function shouldRetryAuthRecovery(): boolean {
  return getAuthRetryCount() < MAX_AUTH_RECOVERY_RETRIES;
}

/**
 * Records a recovery attempt in sessionStorage and returns the new count.
 */
export function markAuthRecoveryAttempt(): number {
  return incrementAuthRetryCount();
}

/**
 * Determines the post-auth navigation target from:
 *  1. The pending redirect flag's `next` field (most authoritative)
 *  2. The last-known `next` stored separately (survives flag expiry)
 *  3. The provided `fallbackPath`
 *
 * Always returns an internal path starting with '/'.
 */
export function resolvePostAuthNavigation(
  fallbackPath = '/mon-compte',
): string {
  const pending = getRedirectPendingFlag();
  const next = pending?.next ?? getLastAuthNext() ?? fallbackPath;

  // Sanitize: must be an internal path
  if (!next.startsWith('/') || next.startsWith('//')) {
    return fallbackPath;
  }
  return next;
}

/**
 * Classifies the auth failure mode based on the observable state,
 * returning the most specific incident code available.
 */
export function classifyAuthFailure(params: {
  hadPendingFlag: boolean;
  hasUser: boolean;
  redirectResultResolved: boolean;
  timedOut: boolean;
  retryExhausted: boolean;
}): AuthIncidentCode {
  if (params.timedOut)                                    return 'AUTH_REDIRECT_TIMEOUT';
  if (params.retryExhausted)                              return 'AUTH_RECOVERY_RETRY_EXHAUSTED';
  if (params.hadPendingFlag && !params.redirectResultResolved) return 'AUTH_REDIRECT_RESULT_EMPTY';
  if (!params.hasUser)                                    return 'AUTH_STATE_NO_USER';
  return 'AUTH_UNKNOWN_ERROR';
}

/**
 * Runs clean-up after a terminal auth failure.
 * Clears all transient storage so the next attempt starts fresh.
 */
export function cleanupAfterTerminalAuthFailure(): void {
  clearAuthTransientStorage();
}

/**
 * Attempts a single recovery by running `callback` once.
 * Increments the retry counter unconditionally before calling.
 *
 * Returns:
 *  - `attempted: false` when the retry limit is already reached (callback NOT called)
 *  - `attempted: true, succeeded: true` on callback success
 *  - `attempted: true, succeeded: false` on callback failure
 */
export async function attemptSingleRecovery(
  callback: () => Promise<void>,
): Promise<{ attempted: boolean; succeeded: boolean }> {
  if (!shouldRetryAuthRecovery()) {
    return { attempted: false, succeeded: false };
  }

  markAuthRecoveryAttempt();

  try {
    await callback();
    return { attempted: true, succeeded: true };
  } catch {
    return { attempted: true, succeeded: false };
  }
}
