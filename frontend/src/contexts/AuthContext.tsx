import {
  createContext,
  useContext,
  useEffect,
  useMemo,
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
import { writeUserPresence, clearUserPresence } from "@/services/userPresence";

type UserRole = "guest" | "citoyen" | "observateur" | "admin" | "creator";

type AuthContextValue = {
  user: User | null;
  userRole: UserRole;
  loading: boolean;
  error: string | null;
  isGuest: boolean;
  isCitoyen: boolean;
  isObservateur: boolean;
  isAdmin: boolean;
  isCreator: boolean;
  clearError: () => void;
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

async function resolveUserRole(user: User | null): Promise<UserRole> {
  if (!user) {
    return "guest";
  }

  if (!db) {
    return "citoyen";
  }

  try {
    // Guard against Firestore network hangs (e.g. ERR_NAME_NOT_RESOLVED on mobile).
    // Without a timeout the loading state would stay true indefinitely.
    const roleTimeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), 5000),
    );
    const userDoc = await Promise.race([
      getDoc(doc(db, "users", user.uid)),
      roleTimeout,
    ]);
    if (!userDoc.exists()) {
      return "citoyen";
    }

    const role = userDoc.data()?.role;
    if (role === "creator" || role === "admin" || role === "observateur" || role === "citoyen") {
      return role;
    }

    return "citoyen";
  } catch {
    return "citoyen";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>("guest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(firebaseError ? FIREBASE_UNAVAILABLE_MESSAGE : null);

  useEffect(() => {
    if (firebaseError) {
      setLoading(false);
      return;
    }

    let active = true;
    let unsubscribeAuth: (() => void) | undefined;

    logDebug("[AUTH] init");

    async function bootstrap() {
      // Settle any pending redirect sign-in BEFORE subscribing to onAuthStateChanged.
      // This prevents a flash of the login form while Firebase processes the OAuth return.
      try {
        const result = await getAuthRedirectResult();
        if (!active) return;
        if (result?.user) {
          logDebug("[AUTH] getRedirectResult success");
        } else {
          logDebug("[AUTH] getRedirectResult: no pending redirect");
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
        } else {
          logDebug("[AUTH] getRedirectResult: no pending redirect");
        }
      }

      if (!active) return;

      // Subscribe to auth state changes. By this point getRedirectResult has
      // already resolved so onAuthStateChanged reflects the final auth state.
      unsubscribeAuth = subscribeToAuthState(async (currentUser) => {
        if (!active) {
          return;
        }

        logDebug("[AUTH] onAuthStateChanged", currentUser ? "user" : "null");

        setUser(currentUser);
        const role = await resolveUserRole(currentUser);
        if (!active) {
          return;
        }

        setUserRole(role);
        setLoading(false);
        logDebug("[AUTH] auth resolved", currentUser ? "user" : "null");
      });
    }

    bootstrap();

    return () => {
      active = false;
      unsubscribeAuth?.();
    };
  }, []);

  // ── Authenticated user presence tracking ──────────────────────────────────
  // Write/refresh presence every 30 s while a user is logged in.
  // Presence is cleared explicitly on sign-out so the count drops immediately.
  useEffect(() => {
    if (!user) return;
    const uid = user.uid;
    writeUserPresence(uid).catch(() => {});
    const interval = setInterval(() => {
      writeUserPresence(uid).catch(() => {});
    }, 30_000);
    return () => clearInterval(interval);
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  const value = useMemo<AuthContextValue>(() => ({
    user,
    userRole,
    loading,
    error,
    isGuest: !user,
    isCitoyen: userRole === "citoyen",
    isObservateur: userRole === "observateur",
    isAdmin: userRole === "admin" || userRole === "creator",
    isCreator: userRole === "creator",
    clearError: () => setError(null),
    signUpEmailPassword: async (email, password) => {
      setError(null);
      await signUpEmailPassword(email, password);
    },
    signInEmailPassword: async (email, password) => {
      setError(null);
      await signInEmailPassword(email, password);
    },
    signInGooglePopup: async () => {
      setError(null);
      await signInGooglePopup();
    },
    signInGoogleRedirect: async () => {
      setError(null);
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
      // Clear presence immediately so admin counters update without waiting for TTL
      if (user) clearUserPresence(user.uid).catch(() => {});
      await signOutUser();
    },
  }), [user, userRole, loading, error]); // eslint-disable-line react-hooks/exhaustive-deps

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
