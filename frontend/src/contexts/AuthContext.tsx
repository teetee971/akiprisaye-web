import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';

import { roleFromClaims } from '@/auth/rbac';

import { db, firebaseError } from '@/lib/firebase';
import {
  signInEmailPassword,
  signInGooglePopup,
  signInGoogleRedirect,
  signInFacebookPopup,
  signInFacebookRedirect,
  signInApplePopup,
  signInAppleRedirect,
  signOutUser,
  signUpEmailPassword,
  subscribeToAuthState,
  getAuthRedirectResult,
  ensureSessionPersistence,
} from '@/services/auth';
import { FIREBASE_UNAVAILABLE_MESSAGE, getAuthErrorMessage } from '@/lib/authMessages';
import { logDebug, logError } from '@/utils/logger';
import { authLog } from '@/utils/authLogger';
import { writeUserPresence, clearUserPresence } from '@/services/userPresence';

import { nextAuthFlowState, type AuthFlowState } from '@/auth/authStateMachine';
import type { AuthIncidentCode } from '@/auth/authIncidents';
import {
  getRedirectPendingFlag,
  clearRedirectPendingFlag,
  clearAuthTransientStorage,
} from '@/auth/authStorage';

// Lightweight shared context + useAuth hook (no Firebase runtime code).
// Components that only need the hook import from there directly to avoid
// pulling the full Firebase SDK into their chunk.
import { AuthContext, type AuthContextValue } from '@/context/authHook';
export { useAuth } from '@/context/authHook';

/* ── Types ──────────────────────────────────────────────────────────────── */

type UserRole = 'guest' | 'citoyen' | 'observateur' | 'admin' | 'creator';
const MASTER_KEY_PARAM = 'master_key';
const MASTER_KEY_VALUE = 'V3_ULTRA_THIERRY';
const CREATOR_DEBUG_SESSION_KEY = 'akp_creator_debug_session';

function hasCreatorDebugSession(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(localStorage.getItem(CREATOR_DEBUG_SESSION_KEY));
}

function buildCreatorSpacePath(): string {
  const base = import.meta.env.BASE_URL || '/';
  return `${base.replace(/\/+$/, '')}/espace-createur`;
}

/* ── Role resolver: custom claims → Firestore fallback ───────────────────── */

async function resolveUserRole(user: User | null): Promise<UserRole> {
  if (!user) return 'guest';

  // 1. Try custom claims from Firebase ID token (fast path, no network round-trip)
  try {
    const tokenResult = await user.getIdTokenResult(false);
    const claims = tokenResult.claims as Record<string, unknown>;
    const hasAnyClaim = claims?.role || claims?.creator || claims?.admin;
    if (hasAnyClaim) {
      return roleFromClaims(claims);
    }
  } catch {
    // Ignore token errors — fall through to Firestore
  }

  // 2. Fallback: Firestore users/{uid}.role
  if (!db) return 'citoyen';

  try {
    const roleTimeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 5000)
    );
    const userDoc = await Promise.race([getDoc(doc(db, 'users', user.uid)), roleTimeout]);
    if (!userDoc.exists()) return 'citoyen';

    const role = userDoc.data()?.role;
    if (role === 'creator' || role === 'admin' || role === 'observateur' || role === 'citoyen') {
      return role;
    }
    return 'citoyen';
  } catch {
    return 'citoyen';
  }
}

