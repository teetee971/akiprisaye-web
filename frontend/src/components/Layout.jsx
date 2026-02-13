import React from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import '../styles/layout.css';
import { Menu, X } from 'lucide-react';
import TiPanierButton from './TiPanierButton';
import FloatingActions from './ui/FloatingActions';
import { OfflineIndicator } from './OfflineIndicator';
import SkipLinks from './a11y/SkipLinks';
import A11ySettingsPanel from './a11y/A11ySettingsPanel';
import SeoDefaults from './SeoDefaults';
import { LanguageSelector } from './i18n/LanguageSelector';

export default function Layout() {
  const location = useLocation();
  const [open, setOpen] = React.useState(false);
  const [showScrollTop, setShowScrollTop] = React.useState(false);
  const [focusMode, setFocusMode] = React.useState(() => localStorage.getItem('focusMode') === 'true');
  const [showPalette, setShowPalette] = React.useState(false);
  const [paletteQuery, setPaletteQuery] = React.useState('');
  const [showShortcuts, setShowShortcuts] = React.useState(false);
  const [showCoach, setShowCoach] = React.useState(() => localStorage.getItem('coachDismissed') !== 'true');
  const [showQuickActions, setShowQuickActions] = React.useState(false);
  const [pinnedRoutes, setPinnedRoutes] = React.useState(() => {
    try {
      return JSON.parse(localStorage.getItem('pinnedRoutes') || '[]');
    } catch {
      return [];
    }
  });
  const paletteInputRef = React.useRef(null);
  const triggerHaptic = (pattern = 12) => {
    if (navigator?.vibrate) {
      navigator.vibrate(pattern);
    }
  };

  React.useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  React.useEffect(() => {
    localStorage.setItem('focusMode', String(focusMode));
  }, [focusMode]);

  React.useEffect(() => {
    localStorage.setItem('pinnedRoutes', JSON.stringify(pinnedRoutes));
  }, [pinnedRoutes]);

  React.useEffect(() => {
    if (!showCoach) {
      localStorage.setItem('coachDismissed', 'true');
    }
  }, [showCoach]);

  React.useEffect(() => {
    if (location.pathname) {
      localStorage.setItem('lastVisited', location.pathname);
    }
  }, [location.pathname]);

  React.useEffect(() => {
    const handleKeydown = (event) => {
      const isTyping = ['INPUT', 'TEXTAREA'].includes(event.target.tagName);
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setShowPalette(true);
      }
      if (!isTyping && event.key === '/') {
        event.preventDefault();
        setShowPalette(true);
      }
      if (!isTyping && event.key === '?') {
        event.preventDefault();
        setShowShortcuts(true);
        setShowPalette(true);
      }
      if (event.key === 'Escape') {
        setShowPalette(false);
        setShowShortcuts(false);
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, []);

  React.useEffect(() => {
    if (showPalette) {
      setTimeout(() => {
        paletteInputRef.current?.focus();
      }, 0);
    } else {
      setPaletteQuery('');
      setShowShortcuts(false);
    }
  }, [showPalette]);

  React.useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  React.useEffect(() => {
    if (!open) {
      document.body.style.overflow = '';
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  // Navigation principale - V1 officielle (7 entrées)
  const navItems = [
    { path: '/', label: 'Accueil', icon: '🏠' },
    { path: '/comparateur', label: 'Comparateur', icon: '📊' },
    { path: '/observatoire', label: 'Observatoire', icon: '📈' },
    { path: '/mes-economies', label: 'Mes Économies', icon: '💰' },
    { path: '/methodologie', label: 'Méthodologie', icon: '📚' },
    { path: '/faq', label: 'FAQ', icon: '❓' },
    { path: '/contact', label: 'Contact', icon: '✉️' },
  ];
  const quickLinks = [
    ...navItems,
    { path: '/scan-ean', label: 'Scanner EAN', icon: '📷' },
  ];
  const filteredLinks = quickLinks.filter((item) =>
    item.label.toLowerCase().includes(paletteQuery.toLowerCase())
  );
  const pinnedItems = pinnedRoutes
    .map((path) => quickLinks.find((item) => item.path === path))
    .filter(Boolean);
  const currentItem = quickLinks.find((item) => item.path === location.pathname);
  const isPinned = currentItem ? pinnedRoutes.includes(currentItem.path) : false;
  const nextSuggestion = (() => {
    const suggestionMap = [
      { match: '/', target: '/comparateur', label: 'Comparer les prix' },
      { match: '/comparateur', target: '/scan-ean', label: 'Scanner un produit' },
      { match: '/scan-ean', target: '/observatoire', label: 'Explorer l’observatoire' },
      { match: '/observatoire', target: '/methodologie', label: 'Lire la méthodologie' },
    ];
    const match = suggestionMap.find((entry) => location.pathname.startsWith(entry.match));
    return match && quickLinks.find((item) => item.path === match.target)
      ? { path: match.target, label: match.label }
      : null;
  })();
  const moduleHint = (() => {
    if (location.pathname.startsWith('/comparateur')) {
      return 'Astuce : comparez sur plusieurs enseignes pour révéler les écarts réels.';
    }
    if (location.pathname.startsWith('/scan-ean')) {
      return 'Astuce : scannez d’abord, puis confirmez en saisie manuelle si besoin.';
    }
    if (location.pathname.startsWith('/observatoire')) {
      return 'Astuce : utilisez les filtres pour isoler votre territoire.';
    }
    return null;
  })();

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <SeoDefaults />
      {/* Skip Links - Accessibilité RGAA */}
      <SkipLinks />
      
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setOpen(false)}
          aria-label="Fermer le menu mobile"
        />
      )}

      {/* HEADER */}
      <header id="main-nav" className="fixed top-0 left-0 right-0 border-b border-slate-800 shadow-md bg-slate-900/70 backdrop-blur-lg z-header" role="banner">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2" aria-label="Retour à l'accueil">
            <img
              src="/logo-akiprisaye.svg"
              alt="A KI PRI SA YÉ Logo"
              className="h-8 w-auto"
            />
          </Link>

          {/* Ti‑panier (desktop placement) */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSelector variant="compact" />
            <TiPanierButton float={false} />
          </div>

          {/* Menu desktop */}
          <nav className="hidden lg:flex items-center space-x-4" aria-label="Navigation principale">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-300 hover:text-blue-400 hover:bg-slate-800'
                  }`
                }
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Menu mobile */}
          <button
            type="button"
            className="lg:hidden text-slate-300"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            {open ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
          </button>
        </div>

        {/* Dropdown mobile */}
        {open && (
          <div id="mobile-menu" className="lg:hidden bg-slate-900/95 backdrop-blur-xl border-t border-slate-700 relative z-50" role="navigation" aria-label="Menu mobile">
            <div className="py-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-6 py-3 transition-colors ${
                      isActive
                        ? 'bg-blue-600/20 text-blue-400 font-semibold border-l-4 border-blue-400'
                        : 'text-slate-200 hover:bg-slate-800'
                    }`
                  }
                  onClick={() => setOpen(false)}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
            
          </div>
        )}
      </header>

      {/* Offline/Network Indicator */}
      <OfflineIndicator />

      {/* CONTENU */}
      <main
        id="main"
        className={`flex-1 pt-20 pb-24 px-4 md:px-8 ${focusMode ? 'max-w-4xl mx-auto' : ''}`}
        style={{ fontSize: 'clamp(0.95rem, 0.2vw + 0.9rem, 1.05rem)' }}
        role="main"
      >
        {showCoach && (
          <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/80">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-base font-semibold text-white">Coach rapide</div>
                <p className="mt-1 text-xs text-white/60">
                  Suivez ces étapes pour gagner du temps sur le comparateur et le scan.
                </p>
                <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs">
                  <li>Accédez à Comparateur pour comparer les prix.</li>
                  <li>Scannez ou saisissez un EAN pour un produit précis.</li>
                  <li>Activez une alerte pour suivre l’évolution des prix.</li>
                </ol>
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setShowCoach(false);
                }}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70 hover:text-white"
              >
                Masquer
              </button>
            </div>
          </div>
        )}
        {pinnedItems.length > 0 && (
          <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="text-xs font-semibold text-white/70">Accès rapides</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {pinnedItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/80 hover:border-white/30 hover:bg-white/10"
                >
                  {item.icon} {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
        {nextSuggestion && (
          <div className="mb-6 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 text-xs text-blue-100">
            👉 Étape suivante recommandée :{' '}
            <Link to={nextSuggestion.path} className="font-semibold text-white underline">
              {nextSuggestion.label}
            </Link>
          </div>
        )}
        {moduleHint && (
          <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs text-white/70">
            {moduleHint}
          </div>
        )}
        <Outlet />
      </main>

      {/* Floating actions (chat + panier) - managed by single container */}
      <FloatingActions />

      {/* Barre d'actions mobile (optimisée Android) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800 bg-slate-900/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-around px-4 py-2 text-xs text-slate-200">
          {['/', '/comparateur', '/scan-ean', '/contact'].map((path) => {
            const item = quickLinks.find((link) => link.path === path);
            return item ? (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => triggerHaptic(8)}
                className={`flex flex-col items-center gap-1 rounded-lg px-2 py-1 ${
                  location.pathname === item.path ? 'text-blue-300' : 'text-slate-200'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span className="text-[10px]">{item.label}</span>
              </Link>
            ) : null;
          })}
          <button
            type="button"
            onClick={() => {
              triggerHaptic(8);
              setShowQuickActions(true);
            }}
            className="flex flex-col items-center gap-1 rounded-lg px-2 py-1 text-slate-200"
            aria-label="Ouvrir les actions rapides"
          >
            <span className="text-base">⚡</span>
            <span className="text-[10px]">Actions</span>
          </button>
        </div>
      </div>

      {showScrollTop && (
        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="fixed bottom-24 right-6 z-40 rounded-full border border-white/10 bg-slate-900/90 px-4 py-2 text-xs font-semibold text-white shadow-lg transition hover:bg-slate-800"
          aria-label="Remonter en haut de la page"
        >
          ⬆️ Retour en haut
        </button>
      )}

      {/* Panneau de paramètres d'accessibilité */}
      <A11ySettingsPanel />

      {showPalette && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm">
          <div className="mx-auto mt-24 w-[92%] max-w-xl rounded-2xl border border-white/10 bg-slate-900 p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-white">Recherche rapide</div>
              <div className="text-xs text-white/60">Ctrl/Cmd + K • /</div>
            </div>
            <input
              ref={paletteInputRef}
              value={paletteQuery}
              onChange={(event) => setPaletteQuery(event.target.value)}
              placeholder="Rechercher une page, un module..."
              className="mt-3 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {pinnedItems.length > 0 && (
              <div className="mt-4">
                <div className="text-xs font-semibold text-white/70">Épinglés</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {pinnedItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setShowPalette(false)}
                      className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/80 hover:bg-white/10"
                    >
                      {item.icon} {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-4 space-y-2">
              {filteredLinks.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    triggerHaptic(8);
                    setShowPalette(false);
                  }}
                  className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
                >
                  <span>
                    {item.icon} {item.label}
                  </span>
                  <span className="text-xs text-white/40">{item.path}</span>
                </Link>
              ))}
              {filteredLinks.length === 0 && (
                <div className="text-xs text-white/50">Aucun résultat. Essayez un autre terme.</div>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setFocusMode(!focusMode)}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70 hover:text-white"
              >
                {focusMode ? 'Désactiver mode focus' : 'Activer mode focus'}
              </button>
              {currentItem && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(8);
                    if (isPinned) {
                      setPinnedRoutes(pinnedRoutes.filter((path) => path !== currentItem.path));
                    } else {
                      setPinnedRoutes([...new Set([...pinnedRoutes, currentItem.path])]);
                    }
                  }}
                  className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70 hover:text-white"
                >
                  {isPinned ? 'Retirer des favoris' : 'Épingler cette page'}
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowPalette(false)}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70 hover:text-white"
              >
                Fermer
              </button>
            </div>
            {showShortcuts && (
              <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-white/70">
                <div className="font-semibold text-white/80">Raccourcis clavier</div>
                <ul className="mt-2 space-y-1">
                  <li>Ctrl/Cmd + K : ouvrir la recherche rapide</li>
                  <li>/ : ouvrir la recherche rapide</li>
                  <li>? : afficher l’aide des raccourcis</li>
                  <li>Échap : fermer</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {showQuickActions && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm">
          <div className="fixed bottom-0 left-0 right-0 rounded-t-2xl border-t border-white/10 bg-slate-900 p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-white">Actions rapides</div>
              <button
                type="button"
                onClick={() => setShowQuickActions(false)}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70"
              >
                Fermer
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-white/80">
              {quickLinks.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    triggerHaptic(8);
                    setShowQuickActions(false);
                  }}
                  className="rounded-lg border border-white/10 px-3 py-3 text-center hover:bg-white/10"
                >
                  <div className="text-base">{item.icon}</div>
                  <div className="mt-1">{item.label}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer id="footer" className="border-t border-slate-800 bg-slate-900/90 text-center py-6 text-sm text-slate-400" role="contentinfo">
        © {new Date().getFullYear()} A KI PRI SA YÉ — Transparence des prix Outre-mer.
        <br />
        <Link to="/mentions-legales" className="hover:text-blue-400">
          Mentions légales
        </Link>
      </footer>
    </div>
  );
}
