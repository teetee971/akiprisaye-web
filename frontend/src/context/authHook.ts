/**
 * authHook.ts
 *
 * Lightweight module that holds only the React Context object and the
 * `useAuth` hook.  All imports from firebase/auth are TYPE-ONLY and are
 * erased at build time — this file adds zero Firebase runtime code to any
 * chunk that imports it.
 *
 * Why this file exists:
 *   contexts/AuthContext.tsx (the real provider) statically imports the
 *   Firebase SDK (~485 kB raw).  When Header, RequireAuth, RequireRole, etc.
 *   imported `useAuth` directly from there, the entire Firebase bundle was
 *   pulled into the critical-path main entry.
 *
 *   By defining the Context object and hook here (no Firebase runtime code),
 *   only the thin shim is included in the initial bundle.  AuthProvider itself
 *   is lazy-loaded in App.tsx so Firebase parses in parallel after first paint.
 */

import { createContext, useContext } from 'react';
import type { User } from 'firebase/auth';
import type { AuthFlowState } from '../auth/authStateMachine';
import type { AuthIncidentCode } from '../auth/authIncidents';

type UserRole = 'guest' | 'citoyen' | 'observateur' | 'admin' | 'creator';

export type AuthContextValue = {
  // ── Core auth state ──────────────────────────────────────────────────────
  user: User | null;
  userRole: UserRole;
  loading: boolean;
  error: string | null;

  // ── Observability ────────────────────────────────────────────────────────
  /** True once the initial auth bootstrap has settled. */
  authResolved: boolean;
  /** Current state-machine position for auth-aware UI. */
  authFlowState: AuthFlowState;
  /** Last classified incident, if any. Cleared on successful auth. */
  lastIncident: AuthIncidentCode | null;

  // ── Derived helpers ──────────────────────────────────────────────────────
  isAuthenticated: boolean;
  displayName: string | null;
  email: string | null;
  isGuest: boolean;
  isCitoyen: boolean;
  isObservateur: boolean;
  isAdmin: boolean;
  isCreator: boolean;

  // ── Actions ──────────────────────────────────────────────────────────────
  clearError: () => void;
  clearAuthIncident: () => void;
  refreshClaims: () => Promise<void>;
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

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
