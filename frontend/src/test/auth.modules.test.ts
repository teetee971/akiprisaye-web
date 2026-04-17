/**
 * auth.modules.test.ts
 *
 * Unit tests for all 6 pure-logic auth modules:
 *   src/auth/authStateMachine.ts
 *   src/auth/authIncidents.ts
 *   src/auth/authStorage.ts
 *   src/auth/authTelemetry.ts
 *   src/auth/authRecovery.ts
 *   src/auth/authSelectors.ts
 *
 * No React, no Firebase, no mocking required — pure functions only.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── authStateMachine ──────────────────────────────────────────────────────────
import {
  isValidAuthTransition,
  nextAuthFlowState,
  isAuthBusy,
  isAuthTerminal,
  canShowLoginForm,
  shouldShowAuthSkeleton,
  shouldRedirectAuthenticatedUser,
} from '../auth/authStateMachine';
import type { AuthFlowState } from '../auth/authStateMachine';

// ── authIncidents ─────────────────────────────────────────────────────────────
import {
  AUTH_INCIDENTS,
  getAuthIncidentMeta,
  getAuthIncidentUserMessage,
} from '../auth/authIncidents';
import type { AuthIncidentCode } from '../auth/authIncidents';

// ── authStorage ───────────────────────────────────────────────────────────────
import {
  REDIRECT_PENDING_KEY,
  REDIRECT_PENDING_TTL_MS,
  MAX_AUTH_RECOVERY_RETRIES,
  setRedirectPendingFlag,
  getRedirectPendingFlag,
  clearRedirectPendingFlag,
  getAuthRetryCount,
  incrementAuthRetryCount,
  resetAuthRetryCount,
  getLastAuthProvider,
  getLastAuthNext,
  clearAuthTransientStorage,
} from '../auth/authStorage';

// ── authTelemetry ─────────────────────────────────────────────────────────────
import {
  truncateUid,
  createAuthTelemetryEvent,
  formatAuthTelemetryEvent,
  formatAuthDiagnosticReport,
} from '../auth/authTelemetry';

// ── authRecovery ──────────────────────────────────────────────────────────────
import {
  shouldUseRedirectLogin,
  shouldRetryAuthRecovery,
  markAuthRecoveryAttempt,
  resolvePostAuthNavigation,
  classifyAuthFailure,
  cleanupAfterTerminalAuthFailure,
  attemptSingleRecovery,
} from '../auth/authRecovery';

// ── authSelectors ─────────────────────────────────────────────────────────────
import {
  selectShouldShowLoginForm,
  selectShouldShowAuthSkeleton,
  selectShouldShowAuthenticatedHeader,
  selectShouldRedirectAwayFromLogin,
  selectHasRecoverableIncident,
} from '../auth/authSelectors';
import type { AuthViewModelInput } from '../auth/authSelectors';

/* ── Mock authLogger so authStorage tests don't crash ─────────────────────── */
vi.mock('../utils/authLogger', () => ({ authLog: vi.fn() }));

// ═══════════════════════════════════════════════════════════════════════════════
// 1. authStateMachine
// ═══════════════════════════════════════════════════════════════════════════════

describe('authStateMachine — isValidAuthTransition', () => {
  it('allows idle → starting', () => {
    expect(isValidAuthTransition('idle', 'starting')).toBe(true);
  });

  it('allows starting → redirecting', () => {
    expect(isValidAuthTransition('starting', 'redirecting')).toBe(true);
  });

  it('allows resolving → authenticated', () => {
    expect(isValidAuthTransition('resolving', 'authenticated')).toBe(true);
  });

  it('allows resolving → idle (no user after OAuth)', () => {
    expect(isValidAuthTransition('resolving', 'idle')).toBe(true);
  });

  it('rejects idle → authenticated (not a direct transition)', () => {
    expect(isValidAuthTransition('idle', 'authenticated')).toBe(false);
  });

  it('rejects authenticated → redirecting', () => {
    expect(isValidAuthTransition('authenticated', 'redirecting')).toBe(false);
  });
});

describe('authStateMachine — nextAuthFlowState', () => {
  it('returns the next state when transition is valid', () => {
    expect(nextAuthFlowState('idle', 'starting')).toBe('starting');
  });

  it('returns current state when transition is invalid (no-op)', () => {
    expect(nextAuthFlowState('idle', 'authenticated')).toBe('idle');
  });

  it('allows recovery → authenticated', () => {
    expect(nextAuthFlowState('recovering', 'authenticated')).toBe('authenticated');
  });
});