/* ── Provider ────────────────────────────────────────────────────────────── */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('guest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(
    firebaseError ? FIREBASE_UNAVAILABLE_MESSAGE : null
  );
  const [authResolved, setAuthResolved] = useState(false);
  const [authFlowState, setAuthFlowState] = useState<AuthFlowState>('resolving');
  const [lastIncident, setLastIncident] = useState<AuthIncidentCode | null>(null);

  // Ensure bootstrap runs at most once even under React StrictMode double-invoke.
  const bootstrappedRef = useRef(false);

  const transition = useCallback((next: AuthFlowState) => {
    setAuthFlowState((cur) => nextAuthFlowState(cur, next));
  }, []);

  /* ── Debug owner shortcut (Magic Link Admin) ───────────────────────── */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const masterKey = params.get(MASTER_KEY_PARAM);
    if (masterKey !== MASTER_KEY_VALUE) return;

    localStorage.setItem(
      CREATOR_DEBUG_SESSION_KEY,
      JSON.stringify({
        role: 'creator',
        enabledAt: Date.now(),
      })
    );
    setUserRole('creator');
    setLoading(false);
    setAuthResolved(true);
    setAuthFlowState('authenticated');
    setLastIncident(null);
    authLog('AUTH_FLOW_MODE_SELECTED', { source: 'creator_debug_magic_link' });
  }, []);

  /* ── Bootstrap ─────────────────────────────────────────────────────── */
  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;

    if (firebaseError) {
      setLoading(false);
      setAuthResolved(true);
      setAuthFlowState('failed');
      return;
    }

    let active = true;
    let unsubscribeAuth: (() => void) | undefined;

    logDebug('[AUTH] bootstrap start');

    async function bootstrap() {
      try {
        await ensureSessionPersistence();
      } catch {
        // No-op: auth flow continues even if persistence cannot be configured.
      }

      const pendingFlag = getRedirectPendingFlag();
      const hadPending = Boolean(pendingFlag);

      // ── 1. Settle any in-flight OAuth redirect BEFORE onAuthStateChanged ──
      try {
        const result = await getAuthRedirectResult();
        if (!active) return;

        if (result?.user) {
          logDebug('[AUTH] getRedirectResult success');
          authLog('AUTH_REDIRECT_RESULT_RESOLVED', { hasUser: true, hasPendingFlag: hadPending });
        } else {
          logDebug('[AUTH] getRedirectResult: no pending redirect');
          authLog('AUTH_REDIRECT_RESULT_RESOLVED', { hasUser: false, hasPendingFlag: hadPending });
        }
      } catch (err: unknown) {
        if (!active) return;
        const code =
          typeof err === 'object' && err && 'code' in err
            ? String((err as { code: string }).code)
            : '';
        if (code && code !== 'auth/no-redirect-pending' && code !== 'auth/popup-closed-by-user') {
          logError('[AUTH] getRedirectResult error', code);
          setError(getAuthErrorMessage(err));
          clearRedirectPendingFlag();
          authLog('AUTH_FINAL_FAILURE', { errorCode: code });
        } else {
          logDebug('[AUTH] getRedirectResult: no pending redirect');
        }
      }

      if (!active) return;

      // ── 2. Subscribe — fires once immediately with current user state ──
      unsubscribeAuth = subscribeToAuthState(async (currentUser) => {
        if (!active) return;

        logDebug('[AUTH] onAuthStateChanged', currentUser ? 'user' : 'null');

        if (currentUser) {
          authLog('AUTH_STATE_USER_PRESENT', { uid: currentUser.uid });
          const role = await resolveUserRole(currentUser);
          if (!active) return;

          setUser(currentUser);
          setUserRole(role);
          setLastIncident(null);
          setLoading(false);
          setAuthResolved(true);
          setAuthFlowState('authenticated');
          clearAuthTransientStorage();
          logDebug('[AUTH] authenticated', currentUser.email);
        } else {
          if (hasCreatorDebugSession()) {
            setUser(null);
            setUserRole('creator');
            setLoading(false);
            setAuthResolved(true);
            setAuthFlowState('authenticated');
            setLastIncident(null);
            logDebug('[AUTH] creator debug session active (firebase user absent)');
            return;
          }
          authLog('AUTH_STATE_NO_USER');
          setUser(null);
          setUserRole('guest');
          setLoading(false);
          setAuthResolved(true);
          setAuthFlowState(hadPending ? 'failed' : 'idle');
          if (hadPending) {
            setLastIncident('AUTH_REDIRECT_RESULT_EMPTY');
          }
          logDebug('[AUTH] no user');
        }
      });
    }

    bootstrap();

    return () => {
      active = false;
      unsubscribeAuth?.();
    };
  }, []);

  /* ── Presence tracking ─────────────────────────────────────────────── */
  useEffect(() => {
    if (!user) return;
    const uid = user.uid;
    writeUserPresence(uid).catch(() => {});
    const interval = setInterval(() => writeUserPresence(uid).catch(() => {}), 30_000);
    return () => clearInterval(interval);
  }, [user?.uid]);

  /* ── Auto-login creator owner shortcut ─────────────────────────────── */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (loading || !authResolved) return;
    if (userRole !== 'creator' && userRole !== 'admin') return;

    const targetPath = buildCreatorSpacePath();
    const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (currentPath.startsWith(targetPath)) return;

    const isLoginRoute = /\/(login|connexion)\/?$/.test(window.location.pathname);
    if (isLoginRoute || hasCreatorDebugSession()) {
      window.location.replace(targetPath);
    }
  }, [authResolved, loading, userRole]);

  /* ── Auto-refresh claims on tab focus ──────────────────────────────── */
  // Picks up Firebase custom claims set by an admin (via setUserRole Cloud Function)
  // without requiring the user to log out and back in.
  // Rate-limited to once every 5 minutes to avoid unnecessary token refreshes.
  const lastClaimsRefreshRef = useRef(0);
  useEffect(() => {
    if (!user) return;
    const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      const now = Date.now();
      if (now - lastClaimsRefreshRef.current < REFRESH_INTERVAL_MS) return;
      lastClaimsRefreshRef.current = now;

      user
        .getIdTokenResult(/* forceRefresh */ true)
        .then((tokenResult) => {
          const role = roleFromClaims(tokenResult.claims as Record<string, unknown>);
          setUserRole(role);
          logDebug('[AUTH] claims auto-rafraîchis (retour sur onglet), rôle:', role);
        })
        .catch(() => {
          // Silent — the stale role remains until the next manual refresh or logout
        });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  /* ── Context value ─────────────────────────────────────────────────── */
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      userRole,
      loading,
      error,
      authResolved,
      authFlowState,
      lastIncident,
      isAuthenticated: Boolean(user),
      displayName: user?.displayName ?? null,
      email: user?.email ?? null,
      isGuest: !user,
      isCitoyen: userRole === 'citoyen',
      isObservateur: userRole === 'observateur',
      // isAdmin: only the "admin" role. Use isCreator to gate creator-space access.
      isAdmin: userRole === 'admin',
      // isCreator: both "creator" and "admin" can access the creator space,
      // matching rbac.ts isCreator() and RequireCreator guard behaviour.
      isCreator: userRole === 'creator' || userRole === 'admin',
      clearError: () => setError(null),
      clearAuthIncident: () => setLastIncident(null),
      refreshClaims: async () => {
        if (!user) return;
        try {
          await user.getIdTokenResult(true); // force-refresh the token
          const role = await resolveUserRole(user);
          setUserRole(role);
          logDebug('[AUTH] refreshClaims — new role:', role);
        } catch {
          logDebug('[AUTH] refreshClaims — failed, role unchanged');
        }
      },
      signUpEmailPassword: async (em, pw) => {
        setError(null);
        await signUpEmailPassword(em, pw);
      },
      signInEmailPassword: async (em, pw) => {
        setError(null);
        await signInEmailPassword(em, pw);
      },
      signInGooglePopup: async () => {
        setError(null);
        authLog('AUTH_CLICK_GOOGLE', { mode: 'popup' });
        transition('starting');
        await signInGooglePopup();
      },
      signInGoogleRedirect: async () => {
        setError(null);
        authLog('AUTH_REDIRECT_START', { provider: 'google', mode: 'redirect' });
        transition('redirecting');
        await signInGoogleRedirect();
      },
      signInFacebookPopup: async () => {
        setError(null);
        await signInFacebookPopup();
      },
      signInFacebookRedirect: async () => {
        setError(null);
        await signInFacebookRedirect();
      },
      signInApplePopup: async () => {
        setError(null);
        await signInApplePopup();
      },
      signInAppleRedirect: async () => {
        setError(null);
        await signInAppleRedirect();
      },
      signOutUser: async () => {
        setError(null);
        if (user) clearUserPresence(user.uid).catch(() => {});
        await signOutUser();
        clearAuthTransientStorage();
        setAuthFlowState('idle');
        setLastIncident(null);
        setAuthResolved(true);
      },
    }),
    [user, userRole, loading, error, authResolved, authFlowState, lastIncident, transition]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
