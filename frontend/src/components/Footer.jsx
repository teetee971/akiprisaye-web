import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const [version, setVersion] = useState(null);
  const [debugActive, setDebugActive] = useState(false);
  const tapCount = useRef(0);
  const tapTimer = useRef(null);

  useEffect(() => {
    // Fetch version information — use BASE_URL so the path is correct on
    // GitHub Pages (/akiprisaye-web/version.json) and locally (/version.json).
    const base = import.meta.env.BASE_URL ?? '/';
    const url = base.endsWith('/') ? `${base}version.json` : `${base}/version.json`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => setVersion(data))
      .catch(() => {
        // Silently fail — version badge is optional
        setVersion(null);
      });

    // Reflect current debug state on mount
    try {
      setDebugActive(sessionStorage.getItem('auth:debug') === '1');
    } catch {
      // sessionStorage may be unavailable
    }

    return () => {
      if (tapTimer.current) clearTimeout(tapTimer.current);
    };
  }, []);

  /**
   * Secret triple-tap activator — tap the copyright line 3 times within 1.5 s
   * to toggle the auth debug panel without opening DevTools.
   * Useful on mobile Chrome / Samsung Internet.
   */
  const handleDebugTap = () => {
    tapCount.current += 1;
    if (tapTimer.current) clearTimeout(tapTimer.current);

    if (tapCount.current >= 3) {
      tapCount.current = 0;
      try {
        const next = sessionStorage.getItem('auth:debug') !== '1';
        if (next) {
          sessionStorage.setItem('auth:debug', '1');
        } else {
          sessionStorage.removeItem('auth:debug');
        }
        setDebugActive(next);
        window.location.reload();
      } catch {
        // sessionStorage unavailable — ignore
      }
      return;
    }

    tapTimer.current = setTimeout(() => {
      tapCount.current = 0;
    }, 1500);
  };

  return (
    <footer
      className="bg-slate-900 border-t border-slate-800 mt-auto"
      style={{ paddingBottom: 'max(1.5rem, var(--safe-bottom))' }}
      role="contentinfo"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Global Disclaimer */}
        <div className="mb-8">
          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
            <p className="text-blue-300 text-sm">Transparence civique et données officielles</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav
          className="flex flex-wrap justify-center gap-6 mb-6 text-sm"
          aria-label="Navigation du pied de page"
        >
          <Link to="/a-propos" className="text-slate-300 hover:text-blue-400 transition-colors">
            À propos
          </Link>
          <Link to="/methodologie" className="text-slate-300 hover:text-blue-400 transition-colors">
            Méthodologie
          </Link>
          <Link to="/actualites" className="text-slate-300 hover:text-blue-400 transition-colors">
            Actualités
          </Link>
          <Link to="/contact" className="text-slate-300 hover:text-blue-400 transition-colors">
            Contact
          </Link>
          <Link
            to="/mentions-legales"
            className="text-slate-300 hover:text-blue-400 transition-colors"
          >
            Mentions légales
          </Link>
        </nav>

        {/* Copyright — triple-tap to toggle auth debug panel */}
        <div className="text-center text-slate-400 text-sm">
          <button
            type="button"
            onClick={handleDebugTap}
            title={debugActive ? 'Auth debug actif — triple-tap pour désactiver' : undefined}
            style={{
              cursor: 'default',
              WebkitTapHighlightColor: 'transparent',
              background: 'none',
              border: 'none',
              color: 'inherit',
              font: 'inherit',
              padding: 0,
              display: 'block',
              width: '100%',
              textAlign: 'center',
            }}
          >
            © {new Date().getFullYear()} A KI PRI SA YÉ - Tous droits réservés
            {debugActive && (
              <span className="ml-2 text-xs text-orange-400" aria-label="Auth debug activé">
                🔒
              </span>
            )}
          </button>
          <p className="mt-2 text-xs text-slate-500">
            Plateforme citoyenne de transparence des prix en Outre-mer
          </p>
          {version &&
            (version.buildUrl ? (
              <a
                href={version.buildUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 text-xs text-slate-600 hover:text-slate-500 transition-colors"
                title={`Commit complet : ${version.commit || 'inconnu'} — branche : ${version.branch || '?'}`}
              >
                {version.shortCommit ?? version.commit?.slice(0, 7) ?? '?'} ·{' '}
                {version.branch ?? '?'} ·{' '}
                {version.builtAt ? new Date(version.builtAt).toLocaleDateString('fr-FR') : '?'}
              </a>
            ) : (
              <p
                className="mt-1 text-xs text-slate-600"
                title={`Commit : ${version.commit || 'inconnu'} — branche : ${version.branch || '?'}`}
              >
                {version.shortCommit ?? version.commit?.slice(0, 7) ?? '?'} ·{' '}
                {version.branch ?? '?'} ·{' '}
                {version.builtAt ? new Date(version.builtAt).toLocaleDateString('fr-FR') : '?'}
              </p>
            ))}
        </div>
      </div>
    </footer>
  );
}
