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
  signOutUser,
  signUpEmailPassword,
  subscribeToAuthState,
} from "@/services/auth";
import { FIREBASE_UNAVAILABLE_MESSAGE } from "@/lib/authMessages";

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
    const userDoc = await getDoc(doc(db, "users", user.uid));
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

    const unsubscribe = subscribeToAuthState(async (currentUser) => {
      if (!active) {
        return;
      }

      setUser(currentUser);
      const role = await resolveUserRole(currentUser);
      if (!active) {
        return;
      }

      setUserRole(role);
      setLoading(false);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

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
    signOutUser: async () => {
      setError(null);
      await signOutUser();
    },
  }), [user, userRole, loading, error]);

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
