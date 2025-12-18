import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

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
              <span>Accueil</span>
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
              <span>Comparateur</span>
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
              <span>Scanner</span>
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
              <span>Carte</span>
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
              <span>Alertes</span>
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
              <span>Actualités</span>
            </Link>
          </li>
          <li>
            <Link
              to="/pricing"
              className={`flex items-center gap-3 px-6 py-3 text-white hover:bg-blue-700/20 transition-colors border-l-4 ${
                isActiveRoute('/pricing') ? 'border-blue-400 bg-blue-700/10' : 'border-transparent hover:border-blue-400'
              }`}
              onClick={closeMobileMenu}
            >
              <span>Tarifs</span>
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
              <span>Mon Compte</span>
            </Link>
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
                Comparateur
              </Link>
              <Link
                to="/scan"
                className={`text-white/90 hover:text-white hover:bg-[color:var(--glass-bg)] px-3 py-2 rounded-lg transition-all ${
                  isActiveRoute('/scan') ? 'bg-[color:var(--glass-bg)] text-white font-semibold' : ''
                }`}
              >
                Scanner
              </Link>
              <Link
                to="/carte"
                className={`text-white/90 hover:text-white hover:bg-[color:var(--glass-bg)] px-3 py-2 rounded-lg transition-all ${
                  isActiveRoute('/carte') ? 'bg-[color:var(--glass-bg)] text-white font-semibold' : ''
                }`}
              >
                Carte
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
                to="/actualites"
                className={`text-white/90 hover:text-white hover:bg-[color:var(--glass-bg)] px-3 py-2 rounded-lg transition-all ${
                  isActiveRoute('/actualites') ? 'bg-[color:var(--glass-bg)] text-white font-semibold' : ''
                }`}
              >
                Actualités
              </Link>
              <Link
                to="/mon-compte"
                className={`text-white/90 hover:text-white hover:bg-[color:var(--glass-bg)] px-3 py-2 rounded-lg transition-all ${
                  isActiveRoute('/mon-compte') ? 'bg-[color:var(--glass-bg)] text-white font-semibold' : ''
                }`}
              >
                Mon Compte
              </Link>
              
              {/* Theme Toggle */}
              <ThemeToggle />
            </nav>
          </div>
        </div>
      </header>
    </>
  );
}
