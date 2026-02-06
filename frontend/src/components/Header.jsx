import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

/**
 * Header sécurisé :
 * - Aucun crash si AuthContext absent
 * - Aucun crash si Router pas encore monté
 * - Aucun accès direct non protégé à window / localStorage
 * - Compatible ErrorBoundary
 */

// Import optionnels protégés
let useAuthSafe = null;
try {
  // eslint-disable-next-line import/no-unresolved
  ({ useAuth: useAuthSafe } = await import('../context/AuthContext'));
} catch {
  useAuthSafe = null;
}

let ThemeToggleSafe = null;
try {
  // eslint-disable-next-line import/no-unresolved
  ({ default: ThemeToggleSafe } = await import('./ThemeToggle'));
} catch {
  ThemeToggleSafe = null;
}

export default function Header() {
  // Sécurité Router
  let location = null;
  try {
    location = useLocation();
  } catch {
    location = { pathname: '/' };
  }

  // Sécurité Auth
  let user = null;
  let isAuthenticated = false;

  if (useAuthSafe) {
    try {
      const auth = useAuthSafe();
      user = auth?.user ?? null;
      isAuthenticated = Boolean(user);
    } catch {
      user = null;
      isAuthenticated = false;
    }
  }

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Empêche tout rendu prématuré
    setMounted(true);
  }, []);

  if (!mounted) {
    // Rendu neutre ultra-safe
    return (
      <header className="w-full h-14 bg-transparent" aria-hidden="true" />
    );
  }

  const isActive = (path) =>
    location?.pathname === path ? 'text-blue-500' : 'text-gray-300';

  return (
    <header className="w-full flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/40 backdrop-blur">
      {/* Logo */}
      <Link to="/" className="text-white font-bold text-lg">
        A KI PRI SA YÉ
      </Link>

      {/* Navigation */}
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

        {/* Auth (safe) */}
        {isAuthenticated ? (
          <span className="text-sm text-gray-400">
            Bonjour {user?.displayName ?? 'Utilisateur'}
          </span>
        ) : (
          <span className="text-sm text-gray-500">Invité</span>
        )}

        {/* Theme toggle (safe) */}
        {ThemeToggleSafe ? <ThemeToggleSafe /> : null}
      </nav>
    </header>
  );
}