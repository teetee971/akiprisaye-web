import React from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import '../styles/layout.css';
import { Menu, X } from 'lucide-react';

export default function Layout() {
  const [open, setOpen] = React.useState(false);

  const navItems = [
    { path: '/', label: 'Accueil' },
    { path: '/comparateur', label: 'Comparateur' },
    { path: '/scan', label: 'Scanner' },
    { path: '/carte', label: 'Carte' },
    { path: '/liste-courses', label: 'Liste de courses' },
    { path: '/evaluation-cosmetique', label: 'Cosmétiques' },
    { path: '/actualites', label: 'Actualités' },
    { path: '/pricing', label: 'Tarifs' },
    { path: '/contact', label: 'Contact' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800 shadow-md bg-slate-900/70 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img
              src="/logo-akiprisaye.svg"
              alt="A KI PRI SA YÉ Logo"
              className="h-8 w-auto"
            />
            <span className="font-semibold text-slate-100 text-base md:text-lg tracking-wide">
              A KI PRI SA YÉ
            </span>
          </Link>

          {/* Menu desktop */}
          <nav className="hidden md:flex space-x-6">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  isActive
                    ? 'text-blue-400 font-semibold'
                    : 'text-slate-300 hover:text-blue-400'
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Menu mobile */}
          <button
            className="md:hidden text-slate-300"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Dropdown mobile */}
        {open && (
          <div className="md:hidden bg-slate-900/95 backdrop-blur-xl border-t border-slate-700">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className="block px-6 py-3 text-slate-200 hover:bg-slate-800"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        )}
      </header>

      {/* CONTENU */}
      <main className="flex-1 pt-20 pb-12 px-4 md:px-8">
        <Outlet />
      </main>

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
