import React from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import '../styles/layout.css';
import { Menu, X } from 'lucide-react';
import TiPanierButton from './TiPanierButton';
import FloatingActions from './ui/FloatingActions';
import { OfflineIndicator } from './OfflineIndicator';

export default function Layout() {
  const [open, setOpen] = React.useState(false);

  // Navigation principale - Menu simplifié à 7 entrées principales
  // Chaque hub regroupe plusieurs fonctionnalités sous un seul point d'entrée
  const navItems = [
    { path: '/', label: 'Accueil', icon: '🏠' },
    { path: '/comparateurs', label: 'Comparateurs', icon: '📊' },
    { path: '/carte-itineraires', label: 'Carte', icon: '🗺️' },
    { path: '/scanner', label: 'Scanner', icon: '📷' },
    { path: '/assistant-ia', label: 'Assistant IA', icon: '🤖' },
    { path: '/observatoire-hub', label: 'Observatoire', icon: '📈' },
    { path: '/solidarite', label: 'Solidarité', icon: '🤝' },
  ];

  // Navigation secondaire - Accessible depuis le footer et menu mobile
  const secondaryNavItems = [
    { path: '/actualites', label: 'Actualités' },
    { path: '/pricing', label: 'Tarifs' },
    { path: '/presse', label: 'Presse' },
    { path: '/mon-compte', label: 'Mon espace' },
    { path: '/contact', label: 'Contact' },
  ];

  const publicNavItems = [
    { path: '/methodologie', label: 'Méthodologie' },
    { path: '/transparence', label: 'Transparence' },
    { path: '/donnees-publiques', label: 'Données publiques' },
    { path: '/presse', label: 'Presse' },
    { path: '/mentions-legales', label: 'Mentions légales' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
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
            
            <div className="border-t border-slate-700 py-2">
              <div className="px-6 py-2 text-xs uppercase tracking-wide text-slate-400">
                Plus
              </div>
              {secondaryNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className="block px-6 py-3 text-slate-200 hover:bg-slate-800 text-sm"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
            
            <div className="border-t border-slate-700 py-2">
              <div className="px-6 py-2 text-xs uppercase tracking-wide text-slate-400">
                Données publiques
              </div>
              {publicNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className="block px-6 py-3 text-slate-200 hover:bg-slate-800 text-sm"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Offline/Network Indicator */}
      <OfflineIndicator />

      {/* CONTENU */}
      <main className="flex-1 pt-20 pb-12 px-4 md:px-8">
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
