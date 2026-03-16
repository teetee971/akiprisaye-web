/**
 * SocialLoginButtons.tsx
 *
 * Boutons de connexion sociale réutilisables : Google, Facebook, Apple.
 * S'intègre dans Login.tsx, AuthForm.tsx, Inscription.tsx.
 *
 * Prérequis Firebase Console :
 *  - Google  : Authentication → Sign-in method → Google (activé par défaut si vous avez configuré Firebase)
 *  - Facebook: Authentication → Sign-in method → Facebook → entrer App ID + App Secret depuis developers.facebook.com
 *  - Apple   : Authentication → Sign-in method → Apple → configurer Apple Developer + Services ID
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getAuthErrorMessage } from '@/lib/authMessages';

/* ── SVG Logos ───────────────────────────────────────────────────────── */

const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const FacebookLogo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#1877F2" d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.696 4.533-4.696 1.313 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
  </svg>
);

const AppleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
);

/* ── Types ───────────────────────────────────────────────────────────── */

type Provider = 'google' | 'facebook' | 'apple';

interface SocialLoginButtonsProps {
  /** Redirect path after successful login. Defaults to /mon-compte */
  redirectTo?: string;
  /** Callback on success (optional, used alongside redirectTo) */
  onSuccess?: () => void;
  /** Callback on error */
  onError?: (msg: string) => void;
  /** Show divider "ou" above the buttons */
  showDivider?: boolean;
}

/* ── Error message helper ────────────────────────────────────────────── */

function getSocialErrorMessage(err: unknown): string {
  return getAuthErrorMessage(err);
}

/* ── Main component ──────────────────────────────────────────────────── */

/** True when running on a mobile browser that typically blocks popups. */
function isMobileBrowser(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export default function SocialLoginButtons({
  redirectTo = '/mon-compte',
  onSuccess,
  onError,
  showDivider = true,
}: SocialLoginButtonsProps) {
  const {
    signInGooglePopup,    signInGoogleRedirect,
    signInFacebookPopup, signInFacebookRedirect,
    signInApplePopup,    signInAppleRedirect,
    user,
  } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState<Provider | null>(null);
  // Stores the destination after a popup sign-in completes; navigation is
  // deferred until onAuthStateChanged confirms the user in context, avoiding
  // a race condition where RequireAuth sees user=null and bounces back to /login.
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);

  useEffect(() => {
    if (user && pendingRedirect) {
      navigate(pendingRedirect, { replace: true });
      setPendingRedirect(null);
    }
  }, [user, pendingRedirect, navigate]);

  // Already authenticated — hide all social login buttons.
  if (user) {
    return null;
  }

  const handleSocial = async (provider: Provider) => {
    setBusy(provider);

    // On mobile, skip the popup attempt entirely — Chrome blocks popups by default.
    // The redirect flow navigates the whole page, so we just kick it off and return.
    if (isMobileBrowser()) {
      try {
        if (provider === 'google')   await signInGoogleRedirect();
        if (provider === 'facebook') await signInFacebookRedirect();
        if (provider === 'apple')    await signInAppleRedirect();
      } catch (err: unknown) {
        onError?.(getSocialErrorMessage(err));
        setBusy(null);
      }
      // Page will navigate away — no need to clear busy state.
      return;
    }

    // Desktop: try popup first, fall back to redirect if blocked.
    try {
      if (provider === 'google')   await signInGooglePopup();
      if (provider === 'facebook') await signInFacebookPopup();
      if (provider === 'apple')    await signInApplePopup();
      onSuccess?.();
      // Defer navigation until onAuthStateChanged confirms the user in context
      // to avoid RequireAuth bouncing the route before auth state propagates.
      setPendingRedirect(redirectTo);
    } catch (err: unknown) {
      const code =
        typeof err === 'object' && err && 'code' in err
          ? String((err as { code: string }).code)
          : '';
      if (code === 'auth/popup-blocked') {
        // Silently fall back to redirect — page will navigate away.
        try {
          if (provider === 'google')   await signInGoogleRedirect();
          if (provider === 'facebook') await signInFacebookRedirect();
          if (provider === 'apple')    await signInAppleRedirect();
        } catch (redirectErr: unknown) {
          onError?.(getSocialErrorMessage(redirectErr));
          setBusy(null);
        }
        return;
      }
      setPendingRedirect(null);
      onError?.(getSocialErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const loading = busy !== null;

  return (
    <div className="w-full">
      {showDivider && (
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-slate-700" />
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">ou</span>
          <div className="flex-1 h-px bg-slate-700" />
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {/* Google */}
        <button
          type="button"
          onClick={() => handleSocial('google')}
          disabled={loading}
          className="flex items-center justify-center gap-3 w-full px-4 py-2.5 rounded-xl border border-slate-600 bg-white hover:bg-slate-50 text-slate-800 font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          aria-label="Se connecter avec Google"
        >
          {busy === 'google' ? (
            <span className="w-4.5 h-4.5 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin inline-block" style={{ width: 18, height: 18 }} />
          ) : (
            <GoogleLogo />
          )}
          <span>{busy === 'google' ? 'Connexion en cours…' : 'Continuer avec Google'}</span>
        </button>

        {/* Facebook */}
        <button
          type="button"
          onClick={() => handleSocial('facebook')}
          disabled={loading}
          className="flex items-center justify-center gap-3 w-full px-4 py-2.5 rounded-xl border border-[#1877F2]/40 bg-[#1877F2] hover:bg-[#166FE5] text-white font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          aria-label="Se connecter avec Facebook"
        >
          {busy === 'facebook' ? (
            <span className="border-2 border-blue-200 border-t-white rounded-full animate-spin" style={{ width: 18, height: 18, display: 'inline-block' }} />
          ) : (
            <FacebookLogo />
          )}
          <span>{busy === 'facebook' ? 'Connexion en cours…' : 'Continuer avec Facebook'}</span>
        </button>

        {/* Apple */}
        <button
          type="button"
          onClick={() => handleSocial('apple')}
          disabled={loading}
          className="flex items-center justify-center gap-3 w-full px-4 py-2.5 rounded-xl border border-slate-600 bg-black hover:bg-slate-900 text-white font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          aria-label="Se connecter avec Apple"
        >
          {busy === 'apple' ? (
            <span className="border-2 border-slate-600 border-t-white rounded-full animate-spin" style={{ width: 18, height: 18, display: 'inline-block' }} />
          ) : (
            <AppleLogo />
          )}
          <span>{busy === 'apple' ? 'Connexion en cours…' : 'Continuer avec Apple'}</span>
        </button>
      </div>

      <p className="mt-3 text-center text-xs text-slate-600 dark:text-slate-500">
        🔒 Connexion sécurisée — aucun mot de passe stocké
      </p>
    </div>
  );
}