describe('authStateMachine — isAuthBusy', () => {
  const busyStates: AuthFlowState[] = [
    'starting',
    'redirecting',
    'returning',
    'resolving',
    'recovering',
  ];
  const quietStates: AuthFlowState[] = ['idle', 'authenticated', 'failed'];

  for (const state of busyStates) {
    it(`returns true for ${state}`, () => {
      expect(isAuthBusy(state)).toBe(true);
    });
  }
  for (const state of quietStates) {
    it(`returns false for ${state}`, () => {
      expect(isAuthBusy(state)).toBe(false);
    });
  }
});

describe('authStateMachine — isAuthTerminal', () => {
  it('returns true for idle', () => expect(isAuthTerminal('idle')).toBe(true));
  it('returns true for authenticated', () => expect(isAuthTerminal('authenticated')).toBe(true));
  it('returns true for failed', () => expect(isAuthTerminal('failed')).toBe(true));
  it('returns false for resolving', () => expect(isAuthTerminal('resolving')).toBe(false));
  it('returns false for recovering', () => expect(isAuthTerminal('recovering')).toBe(false));
});

describe('authStateMachine — canShowLoginForm', () => {
  it('returns true when idle and no user', () => {
    expect(canShowLoginForm('idle', false)).toBe(true);
  });
  it('returns true when failed and no user', () => {
    expect(canShowLoginForm('failed', false)).toBe(true);
  });
  it('returns false when user is present regardless of state', () => {
    expect(canShowLoginForm('idle', true)).toBe(false);
    expect(canShowLoginForm('authenticated', true)).toBe(false);
  });
  it('returns false when auth is busy', () => {
    expect(canShowLoginForm('resolving', false)).toBe(false);
    expect(canShowLoginForm('redirecting', false)).toBe(false);
  });
});

describe('authStateMachine — shouldShowAuthSkeleton', () => {
  it('returns true when loading=true', () => {
    expect(shouldShowAuthSkeleton('idle', true)).toBe(true);
  });
  it('returns true when state is busy even if loading=false', () => {
    expect(shouldShowAuthSkeleton('resolving', false)).toBe(true);
  });
  it('returns false when idle and loading=false', () => {
    expect(shouldShowAuthSkeleton('idle', false)).toBe(false);
  });
});

