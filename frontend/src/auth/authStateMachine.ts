/**
 * authStateMachine.ts
 *
 * Normalized auth flow states and allowed transitions.
 * Single source of truth for "is auth busy", "can we show the login form", etc.
 * No React, no Firebase — pure logic, fully testable.
 */

export type AuthFlowState =
  | 'idle'          // Not authenticated, no pending flow
  | 'starting'      // User initiated a sign-in action
  | 'redirecting'   // signInWithRedirect called — browser navigating to provider
  | 'returning'     // OAuth provider redirected back — waiting for result
  | 'resolving'     // getRedirectResult / onAuthStateChanged in progress
  | 'authenticated' // Auth settled, user is present
  | 'recovering'    // A failure was detected; automatic recovery in progress
  | 'failed';       // Terminal failure, no further auto-recovery

const AUTH_TRANSITIONS: Record<AuthFlowState, AuthFlowState[]> = {
  idle:          ['starting', 'resolving', 'failed'],
  starting:      ['redirecting', 'resolving', 'failed'],
  redirecting:   ['returning', 'failed'],
  returning:     ['resolving', 'failed'],
  resolving:     ['authenticated', 'recovering', 'failed', 'idle'],
  authenticated: ['idle', 'failed'],
  recovering:    ['resolving', 'authenticated', 'failed'],
  failed:        ['idle', 'starting', 'resolving'],
};

/**
 * Returns true if the transition `from → to` is defined in the state machine.
 * Undefined transitions are silently ignored by `nextAuthFlowState`.
 */
export function isValidAuthTransition(
  from: AuthFlowState,
  to: AuthFlowState,
): boolean {
  return AUTH_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Returns `next` if the transition is valid; otherwise stays in `current`.
 * This makes every state update safe — invalid transitions are no-ops.
 */
export function nextAuthFlowState(
  current: AuthFlowState,
  next: AuthFlowState,
): AuthFlowState {
  return isValidAuthTransition(current, next) ? next : current;
}

/** Auth is actively in-progress (loading, redirecting, resolving, recovering). */
export function isAuthBusy(state: AuthFlowState): boolean {
  return (
    state === 'starting' ||
    state === 'redirecting' ||
    state === 'returning' ||
    state === 'resolving' ||
    state === 'recovering'
  );
}

/** Auth is in a terminal resting state (idle, authenticated, or failed). */
export function isAuthTerminal(state: AuthFlowState): boolean {
  return state === 'authenticated' || state === 'failed' || state === 'idle';
}

/**
 * True when the login form should be visible.
 * Hidden while auth is busy, or when the user is already present.
 */
export function canShowLoginForm(state: AuthFlowState, hasUser: boolean): boolean {
  if (hasUser) return false;
  return state === 'idle' || state === 'failed';
}

/**
 * True while the app skeleton/loading spinner should cover auth-sensitive UI.
 * This prevents a flash of the login form during OAuth bootstrap.
 */
export function shouldShowAuthSkeleton(
  state: AuthFlowState,
  loading: boolean,
): boolean {
  return loading || isAuthBusy(state);
}

/**
 * True when an authenticated user should be redirected away from public auth pages.
 */
export function shouldRedirectAuthenticatedUser(
  state: AuthFlowState,
  hasUser: boolean,
): boolean {
  return hasUser && state === 'authenticated';
}
