/**
 * authIncidents.ts
 *
 * Normalized incident codes for all known Firebase Auth failure modes.
 * Maps each code to a user-friendly message and a severity level.
 * No React, no Firebase — pure data, fully testable.
 */

export type AuthIncidentCode =
  | 'AUTH_POPUP_BLOCKED'
  | 'AUTH_REDIRECT_TIMEOUT'
  | 'AUTH_REDIRECT_RESULT_EMPTY'
  | 'AUTH_STATE_NO_USER'
  | 'AUTH_NAVIGATION_MISMATCH'
  | 'AUTH_PENDING_FLAG_EXPIRED'
  | 'AUTH_PENDING_FLAG_INVALID'
  | 'AUTH_RECOVERY_RETRY_EXHAUSTED'
  | 'AUTH_CALLBACK_ERROR'
  | 'AUTH_UNKNOWN_ERROR';

export type AuthIncidentSeverity = 'info' | 'warning' | 'error';

export interface AuthIncidentMeta {
  code: AuthIncidentCode;
  severity: AuthIncidentSeverity;
  /** Shown to the end user — no technical jargon. */
  userMessage: string;
  /** For debug panel / logs only. */
  debugMessage: string;
}

export const AUTH_INCIDENTS: Record<AuthIncidentCode, AuthIncidentMeta> = {
  AUTH_POPUP_BLOCKED: {
    code: 'AUTH_POPUP_BLOCKED',
    severity: 'warning',
    userMessage: 'La fenêtre de connexion a été bloquée. Redirection en cours…',
    debugMessage: 'Google popup was blocked by the browser.',
  },
  AUTH_REDIRECT_TIMEOUT: {
    code: 'AUTH_REDIRECT_TIMEOUT',
    severity: 'error',
    userMessage: 'La connexion a pris trop de temps. Veuillez réessayer.',
    debugMessage: 'Redirect flow exceeded timeout.',
  },
  AUTH_REDIRECT_RESULT_EMPTY: {
    code: 'AUTH_REDIRECT_RESULT_EMPTY',
    severity: 'warning',
    userMessage:
      'La connexion a été interrompue ou refusée par votre navigateur. Activez les cookies tiers ou réessayez.',
    debugMessage: 'getRedirectResult() returned null/empty.',
  },
  AUTH_STATE_NO_USER: {
    code: 'AUTH_STATE_NO_USER',
    severity: 'warning',
    userMessage: 'Aucun utilisateur authentifié détecté.',
    debugMessage: 'onAuthStateChanged resolved without user.',
  },
  AUTH_NAVIGATION_MISMATCH: {
    code: 'AUTH_NAVIGATION_MISMATCH',
    severity: 'warning',
    userMessage: 'La navigation post-connexion a été corrigée.',
    debugMessage: 'Authenticated user ended up on an inconsistent route.',
  },
  AUTH_PENDING_FLAG_EXPIRED: {
    code: 'AUTH_PENDING_FLAG_EXPIRED',
    severity: 'warning',
    userMessage: "L'ancienne tentative de connexion a expiré.",
    debugMessage: 'auth:return:pending exceeded TTL.',
  },
  AUTH_PENDING_FLAG_INVALID: {
    code: 'AUTH_PENDING_FLAG_INVALID',
    severity: 'warning',
    userMessage: 'Les données temporaires de connexion étaient invalides.',
    debugMessage: 'auth:return:pending could not be parsed or was malformed.',
  },
  AUTH_RECOVERY_RETRY_EXHAUSTED: {
    code: 'AUTH_RECOVERY_RETRY_EXHAUSTED',
    severity: 'error',
    userMessage: 'La récupération automatique a échoué.',
    debugMessage: 'Maximum auth recovery attempts reached.',
  },
  AUTH_CALLBACK_ERROR: {
    code: 'AUTH_CALLBACK_ERROR',
    severity: 'error',
    userMessage: 'Une erreur est survenue pendant le retour Google.',
    debugMessage: 'Auth callback page failed.',
  },
  AUTH_UNKNOWN_ERROR: {
    code: 'AUTH_UNKNOWN_ERROR',
    severity: 'error',
    userMessage: 'Une erreur de connexion inconnue est survenue.',
    debugMessage: 'Unhandled auth error.',
  },
};

/** Returns the incident metadata for a given code, or null if code is absent. */
export function getAuthIncidentMeta(
  code: AuthIncidentCode | null | undefined
): AuthIncidentMeta | null {
  if (!code) return null;
  return AUTH_INCIDENTS[code] ?? AUTH_INCIDENTS.AUTH_UNKNOWN_ERROR;
}

/** Returns the user-facing message for an incident code, or null. */
export function getAuthIncidentUserMessage(
  code: AuthIncidentCode | null | undefined
): string | null {
  return getAuthIncidentMeta(code)?.userMessage ?? null;
}