describe('authStateMachine — shouldRedirectAuthenticatedUser', () => {
  it('returns true when user present and state=authenticated', () => {
    expect(shouldRedirectAuthenticatedUser('authenticated', true)).toBe(true);
  });
  it('returns false when no user', () => {
    expect(shouldRedirectAuthenticatedUser('authenticated', false)).toBe(false);
  });
  it('returns false when state is not authenticated', () => {
    expect(shouldRedirectAuthenticatedUser('idle', true)).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. authIncidents
// ═══════════════════════════════════════════════════════════════════════════════

describe('authIncidents — AUTH_INCIDENTS coverage', () => {
  const knownCodes: AuthIncidentCode[] = [
    'AUTH_POPUP_BLOCKED',
    'AUTH_REDIRECT_TIMEOUT',
    'AUTH_REDIRECT_RESULT_EMPTY',
    'AUTH_STATE_NO_USER',
    'AUTH_NAVIGATION_MISMATCH',
    'AUTH_PENDING_FLAG_EXPIRED',
    'AUTH_PENDING_FLAG_INVALID',
    'AUTH_RECOVERY_RETRY_EXHAUSTED',
    'AUTH_CALLBACK_ERROR',
    'AUTH_UNKNOWN_ERROR',
  ];

  for (const code of knownCodes) {
    it(`${code} has a userMessage and debugMessage`, () => {
      const meta = AUTH_INCIDENTS[code];
      expect(meta.userMessage.length).toBeGreaterThan(5);
      expect(meta.debugMessage.length).toBeGreaterThan(5);
      expect(meta.code).toBe(code);
    });
  }
});

describe('authIncidents — getAuthIncidentMeta', () => {
  it('returns meta for a known code', () => {
    const meta = getAuthIncidentMeta('AUTH_REDIRECT_TIMEOUT');
    expect(meta?.code).toBe('AUTH_REDIRECT_TIMEOUT');
    expect(meta?.severity).toBe('error');
  });

  it('returns null for null input', () => {
    expect(getAuthIncidentMeta(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(getAuthIncidentMeta(undefined)).toBeNull();
  });

  it('falls back to AUTH_UNKNOWN_ERROR for unrecognised code', () => {
    // Cast to bypass TS — simulates a stale serialized value
    const meta = getAuthIncidentMeta('NOT_A_REAL_CODE' as AuthIncidentCode);
    expect(meta?.code).toBe('AUTH_UNKNOWN_ERROR');
  });
});

describe('authIncidents — getAuthIncidentUserMessage', () => {
  it('returns the user message for a known code', () => {
    const msg = getAuthIncidentUserMessage('AUTH_POPUP_BLOCKED');
    expect(typeof msg).toBe('string');
    expect(msg!.length).toBeGreaterThan(5);
  });

  it('returns null for null input', () => {
    expect(getAuthIncidentUserMessage(null)).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. authStorage
// ═══════════════════════════════════════════════════════════════════════════════

describe('authStorage — setRedirectPendingFlag / getRedirectPendingFlag', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('round-trips provider and next correctly', () => {
    setRedirectPendingFlag({ provider: 'google', next: '/mon-compte' });
    const flag = getRedirectPendingFlag();
    expect(flag?.provider).toBe('google');
    expect(flag?.next).toBe('/mon-compte');
  });

  it('stores a timestamp', () => {
    const before = Date.now();
    setRedirectPendingFlag({ provider: 'facebook', next: '/scanner' });
    const flag = getRedirectPendingFlag();
    expect(flag?.ts).toBeGreaterThanOrEqual(before);
    expect(flag?.ts).toBeLessThanOrEqual(Date.now());
  });

  it('also persists last-provider and last-next', () => {
    setRedirectPendingFlag({ provider: 'apple', next: '/mes-listes' });
    expect(getLastAuthProvider()).toBe('apple');
    expect(getLastAuthNext()).toBe('/mes-listes');
  });

  it('returns null when sessionStorage is empty', () => {
    expect(getRedirectPendingFlag()).toBeNull();
  });

  it('returns null and removes stale flag after TTL', () => {
    const stale = JSON.stringify({
      provider: 'google',
      next: '/',
      ts: Date.now() - REDIRECT_PENDING_TTL_MS - 1,
    });
    sessionStorage.setItem(REDIRECT_PENDING_KEY, stale);
    expect(getRedirectPendingFlag()).toBeNull();
    expect(sessionStorage.getItem(REDIRECT_PENDING_KEY)).toBeNull();
  });

  it('returns null and removes malformed JSON', () => {
    sessionStorage.setItem(REDIRECT_PENDING_KEY, '{not-valid-json}');
    expect(getRedirectPendingFlag()).toBeNull();
    expect(sessionStorage.getItem(REDIRECT_PENDING_KEY)).toBeNull();
  });

  it('returns null and removes flag with missing fields', () => {
    sessionStorage.setItem(REDIRECT_PENDING_KEY, JSON.stringify({ provider: 'google' }));
    expect(getRedirectPendingFlag()).toBeNull();
  });
});

describe('authStorage — clearRedirectPendingFlag', () => {
  it('removes the flag from sessionStorage', () => {
    setRedirectPendingFlag({ provider: 'google', next: '/' });
    clearRedirectPendingFlag();
    expect(sessionStorage.getItem(REDIRECT_PENDING_KEY)).toBeNull();
  });

  it('is safe to call when no flag is set', () => {
    expect(() => clearRedirectPendingFlag()).not.toThrow();
  });
});

describe('authStorage — retry counter', () => {
  beforeEach(() => sessionStorage.clear());

  it('starts at 0', () => {
    expect(getAuthRetryCount()).toBe(0);
  });

  it('increments correctly', () => {
    expect(incrementAuthRetryCount()).toBe(1);
    expect(incrementAuthRetryCount()).toBe(2);
    expect(getAuthRetryCount()).toBe(2);
  });

  it('resets to 0', () => {
    incrementAuthRetryCount();
    resetAuthRetryCount();
    expect(getAuthRetryCount()).toBe(0);
  });
});

describe('authStorage — clearAuthTransientStorage', () => {
  it('clears all keys at once', () => {
    setRedirectPendingFlag({ provider: 'google', next: '/' });
    incrementAuthRetryCount();
    clearAuthTransientStorage();
    expect(getRedirectPendingFlag()).toBeNull();
    expect(getAuthRetryCount()).toBe(0);
    expect(getLastAuthProvider()).toBeNull();
    expect(getLastAuthNext()).toBeNull();
  });
});

describe('authStorage — constants', () => {
  it('MAX_AUTH_RECOVERY_RETRIES is a positive integer', () => {
    expect(MAX_AUTH_RECOVERY_RETRIES).toBeGreaterThan(0);
    expect(Number.isInteger(MAX_AUTH_RECOVERY_RETRIES)).toBe(true);
  });

  it('REDIRECT_PENDING_TTL_MS is at least 1 minute', () => {
    expect(REDIRECT_PENDING_TTL_MS).toBeGreaterThanOrEqual(60_000);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. authTelemetry
// ═══════════════════════════════════════════════════════════════════════════════

describe('authTelemetry — truncateUid', () => {
  it('returns null for null', () => expect(truncateUid(null)).toBeNull());
  it('returns null for undefined', () => expect(truncateUid(undefined)).toBeNull());
  it('returns uid as-is when <= 8 chars', () => expect(truncateUid('abc12345')).toBe('abc12345'));
  it('truncates long UIDs', () => {
    const uid = 'abcde12345678xyz';
    const result = truncateUid(uid);
    expect(result).toContain('…');
    expect(result?.startsWith('abcd')).toBe(true);
    expect(result?.endsWith('8xyz')).toBe(true);
  });
});

describe('authTelemetry — createAuthTelemetryEvent', () => {
  it('creates an event with type and ts', () => {
    const before = Date.now();
    const ev = createAuthTelemetryEvent('AUTH_TEST');
    expect(ev.type).toBe('AUTH_TEST');
    expect(ev.ts).toBeGreaterThanOrEqual(before);
  });

  it('merges extra fields', () => {
    const ev = createAuthTelemetryEvent('AUTH_REDIRECT_START', {
      provider: 'google',
      mode: 'redirect',
    });
    expect(ev.provider).toBe('google');
    expect(ev.mode).toBe('redirect');
  });
});

describe('authTelemetry — formatAuthTelemetryEvent', () => {
  it('includes the event type', () => {
    const ev = createAuthTelemetryEvent('AUTH_REDIRECT_START', { provider: 'google' });
    const str = formatAuthTelemetryEvent(ev);
    expect(str).toContain('AUTH_REDIRECT_START');
    expect(str).toContain('provider=google');
  });

  it('omits null/undefined optional fields', () => {
    const ev = createAuthTelemetryEvent('AUTH_TEST');
    const str = formatAuthTelemetryEvent(ev);
    expect(str).not.toContain('provider=');
    expect(str).not.toContain('incident=');
  });
});

describe('authTelemetry — formatAuthDiagnosticReport', () => {
  it('returns a placeholder for empty events array', () => {
    expect(formatAuthDiagnosticReport([])).toBe('(no auth events recorded)');
  });

  it('joins multiple events with newline', () => {
    const events = [
      createAuthTelemetryEvent('AUTH_START'),
      createAuthTelemetryEvent('AUTH_SUCCESS'),
    ];
    const report = formatAuthDiagnosticReport(events);
    expect(report.split('\n')).toHaveLength(2);
    expect(report).toContain('AUTH_START');
    expect(report).toContain('AUTH_SUCCESS');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. authRecovery
// ═══════════════════════════════════════════════════════════════════════════════

describe('authRecovery — shouldUseRedirectLogin', () => {
  const mobilePatch = (ua: string) =>
    Object.defineProperty(navigator, 'userAgent', { value: ua, configurable: true });

  it('returns true for Android user agents', () => {
    mobilePatch('Mozilla/5.0 (Linux; Android 13) Mobile');
    expect(shouldUseRedirectLogin()).toBe(true);
  });

  it('returns true for iPhone user agents', () => {
    mobilePatch('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0)');
    expect(shouldUseRedirectLogin()).toBe(true);
  });

  it('returns false for desktop Chrome', () => {
    mobilePatch('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120');
    expect(shouldUseRedirectLogin()).toBe(false);
  });
});

describe('authRecovery — shouldRetryAuthRecovery / markAuthRecoveryAttempt', () => {
  beforeEach(() => sessionStorage.clear());

  it('returns true when no retries yet', () => {
    expect(shouldRetryAuthRecovery()).toBe(true);
  });

  it('returns false after MAX_AUTH_RECOVERY_RETRIES', () => {
    for (let i = 0; i < MAX_AUTH_RECOVERY_RETRIES; i++) {
      markAuthRecoveryAttempt();
    }
    expect(shouldRetryAuthRecovery()).toBe(false);
  });
});

describe('authRecovery — resolvePostAuthNavigation', () => {
  beforeEach(() => sessionStorage.clear());

  it('returns next from pending flag', () => {
    setRedirectPendingFlag({ provider: 'google', next: '/mes-alertes' });
    expect(resolvePostAuthNavigation()).toBe('/mes-alertes');
  });

  it('falls back to last-known next when flag is absent', () => {
    setRedirectPendingFlag({ provider: 'google', next: '/historique' });
    clearRedirectPendingFlag(); // remove flag but last-next survives
    expect(resolvePostAuthNavigation()).toBe('/historique');
  });

  it('falls back to the provided fallbackPath when nothing is stored', () => {
    expect(resolvePostAuthNavigation('/default')).toBe('/default');
  });

  it('sanitizes unsafe next paths', () => {
    sessionStorage.setItem('auth:last-next', '//evil.com/path');
    expect(resolvePostAuthNavigation('/safe')).toBe('/safe');
  });
});

describe('authRecovery — classifyAuthFailure', () => {
  it('returns AUTH_REDIRECT_TIMEOUT when timedOut', () => {
    expect(
      classifyAuthFailure({
        hadPendingFlag: true,
        hasUser: false,
        redirectResultResolved: false,
        timedOut: true,
        retryExhausted: false,
      })
    ).toBe('AUTH_REDIRECT_TIMEOUT');
  });

  it('returns AUTH_RECOVERY_RETRY_EXHAUSTED when retry exhausted', () => {
    expect(
      classifyAuthFailure({
        hadPendingFlag: false,
        hasUser: false,
        redirectResultResolved: false,
        timedOut: false,
        retryExhausted: true,
      })
    ).toBe('AUTH_RECOVERY_RETRY_EXHAUSTED');
  });

  it('returns AUTH_REDIRECT_RESULT_EMPTY when flag was set but no result', () => {
    expect(
      classifyAuthFailure({
        hadPendingFlag: true,
        hasUser: false,
        redirectResultResolved: false,
        timedOut: false,
        retryExhausted: false,
      })
    ).toBe('AUTH_REDIRECT_RESULT_EMPTY');
  });

  it('returns AUTH_STATE_NO_USER for no user without other causes', () => {
    expect(
      classifyAuthFailure({
        hadPendingFlag: false,
        hasUser: false,
        redirectResultResolved: true,
        timedOut: false,
        retryExhausted: false,
      })
    ).toBe('AUTH_STATE_NO_USER');
  });
});

describe('authRecovery — cleanupAfterTerminalAuthFailure', () => {
  it('clears all auth transient storage', () => {
    setRedirectPendingFlag({ provider: 'google', next: '/' });
    incrementAuthRetryCount();
    cleanupAfterTerminalAuthFailure();
    expect(getRedirectPendingFlag()).toBeNull();
    expect(getAuthRetryCount()).toBe(0);
  });
});

describe('authRecovery — attemptSingleRecovery', () => {
  beforeEach(() => sessionStorage.clear());

  it('calls callback and returns attempted=true, succeeded=true on success', async () => {
    const cb = vi.fn().mockResolvedValue(undefined);
    const result = await attemptSingleRecovery(cb);
    expect(result).toEqual({ attempted: true, succeeded: true });
    expect(cb).toHaveBeenCalledOnce();
  });

  it('returns attempted=true, succeeded=false when callback rejects', async () => {
    const cb = vi.fn().mockRejectedValue(new Error('fail'));
    const result = await attemptSingleRecovery(cb);
    expect(result).toEqual({ attempted: true, succeeded: false });
  });

  it('returns attempted=false when retry limit already reached', async () => {
    for (let i = 0; i < MAX_AUTH_RECOVERY_RETRIES; i++) markAuthRecoveryAttempt();
    const cb = vi.fn();
    const result = await attemptSingleRecovery(cb);
    expect(result).toEqual({ attempted: false, succeeded: false });
    expect(cb).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. authSelectors
// ═══════════════════════════════════════════════════════════════════════════════

function makeInput(overrides: Partial<AuthViewModelInput> = {}): AuthViewModelInput {
  return {
    user: null,
    loading: false,
    authResolved: true,
    authFlowState: 'idle',
    lastIncident: null,
    ...overrides,
  };
}

describe('authSelectors — selectShouldShowLoginForm', () => {
  it('returns true when idle, resolved, no user', () => {
    expect(selectShouldShowLoginForm(makeInput())).toBe(true);
  });

  it('returns false while auth is not yet resolved', () => {
    expect(selectShouldShowLoginForm(makeInput({ authResolved: false }))).toBe(false);
  });

  it('returns false while loading', () => {
    expect(selectShouldShowLoginForm(makeInput({ loading: true }))).toBe(false);
  });

  it('returns false when auth is busy (resolving)', () => {
    expect(selectShouldShowLoginForm(makeInput({ authFlowState: 'resolving' }))).toBe(false);
  });

  it('returns false when user is present', () => {
    expect(selectShouldShowLoginForm(makeInput({ user: { uid: 'u1' } as never }))).toBe(false);
  });
});

describe('authSelectors — selectShouldShowAuthSkeleton', () => {
  it('returns true when not yet resolved', () => {
    expect(selectShouldShowAuthSkeleton(makeInput({ authResolved: false }))).toBe(true);
  });

  it('returns true when loading', () => {
    expect(selectShouldShowAuthSkeleton(makeInput({ loading: true }))).toBe(true);
  });

  it('returns true when state is busy', () => {
    expect(selectShouldShowAuthSkeleton(makeInput({ authFlowState: 'resolving' }))).toBe(true);
  });

  it('returns false when settled with no user', () => {
    expect(selectShouldShowAuthSkeleton(makeInput())).toBe(false);
  });
});

describe('authSelectors — selectShouldShowAuthenticatedHeader', () => {
  it('returns true when user + authenticated state', () => {
    expect(
      selectShouldShowAuthenticatedHeader(
        makeInput({ user: { uid: 'u1' } as never, authFlowState: 'authenticated' })
      )
    ).toBe(true);
  });

  it('returns false when user present but state is not authenticated', () => {
    expect(
      selectShouldShowAuthenticatedHeader(
        makeInput({ user: { uid: 'u1' } as never, authFlowState: 'idle' })
      )
    ).toBe(false);
  });

  it('returns false when no user', () => {
    expect(selectShouldShowAuthenticatedHeader(makeInput({ authFlowState: 'authenticated' }))).toBe(
      false
    );
  });
});

describe('authSelectors — selectShouldRedirectAwayFromLogin', () => {
  it('returns true when user is present and auth resolved', () => {
    expect(selectShouldRedirectAwayFromLogin(makeInput({ user: { uid: 'u1' } as never }))).toBe(
      true
    );
  });

  it('returns false when no user', () => {
    expect(selectShouldRedirectAwayFromLogin(makeInput())).toBe(false);
  });

  it('returns false when not yet resolved', () => {
    expect(
      selectShouldRedirectAwayFromLogin(
        makeInput({ user: { uid: 'u1' } as never, authResolved: false })
      )
    ).toBe(false);
  });
});

describe('authSelectors — selectHasRecoverableIncident', () => {
  it('returns true for timeout incident', () => {
    expect(selectHasRecoverableIncident(makeInput({ lastIncident: 'AUTH_REDIRECT_TIMEOUT' }))).toBe(
      true
    );
  });

  it('returns true for empty redirect result', () => {
    expect(
      selectHasRecoverableIncident(makeInput({ lastIncident: 'AUTH_REDIRECT_RESULT_EMPTY' }))
    ).toBe(true);
  });

  it('returns true for no-user state', () => {
    expect(selectHasRecoverableIncident(makeInput({ lastIncident: 'AUTH_STATE_NO_USER' }))).toBe(
      true
    );
  });

  it('returns false for exhausted retry (terminal)', () => {
    expect(
      selectHasRecoverableIncident(makeInput({ lastIncident: 'AUTH_RECOVERY_RETRY_EXHAUSTED' }))
    ).toBe(false);
  });

  it('returns false when no incident', () => {
    expect(selectHasRecoverableIncident(makeInput())).toBe(false);
  });
});
