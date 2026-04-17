/**
 * authSelectors.ts
 *
 * Derived view-model helpers for auth-dependent UI.
 * Components call these instead of duplicating logic inline.
 * No React, no Firebase — pure functions, fully testable.
 */

import type { User } from 'firebase/auth';
import { canShowLoginForm, isAuthBusy } from './authStateMachine';
import type { AuthFlowState } from './authStateMachine';
import type { AuthIncidentCode } from './authIncidents';

export interface AuthViewModelInput {
  user: User | null;
  loading: boolean;
  authResolved: boolean;
  authFlowState: AuthFlowState;
  lastIncident: AuthIncidentCode | null;
}

/**
 * True when the login form (email/password + social buttons) should be shown.
 * Hidden while auth is still resolving or the user is already present.
 */
export function selectShouldShowLoginForm(input: AuthViewModelInput): boolean {
  return (
    canShowLoginForm(input.authFlowState, Boolean(input.user)) &&
    input.authResolved &&
    !input.loading
  );
}

/**
 * True when auth-sensitive UI should render a neutral loading skeleton.
 * Guards against flash of wrong state during OAuth bootstrap.
 */
export function selectShouldShowAuthSkeleton(input: AuthViewModelInput): boolean {
  if (!input.authResolved) return true;
  return input.loading || isAuthBusy(input.authFlowState);
}

/**
 * True when the header should display the authenticated-user UI
 * (avatar, name, sign-out button) rather than a "Se connecter" link.
 */
export function selectShouldShowAuthenticatedHeader(input: AuthViewModelInput): boolean {
  return Boolean(input.user) && input.authFlowState === 'authenticated';
}

/**
 * True when an authenticated user on a "guest-only" page (e.g. /connexion)
 * should be redirected away immediately.
 */
export function selectShouldRedirectAwayFromLogin(input: AuthViewModelInput): boolean {
  return Boolean(input.user) && input.authResolved;
}

/**
 * True when a known incident can be presented to the user with a retry option.
 * Terminal / unrecoverable incidents return false (they need a different UI).
 */
export function selectHasRecoverableIncident(input: AuthViewModelInput): boolean {
  return (
    input.lastIncident === 'AUTH_REDIRECT_TIMEOUT' ||
    input.lastIncident === 'AUTH_REDIRECT_RESULT_EMPTY' ||
    input.lastIncident === 'AUTH_STATE_NO_USER'
  );
}
