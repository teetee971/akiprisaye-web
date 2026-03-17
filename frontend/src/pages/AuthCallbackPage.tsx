/**
 * AuthCallbackPage.tsx
 *
 * Route tampon dédiée au retour OAuth mobile : /auth/callback
 *
 * Flux complet :
 *   1. SocialLoginButtons navigue ici avec ?provider=google&next=...
 *   2. Cette page définit le flag sessionStorage puis appelle signInWithRedirect()
 *   3. Le navigateur revient ici après le consentement OAuth
 *   4. AuthContext.bootstrap() résout getRedirectResult() + onAuthStateChanged
 *   5. Cette page attend loading=false puis redirige selon l'état (user / no-user)
 *
 * Règles :
 *  - Aucun formulaire
 *  - Aucun bouton social
 *  - Affichage neutre unique jusqu'à résolution complète
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import { useAuth } from '@/context/AuthContext';
import {
  signInGoogleRedirect,
  signInFacebookRedirect,
  signInAppleRedirect,
} from '@/services/auth';
import {
  setRedirectPendingFlag,
  getRedirectPendingFlag,
  clearRedirectPendingFlag,
} from '@/auth/authStorage';
import { getAuthIncidentUserMessage } from '@/auth/authIncidents';
import { authLog } from '@/utils/authLogger';

/** Maximum ms to wait for the auth flow to stabilise before showing a timeout. */
const REDIRECT_TIMEOUT_MS = 15_000;

type Phase =
  | 'initiating'   // About to call signInWithRedirect()
  | 'pending'      // OAuth return; waiting for AuthContext to resolve
  | 'success'      // Auth resolved with a user → redirecting
  | 'no-user'      // Auth resolved without a user → error shown
  | 'timeout'      // Did not resolve within REDIRECT_TIMEOUT_MS
  | 'invalid';     // Page loaded without a valid pending context

export default function AuthCallbackPage() {
  const { user, loading, authResolved, lastIncident } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [phase, setPhase] = useState<Phase>('initiating');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<'google' | 'facebook' | 'apple' | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initiatedRef = useRef(false);

  // ── On mount: determine whether this is the first visit (initiation) ──────
  // or the OAuth return (resolution), based on the sessionStorage flag.
  useEffect(() => {
    if (initiatedRef.current) return;
    initiatedRef.current = true;

    const existingFlag = getRedirectPendingFlag();

    if (existingFlag) {
      // ── OAuth return: the flag was set on the previous page load ──────────
      authLog('AUTH_REDIRECT_RESULT_RESOLVED', { provider: existingFlag.provider, next: existingFlag.next });
      setActiveProvider(existingFlag.provider);
      setPhase('pending');
      return;
    }

    // ── First visit: initiate the OAuth redirect ───────────────────────────
    const provider = searchParams.get('provider') as 'google' | 'facebook' | 'apple' | null;
    const next = searchParams.get('next') ?? '/mon-compte';

    if (!provider || !['google', 'facebook', 'apple'].includes(provider)) {
      // No valid provider → the page was accessed directly without a redirect
      // context. Redirect to login gracefully.
      setPhase('invalid');
      return;
    }

    setActiveProvider(provider);
    authLog('AUTH_REDIRECT_START', { provider, next });
    setRedirectPendingFlag({ provider, next });

    (async () => {
      try {
        if (provider === 'google')   await signInGoogleRedirect();
        if (provider === 'facebook') await signInFacebookRedirect();
        if (provider === 'apple')    await signInAppleRedirect();
        // If we reach here the browser navigates away; no further code runs.
      } catch (err: unknown) {
        clearRedirectPendingFlag();
        const msg =
          typeof err === 'object' && err && 'message' in err
            ? String((err as { message: string }).message)
            : 'Erreur lors de la connexion.';
        setErrorMsg(msg);
        setPhase('no-user');
      }
    })();
  }, [searchParams]);

  // ── When phase='pending': start a timeout guard ───────────────────────────
  useEffect(() => {
    if (phase !== 'pending') return;
    timeoutRef.current = setTimeout(() => {
      authLog('AUTH_REDIRECT_TIMEOUT');
      clearRedirectPendingFlag();
      setPhase('timeout');
    }, REDIRECT_TIMEOUT_MS);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [phase]);

  // ── Watch AuthContext to know when auth is stabilised ────────────────────
  // authResolved is true once the bootstrap (getRedirectResult + onAuthStateChanged) settled.
  // Fall back to !loading for backward compat if authResolved is still false.
  useEffect(() => {
    if (phase !== 'pending') return;
    if (loading || !authResolved) return;

    // Auth cycle completed.
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const flag = getRedirectPendingFlag();
    const destination = flag?.next ?? '/mon-compte';
    clearRedirectPendingFlag();

    if (user) {
      authLog('AUTH_STATE_USER_PRESENT', { uid: user.uid });
      toast.success(
        `Bienvenue${user.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}\u00a0!`,
        { id: 'auth-success', duration: 3000 },
      );
      authLog('AUTH_NAVIGATE_AFTER_SUCCESS', { destination });
      setPhase('success');
      navigate(destination, { replace: true });
    } else {
      authLog('AUTH_STATE_NO_USER');
      setPhase('no-user');
      // Use lastIncident message if available, otherwise generic cancel message
      setErrorMsg(getAuthIncidentUserMessage(lastIncident) ?? null);
    }
  }, [loading, authResolved, lastIncident, phase, user, navigate]);

  // ── Handle invalid/direct access ─────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'invalid') return;
    navigate('/connexion', { replace: true });
  }, [phase, navigate]);

  // ── Render ────────────────────────────────────────────────────────────────

  if (phase === 'no-user' || phase === 'timeout') {
    const message =
      phase === 'timeout'
        ? 'La connexion a pris trop de temps. Veuillez réessayer.'
        : errorMsg ?? 'Connexion annulée ou refusée. Veuillez réessayer.';

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-slate-900 rounded-2xl p-6 shadow-lg w-full max-w-sm text-center">
          <div className="text-3xl mb-4" aria-hidden="true">⚠️</div>
          <p className="text-red-300 text-sm mb-6">{message}</p>
          <button
            type="button"
            onClick={() => navigate('/connexion', { replace: true })}
            className="w-full p-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium text-white transition-colors"
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  // Default: initiating / pending / success — all show the neutral spinner
  const providerLabel: Record<string, string> = {
    google: 'Google',
    facebook: 'Facebook',
    apple: 'Apple',
  };
  const providerName = activeProvider ? (providerLabel[activeProvider] ?? activeProvider) : null;
  const label =
    phase === 'success'
      ? 'Connexion réussie, redirection…'
      : providerName
        ? `Connexion ${providerName} en cours…`
        : 'Connexion en cours…';

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4"
      role="status"
      aria-label={label}
      aria-live="polite"
    >
      <div className="text-center">
        <div
          className="rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin mx-auto mb-4"
          style={{ width: 40, height: 40 }}
          aria-hidden="true"
        />
        <p className="text-slate-300 text-sm font-medium">{label}</p>
        <p className="text-slate-500 text-xs mt-1">Vérification en cours…</p>
      </div>
    </div>
  );
}
