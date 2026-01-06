import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, userRole, isGuest } = useAuth();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    // Prevent body scroll when menu is open
    document.body.style.overflow = !mobileMenuOpen ? 'hidden' : '';
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    document.body.style.overflow = '';
  };

  // Close menu on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        closeMobileMenu();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [mobileMenuOpen]);

  // Helper to check if route is active
  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 z-40 lg:hidden"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer Menu */}
      <nav
        className={`fixed top-0 left-0 h-full w-80 glass-strong z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Navigation mobile"
      >
        <div className="flex items-center justify-between p-4 border-b border-[color:var(--glass-border)]" style={{ paddingTop: 'max(1rem, var(--safe-top))' }}>
          <div className="flex items-center gap-3">
            <img src="/logo-akpsy.svg" alt="A KI PRI SA YÉ" className="h-8" />
          </div>
          <button
            onClick={closeMobileMenu}
            className="text-white text-3xl leading-none hover:text-[color:var(--text-muted)]"
            aria-label="Fermer le menu"
          >
            &times;
          </button>
        </div>
        
        <ul className="py-4">
          <li>
            <Link
              to="/"
              className={`flex items-center gap-3 px-6 py-3 text-white hover:bg-blue-700/20 transition-colors border-l-4 ${
                isActiveRoute('/') ? 'border-blue-400 bg-blue-700/10' : 'border-transparent hover:border-blue-400'
              }`}
              onClick={closeMobileMenu}
            >
              <span>🏠 Accueil</span>
            </Link>
          </li>
          <li>
            <Link
              to="/comparateur"
              className={`flex items-center gap-3 px-6 py-3 text-white hover:bg-blue-700/20 transition-colors border-l-4 ${
                isActiveRoute('/comparateur') ? 'border-blue-400 bg-blue-700/10' : 'border-transparent hover:border-blue-400'
              }`}
              onClick={closeMobileMenu}
            >
              <span>🛒 Comparer</span>
            </Link>
          </li>
          <li>
            <Link
              to="/comprendre-prix"
              className={`flex items-center gap-3 px-6 py-3 text-white hover:bg-blue-700/20 transition-colors border-l-4 ${
                isActiveRoute('/comprendre-prix') ? 'border-blue-400 bg-blue-700/10' : 'border-transparent hover:border-blue-400'
              }`}
              onClick={closeMobileMenu}
            >
              <span>💡 Comprendre</span>
            </Link>
          </li>
          <li>
            <Link
              to="/scan"
              className={`flex items-center gap-3 px-6 py-3 text-white hover:bg-blue-700/20 transition-colors border-l-4 ${
                isActiveRoute('/scan') ? 'border-blue-400 bg-blue-700/10' : 'border-transparent hover:border-blue-400'
              }`}
              onClick={closeMobileMenu}
            >
              <span>📷 Scanner</span>
            </Link>
          </li>
          <li>
            <Link
              to="/carte"
              className={`flex items-center gap-3 px-6 py-3 text-white hover:bg-blue-700/20 transition-colors border-l-4 ${
                isActiveRoute('/carte') ? 'border-blue-400 bg-blue-700/10' : 'border-transparent hover:border-blue-400'
              }`}
              onClick={closeMobileMenu}
            >
              <span>🗺️ Carte</span>
            </Link>
          </li>
          <li>
            <Link
              to="/civic-modules"
              className={`flex items-center gap-3 px-6 py-3 text-white hover:bg-blue-700/20 transition-colors border-l-4 ${
                isActiveRoute('/civic-modules') ? 'border-blue-400 bg-blue-700/10' : 'border-transparent hover:border-blue-400'
              }`}
              onClick={closeMobileMenu}
            >
              <span>🤝 Participer</span>
            </Link>
          </li>
          <li>
            <Link
              to="/alertes"
              className={`flex items-center gap-3 px-6 py-3 text-white hover:bg-blue-700/20 transition-colors border-l-4 ${
                isActiveRoute('/alertes') ? 'border-blue-400 bg-blue-700/10' : 'border-transparent hover:border-blue-400'
              }`}
              onClick={closeMobileMenu}
            >
              <span>🚨 Alertes</span>
            </Link>
          </li>
          <li>
            <Link
              to="/actualites"
              className={`flex items-center gap-3 px-6 py-3 text-white hover:bg-blue-700/20 transition-colors border-l-4 ${
                isActiveRoute('/actualites') ? 'border-blue-400 bg-blue-700/10' : 'border-transparent hover:border-blue-400'
              }`}
              onClick={closeMobileMenu}
            >
              <span>📰 Actualités</span>
            </Link>
          </li>
          <li>
            <Link
              to="/mon-compte"
              className={`flex items-center gap-3 px-6 py-3 text-white hover:bg-blue-700/20 transition-colors border-l-4 ${
                isActiveRoute('/mon-compte') ? 'border-blue-400 bg-blue-700/10' : 'border-transparent hover:border-blue-400'
              }`}
              onClick={closeMobileMenu}
            >
              <span>👤 Mon Compte</span>
            </Link>
          </li>
          
          {/* Status Badge in Mobile Menu */}
          <li className="px-6 py-3">
            {user ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-900/30 border border-green-700/50 w-fit">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-green-200 text-sm font-medium capitalize">{userRole}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-700/30 border border-slate-600/50 w-fit">
                <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                <span className="text-gray-300 text-sm font-medium">Invité</span>
              </div>
            )}
          </li>
        </ul>
      </nav>

      {/* Header */}
      <header
        className="sticky top-0 z-30 glass-strong border-b border-[color:var(--glass-border)] max-w-[100vw]"
        style={{ paddingTop: 'max(0.75rem, var(--safe-top))' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and burger menu */}
            <div className="flex items-center gap-4">
              {/* Mobile menu button */}
              <button
                onClick={toggleMobileMenu}
                className="lg:hidden flex flex-col justify-center items-center w-10 h-10 rounded hover:bg-[color:var(--glass-bg)] transition-colors"
                aria-label="Menu"
                aria-expanded={mobileMenuOpen}
              >
                <span className={`block w-6 h-0.5 bg-white transition-all ${mobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
                <span className={`block w-6 h-0.5 bg-white my-1 transition-all ${mobileMenuOpen ? 'opacity-0' : ''}`} />
                <span className={`block w-6 h-0.5 bg-white transition-all ${mobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
              </button>

              {/* Logo with subtle hover animation */}
              <Link to="/" className="flex items-center gap-2 text-white font-bold text-lg group">
                <img 
                  src="/logo-akpsy.svg" 
                  alt="A KI PRI SA YÉ" 
                  className="h-10 transition-transform group-hover:scale-105 motion-reduce:transform-none" 
                />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6" aria-label="Navigation principale">
              <Link
                to="/comparateur"
                className={`text-white/90 hover:text-white hover:bg-[color:var(--glass-bg)] px-3 py-2 rounded-lg transition-all ${
                  isActiveRoute('/comparateur') ? 'bg-[color:var(--glass-bg)] text-white font-semibold' : ''
                }`}
              >
                Comparer
              </Link>
              <Link
                to="/comprendre-prix"
                className={`text-white/90 hover:text-white hover:bg-[color:var(--glass-bg)] px-3 py-2 rounded-lg transition-all ${
                  isActiveRoute('/comprendre-prix') ? 'bg-[color:var(--glass-bg)] text-white font-semibold' : ''
                }`}
              >
                Comprendre
              </Link>
              <Link
                to="/civic-modules"
                className={`text-white/90 hover:text-white hover:bg-[color:var(--glass-bg)] px-3 py-2 rounded-lg transition-all ${
                  isActiveRoute('/civic-modules') ? 'bg-[color:var(--glass-bg)] text-white font-semibold' : ''
                }`}
              >
                Participer
              </Link>
              <Link
                to="/alertes"
                className={`text-white/90 hover:text-white hover:bg-[color:var(--glass-bg)] px-3 py-2 rounded-lg transition-all ${
                  isActiveRoute('/alertes') ? 'bg-[color:var(--glass-bg)] text-white font-semibold' : ''
                }`}
              >
                Alertes
              </Link>
              <Link
                to="/mon-compte"
                className={`text-white/90 hover:text-white hover:bg-[color:var(--glass-bg)] px-3 py-2 rounded-lg transition-all ${
                  isActiveRoute('/mon-compte') ? 'bg-[color:var(--glass-bg)] text-white font-semibold' : ''
                }`}
              >
                Mon Compte
              </Link>
              
              {/* Connection Status Badge */}
              {user ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-900/30 border border-green-700/50">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-green-200 text-sm font-medium capitalize">{userRole}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-700/30 border border-slate-600/50">
                  <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                  <span className="text-gray-300 text-sm font-medium">Invité</span>
                </div>
              )}
              
              {/* Theme Toggle */}
              <ThemeToggle />
            </nav>
          </div>
          <div className="pt-2 pb-3 text-center text-xs text-white/90 dark:text-slate-100 font-semibold">
            Périmètre actuellement couvert : Guadeloupe, Martinique (phase pilote)
          </div>
        </div>
      </header>
    </>
  );
}
