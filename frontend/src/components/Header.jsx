import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import { LanguageSelector } from './i18n/LanguageSelector';

export default function Header() {
  const location = useLocation();
  const auth = useAuth();
  const user = auth?.user ?? null;
  const isAuthenticated = Boolean(user);
  const signOutAction = auth?.signOutUser ?? null;

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

        {isAuthenticated ? (
          <div className="flex items-center gap-2">
            {/* Avatar: photo if available, otherwise coloured initial */}
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt="Avatar"
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
