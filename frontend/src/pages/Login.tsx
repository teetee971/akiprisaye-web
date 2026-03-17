import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from 'react-hot-toast';

import { firebaseError, missingCriticalEnvKeys, wrongApiKeyDetected } from "@/lib/firebase";
import { FIREBASE_UNAVAILABLE_MESSAGE, getAuthErrorMessage } from "@/lib/authMessages";
import SocialLoginButtons from "@/components/SocialLoginButtons";
import { useAuth } from "@/context/AuthContext";
import { logDebug } from "@/utils/logger";
import { getRedirectPendingFlag } from "@/auth/authStorage";
import { isAuthBusy } from "@/auth/authStateMachine";

import { SEOHead } from '../components/ui/SEOHead';
type AuthMode = "login" | "signup";

export default function Login() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<"email" | "google" | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);

  const { signInEmailPassword, signUpEmailPassword, user, loading: authLoading, authFlowState } = useAuth();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const firebaseHealthy = !firebaseError && missingCriticalEnvKeys.length === 0 && !wrongApiKeyDetected;
  const showFirebaseStatus = import.meta.env.DEV || Boolean(firebaseError) || missingCriticalEnvKeys.length > 0 || wrongApiKeyDetected;

  const getSafeNext = useCallback(() => {
    const nextParam = searchParams.get("next");
    return nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : "/mon-compte";
  }, [searchParams]);

  // If the user is already signed in (e.g. after a redirect sign-in flow
  // where Firebase navigates back to this page), redirect immediately.
  useEffect(() => {
    if (user) {
      logDebug("[AUTH] redirecting authenticated user away from /connexion");
      // Fire a visible success confirmation before navigating.
      // The toast persists into the destination page because ToastProvider
      // is mounted at the app root, above the router outlet.
      toast.success(
        `Bienvenue${user.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}\u00a0!`,
        { id: 'auth-success', duration: 3000 },
      );
      navigate(getSafeNext(), { replace: true });
    }
  }, [getSafeNext, navigate, user]);

  useEffect(() => {
    if (firebaseError) {
      setError(FIREBASE_UNAVAILABLE_MESSAGE);
    }
  }, [firebaseError]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (firebaseError) {
      setError(FIREBASE_UNAVAILABLE_MESSAGE);
      return;
    }

    if (!email || !password) {
      setError("Email et mot de passe requis.");
      return;
    }

    setBusyAction("email");

    try {
      if (mode === "signup") {
        await signUpEmailPassword(email, password);
        setVerificationSent(true);
        return;
      } else {
        await signInEmailPassword(email, password);
      }

      navigate(getSafeNext());
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusyAction(null);
    }
  };

  const loading = busyAction !== null;

  // While Firebase auth is initialising (or settling an OAuth redirect result),
  // show a spinner instead of the login form. This prevents the form from
  // flashing briefly before the automatic post-OAuth redirect fires.
  // Also show the spinner if a redirect flow was just initiated (pending flag),
  // which means the user will be navigated to /auth/callback momentarily.
  const redirectPending = Boolean(getRedirectPendingFlag());

  if (authLoading || isAuthBusy(authFlowState) || redirectPending) {
    return (
      <>
        <SEOHead
          title="Connexion — A KI PRI SA YÉ"
          description="Connectez-vous à votre compte A KI PRI SA YÉ pour accéder à vos alertes prix et votre historique de contributions."
          canonical="https://teetee971.github.io/akiprisaye-web/connexion"
        />
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
          <div className="text-center">
            <div
              className="rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin mx-auto mb-4"
              style={{ width: 40, height: 40 }}
              role="status"
              aria-label="Vérification en cours"
            />
            <p className="text-slate-400 text-sm">Vérification en cours…</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead
        title="Connexion — A KI PRI SA YÉ"
        description="Connectez-vous à votre compte A KI PRI SA YÉ pour accéder à vos alertes prix et votre historique de contributions."
        canonical="https://teetee971.github.io/akiprisaye-web/connexion"
      />
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl p-6 shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-6 text-white text-center">Connexion</h1>

        {verificationSent ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-900/30 border border-green-700 rounded-lg text-green-200">
              <div className="flex items-start gap-2">
                <span className="text-xl flex-shrink-0">✅</span>
                <div>
                  <p className="font-medium mb-1">Compte créé !</p>
                  <p className="text-sm">
                    Un email de vérification a été envoyé à <strong>{email}</strong>.
                    Vérifiez votre boîte de réception et cliquez sur le lien pour activer votre compte.
                  </p>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setVerificationSent(false); setMode("login"); }}
              className="block w-full p-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium text-center transition-colors text-white"
            >
              Se connecter
            </button>
          </div>
        ) : (
          <>
        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-200 text-sm">
            <span>{error}</span>
          </div>
        )}

        <SocialLoginButtons
          redirectTo={getSafeNext()}
          onError={setError}
          showDivider={false}
        />

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-slate-700" />
          <span className="text-xs text-slate-500 uppercase tracking-wide">ou par email</span>
          <div className="flex-1 h-px bg-slate-700" />
        </div>

        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Adresse e-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="votre@email.com"
              required
              className="w-full p-3 rounded-lg bg-slate-800 text-white border border-gray-700 focus:border-blue-500 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder={mode === "signup" ? "Minimum 6 caractères" : "Votre mot de passe"}
              required
              minLength={6}
              className="w-full p-3 rounded-lg bg-slate-800 text-white border border-gray-700 focus:border-blue-500 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
          </div>

          <button
            type="submit"
            className="w-full p-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed text-white"
            disabled={loading}
          >
            {busyAction === "email"
              ? mode === "signup"
                ? "Création du compte…"
                : "Connexion en cours…"
              : mode === "signup"
                ? "Créer un compte"
                : "Se connecter"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setMode((current) => (current === "login" ? "signup" : "login"))}
            className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
            disabled={loading}
          >
            {mode === "login" ? "Créer un compte" : "J’ai déjà un compte"}
          </button>
        </div>

        <div className="mt-2 text-center">
          <Link
            to="/reset-password"
            className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
          >
            Mot de passe oublié ?
          </Link>
        </div>

        <div className="mt-3 text-center">
          <Link
            to="/activation-createur"
            className="text-xs text-amber-500 hover:text-amber-400 hover:underline"
          >
            ✨ Vous êtes le propriétaire ? Activez votre accès Créateur →
          </Link>
        </div>

        {showFirebaseStatus && (
          <div className="mt-6 p-3 bg-slate-800/70 border border-slate-700 rounded-lg text-xs">
            {firebaseHealthy ? (
              <p className="text-emerald-300 text-center">Firebase OK</p>
            ) : (
              <div className="text-amber-300">
                <p className="font-semibold">Firebase missing env at build time</p>
                {wrongApiKeyDetected && (
                  <p className="mt-1">Clé API Firebase incorrecte détectée dans ce build. Vérifiez le secret VITE_FIREBASE_API_KEY dans GitHub Actions.</p>
                )}
                {missingCriticalEnvKeys.length > 0 && (
                  <p className="mt-1 break-words">Clés manquantes : {missingCriticalEnvKeys.join(", ")}</p>
                )}
              </div>
            )}
          </div>
        )}
          </>
        )}
      </div>
    </div>
    </>
  );
}
