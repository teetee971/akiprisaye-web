import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEntitlements } from '../billing/useEntitlements';
import ThemeToggle from './ThemeToggle';
import { LanguageSelector } from './i18n/LanguageSelector';
import { isAuthBusy } from '../auth/authStateMachine';

const PLAN_BADGE = {
  FREE:            { label: 'Gratuit',         cls: 'bg-slate-700 text-slate-300' },
  FREEMIUM:        { label: 'Freemium',        cls: 'bg-slate-600 text-slate-200' },
  CITIZEN_PREMIUM: { label: 'Citoyen ✦',      cls: 'bg-green-700/60 text-green-300' },
  PRO:             { label: 'Pro ✦',           cls: 'bg-cyan-700/60 text-cyan-200' },
  BUSINESS:        { label: 'Business ✦',      cls: 'bg-blue-700/60 text-blue-200' },
  INSTITUTION:     { label: 'Institution ✦',  cls: 'bg-purple-700/60 text-purple-200' },
  CREATOR:         { label: '✨ Créateur',     cls: 'bg-amber-600/60 text-amber-200' },
};

export default function Header() {
  const location = useLocation();
  const auth = useAuth();
  const user = auth?.user ?? null;
  const isAuthenticated = Boolean(user);
  const signOutAction = auth?.signOutUser ?? null;
  const authLoading = auth?.loading ?? false;
  const authFlowState = auth?.authFlowState ?? 'resolving';
  // Show skeleton while loading OR while the state machine is busy (e.g. returning from OAuth redirect)
  const showSkeleton = authLoading || isAuthBusy(authFlowState);
  const { plan } = useEntitlements();
  const planInfo = PLAN_BADGE[plan] ?? null;

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <header className="w-full h-14 bg-transparent" aria-hidden="true" />;
  }

  const isActive = (path) =>
    location?.pathname === path ? 'text-blue-500' : 'text-gray-300';

  // Derive display name and initials for the avatar
  const displayLabel = user?.displayName ?? user?.email ?? 'Utilisateur';
  const initial = displayLabel[0]?.toUpperCase() ?? '?';

  return (
    <header className="w-full flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/40 backdrop-blur">
      <Link to="/" className="text-white font-bold text-lg">
        A KI PRI SA YÉ
      </Link>

      <nav className="flex items-center gap-4">
        <Link to="/" className={isActive('/')}>
          Accueil
        </Link>

        <Link to="/comparateur" className={isActive('/comparateur')}>
          Comparateur
        </Link>

        <Link to="/parametres" className={isActive('/parametres')}>
          Paramètres
        </Link>

        {showSkeleton ? (
          /* Auth is settling (e.g. OAuth redirect return) — neutral skeleton */
          <div
            className="w-7 h-7 rounded-full bg-slate-700 animate-pulse"
            role="status"
            aria-label="Chargement du compte…"
          />
        ) : isAuthenticated ? (
          <div className="flex items-center gap-2">
            {/* Avatar: photo if available, otherwise coloured initial */}
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt="Avatar"
                loading="lazy"
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-full object-cover border border-slate-600 flex-shrink-0"
              />
            ) : (
              <span
                className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                aria-hidden="true"
              >
                {initial}
              </span>
            )}
            <span
              className="text-sm text-gray-300 max-w-[140px] truncate hidden sm:block"
              title={user?.email ?? ''}
            >
              {displayLabel}
            </span>
            {planInfo && (
              <span className={`hidden sm:inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${planInfo.cls}`}>
                {planInfo.label}
              </span>
            )}
            {signOutAction ? (
              <button
                type="button"
                onClick={() => signOutAction()}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Se déconnecter
              </button>
            ) : null}
          </div>
        ) : (
          <Link to="/connexion" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
            Se connecter
          </Link>
        )}

        <ThemeToggle />
        <LanguageSelector variant="compact" />
      </nav>
    </header>
  );
}
