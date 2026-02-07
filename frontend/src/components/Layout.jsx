import React from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import '../styles/layout.css';
import { Menu, X } from 'lucide-react';
import TiPanierButton from './TiPanierButton';
import FloatingActions from './ui/FloatingActions';
import { OfflineIndicator } from './OfflineIndicator';

export default function Layout() {
  const [open, setOpen] = React.useState(false);

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

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      {/* Skip to main content link for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:m-2 focus:rounded"
      >
        Aller au contenu principal
      </a>
      
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 border-b border-slate-800 shadow-md bg-slate-900/70 backdrop-blur-lg z-header">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img
              src="/logo-akiprisaye.svg"
              alt="A KI PRI SA YÉ Logo"
              className="h-8 w-auto"
            />
          </Link>

          {/* Ti‑panier (desktop placement) */}
          <div className="hidden md:flex items-center">
            <TiPanierButton float={false} />
          </div>

          {/* Menu desktop */}
          <nav className="hidden lg:flex items-center space-x-4">
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
            className="lg:hidden text-slate-300"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Dropdown mobile */}
        {open && (
          <div className="lg:hidden bg-slate-900/95 backdrop-blur-xl border-t border-slate-700">
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
      <main id="main-content" className="flex-1 pt-20 pb-12 px-4 md:px-8">
        <Outlet />
      </main>

      {/* Floating actions (chat + panier) - managed by single container */}
      <FloatingActions />

      {/* FOOTER */}
      <footer className="border-t border-slate-800 bg-slate-900/90 text-center py-6 text-sm text-slate-400">
        © {new Date().getFullYear()} A KI PRI SA YÉ — Transparence des prix Outre-mer.
        <br />
        <Link to="/mentions-legales" className="hover:text-blue-400">
          Mentions légales
        </Link>
      </footer>
    </div>
  );
}
