import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { doc, getDoc } from "firebase/firestore";
import type { User } from "firebase/auth";

import { db, firebaseError } from "@/lib/firebase";
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
} from "@/services/auth";
import { FIREBASE_UNAVAILABLE_MESSAGE, getAuthErrorMessage } from "@/lib/authMessages";
import { logDebug, logError } from "@/utils/logger";
import { authLog } from "@/utils/authLogger";
import { writeUserPresence, clearUserPresence } from "@/services/userPresence";

import { nextAuthFlowState, type AuthFlowState } from "@/auth/authStateMachine";
import type { AuthIncidentCode } from "@/auth/authIncidents";
import {
  getRedirectPendingFlag,
  clearRedirectPendingFlag,
  clearAuthTransientStorage,
} from "@/auth/authStorage";

/* ── Types ──────────────────────────────────────────────────────────────── */

type UserRole = "guest" | "citoyen" | "observateur" | "admin" | "creator";

type AuthContextValue = {
  // ── Core auth state ────────────────────────────────────────────────
  user: User | null;
  userRole: UserRole;
  loading: boolean;
  error: string | null;

  // ── New observability fields ────────────────────────────────────────
  /** True once the initial auth bootstrap (getRedirectResult + onAuthStateChanged) has settled. */
  authResolved: boolean;
  /** Current state-machine position for auth-aware UI rendering. */
  authFlowState: AuthFlowState;
  /** Last classified incident, if any. Cleared on successful auth. */
  lastIncident: AuthIncidentCode | null;
  /** Derived: true when user is non-null. */
  isAuthenticated: boolean;
  /** Derived: user.displayName, or null. */
  displayName: string | null;
  /** Derived: user.email, or null. */
  email: string | null;

  // ── Role helpers (backward compat) ─────────────────────────────────
  isGuest: boolean;
  isCitoyen: boolean;
  isObservateur: boolean;
  isAdmin: boolean;
  isCreator: boolean;

  // ── Actions ────────────────────────────────────────────────────────
  clearError: () => void;
  clearAuthIncident: () => void;
  signUpEmailPassword: (email: string, password: string) => Promise<void>;
  signInEmailPassword: (email: string, password: string) => Promise<void>;
  signInGooglePopup: () => Promise<void>;
  signInGoogleRedirect: () => Promise<void>;
  signInFacebookPopup: () => Promise<void>;
  signInFacebookRedirect: () => Promise<void>;
  signInApplePopup: () => Promise<void>;
  signInAppleRedirect: () => Promise<void>;
  signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/* ── Firestore role resolver ─────────────────────────────────────────────── */

async function resolveUserRole(user: User | null): Promise<UserRole> {
  if (!user) return "guest";
  if (!db)   return "citoyen";

  try {
    const roleTimeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), 5000),
    );
    const userDoc = await Promise.race([
      getDoc(doc(db, "users", user.uid)),
      roleTimeout,
    ]);
    if (!userDoc.exists()) return "citoyen";

    const role = userDoc.data()?.role;
    if (role === "creator" || role === "admin" || role === "observateur" || role === "citoyen") {
      return role;
    }
    return "citoyen";
  } catch {
    return "citoyen";
  }
}

/* ── Provider ────────────────────────────────────────────────────────────── */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,          setUser]         = useState<User | null>(null);
  const [userRole,      setUserRole]     = useState<UserRole>("guest");
  const [loading,       setLoading]      = useState(true);
  const [error,         setError]        = useState<string | null>(
    firebaseError ? FIREBASE_UNAVAILABLE_MESSAGE : null,
  );
  const [authResolved,  setAuthResolved] = useState(false);
  const [authFlowState, setAuthFlowState] = useState<AuthFlowState>('resolving');
  const [lastIncident,  setLastIncident] = useState<AuthIncidentCode | null>(null);

  // Ensure bootstrap runs at most once even under React StrictMode double-invoke.
  const bootstrappedRef = useRef(false);

  const transition = useCallback((next: AuthFlowState) => {
    setAuthFlowState((cur) => nextAuthFlowState(cur, next));
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

    logDebug("[AUTH] bootstrap start");

    async function bootstrap() {
      const pendingFlag  = getRedirectPendingFlag();
      const hadPending   = Boolean(pendingFlag);

      // ── 1. Settle any in-flight OAuth redirect BEFORE onAuthStateChanged ──
      try {
        const result = await getAuthRedirectResult();
        if (!active) return;

        if (result?.user) {
          logDebug("[AUTH] getRedirectResult success");
          authLog('AUTH_REDIRECT_RESULT_RESOLVED', { hasUser: true, hasPendingFlag: hadPending });
        } else {
          logDebug("[AUTH] getRedirectResult: no pending redirect");
          authLog('AUTH_REDIRECT_RESULT_RESOLVED', { hasUser: false, hasPendingFlag: hadPending });
        }
      } catch (err: unknown) {
        if (!active) return;
        const code =
          typeof err === "object" && err && "code" in err
            ? String((err as { code: string }).code)
            : "";
        if (code && code !== "auth/no-redirect-pending" && code !== "auth/popup-closed-by-user") {
          logError("[AUTH] getRedirectResult error", code);
          setError(getAuthErrorMessage(err));
          clearRedirectPendingFlag();
          authLog('AUTH_FINAL_FAILURE', { errorCode: code });
        } else {
          logDebug("[AUTH] getRedirectResult: no pending redirect");
        }
      }

      if (!active) return;

      // ── 2. Subscribe — fires once immediately with current user state ──
      unsubscribeAuth = subscribeToAuthState(async (currentUser) => {
        if (!active) return;

        logDebug("[AUTH] onAuthStateChanged", currentUser ? "user" : "null");

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
          logDebug("[AUTH] authenticated", currentUser.email);
        } else {
          authLog('AUTH_STATE_NO_USER');
          setUser(null);
          setUserRole("guest");
          setLoading(false);
          setAuthResolved(true);
          setAuthFlowState(hadPending ? 'failed' : 'idle');
          if (hadPending) {
            setLastIncident('AUTH_REDIRECT_RESULT_EMPTY');
          }
          logDebug("[AUTH] no user");
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

  /* ── Context value ─────────────────────────────────────────────────── */
  const value = useMemo<AuthContextValue>(() => ({
    user,
    userRole,
    loading,
    error,
    authResolved,
    authFlowState,
    lastIncident,
    isAuthenticated: Boolean(user),
    displayName:     user?.displayName ?? null,
    email:           user?.email ?? null,
    isGuest:         !user,
    isCitoyen:       userRole === "citoyen",
    isObservateur:   userRole === "observateur",
    isAdmin:         userRole === "admin" || userRole === "creator",
    isCreator:       userRole === "creator",
    clearError:         () => setError(null),
    clearAuthIncident:  () => setLastIncident(null),
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
  }), [user, userRole, loading, error, authResolved, authFlowState, lastIncident, transition]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
