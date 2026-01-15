import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, userRole, _isGuest } = useAuth();

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
              to="/comparateurs"
              className={`flex items-center gap-3 px-6 py-3 text-white hover:bg-blue-700/20 transition-colors border-l-4 ${
                isActiveRoute('/comparateurs') ? 'border-blue-400 bg-blue-700/10' : 'border-transparent hover:border-blue-400'
              }`}
              onClick={closeMobileMenu}
            >
              <span>📊 Comparateurs</span>
            </Link>
          </li>
          <li>
            <Link
              to="/carte-itineraires"
              className={`flex items-center gap-3 px-6 py-3 text-white hover:bg-blue-700/20 transition-colors border-l-4 ${
                isActiveRoute('/carte-itineraires') ? 'border-blue-400 bg-blue-700/10' : 'border-transparent hover:border-blue-400'
              }`}
              onClick={closeMobileMenu}
            >
              <span>🗺️ Carte</span>
            </Link>
          </li>
          <li>
            <Link
              to="/scanner"
              className={`flex items-center gap-3 px-6 py-3 text-white hover:bg-blue-700/20 transition-colors border-l-4 ${
                isActiveRoute('/scanner') ? 'border-blue-400 bg-blue-700/10' : 'border-transparent hover:border-blue-400'
              }`}
              onClick={closeMobileMenu}
            >
              <span>📷 Scanner</span>
            </Link>
          </li>
          <li>
            <Link
              to="/assistant-ia"
              className={`flex items-center gap-3 px-6 py-3 text-white hover:bg-blue-700/20 transition-colors border-l-4 ${
                isActiveRoute('/assistant-ia') ? 'border-blue-400 bg-blue-700/10' : 'border-transparent hover:border-blue-400'
              }`}
              onClick={closeMobileMenu}
            >
              <span>🤖 Assistant IA</span>
            </Link>
          </li>
          <li>
            <Link
              to="/observatoire-hub"
              className={`flex items-center gap-3 px-6 py-3 text-white hover:bg-blue-700/20 transition-colors border-l-4 ${
                isActiveRoute('/observatoire-hub') ? 'border-blue-400 bg-blue-700/10' : 'border-transparent hover:border-blue-400'
              }`}
              onClick={closeMobileMenu}
            >
              <span>📈 Observatoire</span>
            </Link>
          </li>
          <li>
            <Link
              to="/solidarite"
              className={`flex items-center gap-3 px-6 py-3 text-white hover:bg-blue-700/20 transition-colors border-l-4 ${
                isActiveRoute('/solidarite') ? 'border-blue-400 bg-blue-700/10' : 'border-transparent hover:border-blue-400'
              }`}
              onClick={closeMobileMenu}
            >
              <span>🤝 Solidarité</span>
            </Link>
          </li>
          
          {/* Secondary Navigation */}
          <li className="px-6 py-2 mt-4">
            <div className="text-xs uppercase tracking-wide text-slate-400">Plus</div>
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
<<<<<<< HEAD
          <li>
            <Link
              to="/parametres"
              className={`flex items-center gap-3 px-6 py-3 text-white hover:bg-blue-700/20 transition-colors border-l-4 ${
                isActiveRoute('/parametres') ? 'border-blue-400 bg-blue-700/10' : 'border-transparent hover:border-blue-400'
              }`}
              onClick={closeMobileMenu}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Paramètres</span>
            </Link>
=======
          
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
>>>>>>> origin/main
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
                to="/ocr"
                className={`text-white/90 hover:text-white hover:bg-[color:var(--glass-bg)] px-3 py-2 rounded-lg transition-all ${
                  isActiveRoute('/ocr') ? 'bg-[color:var(--glass-bg)] text-white font-semibold' : ''
                }`}
              >
                OCR & Scan
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
              <Link
                to="/parametres"
                className={`text-white/90 hover:text-white hover:bg-[color:var(--glass-bg)] px-3 py-2 rounded-lg transition-all flex items-center gap-2 ${
                  isActiveRoute('/parametres') ? 'bg-[color:var(--glass-bg)] text-white font-semibold' : ''
                }`}
                title="Paramètres"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Paramètres
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
        </div>
      </header>
    </>
  );
}
