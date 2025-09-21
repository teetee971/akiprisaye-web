import React from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const nav = [
  { to: '/', label: 'Accueil' },
  { to: '/produits', label: 'Produits' },
  { to: '/favoris', label: 'Favoris' },
  { to: '/vie-chere', label: 'Vie chère' },
  { to: '/compte', label: 'Compte' },
];

export default function MainLayout() {
  const { isAdmin } = useAuth();
  
  return (
    <div className="min-h-screen bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-extrabold tracking-tight text-2xl">
            A KI PRI <span className="text-emerald-600">SA YÉ</span>
          </Link>
          <nav className="flex gap-4 text-sm">
            {nav.map(n => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({isActive}) =>
                  `px-3 py-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/30 ${isActive ? 'bg-emerald-100 dark:bg-emerald-900/50' : ''}`
                }
              >{n.label}</NavLink>
            ))}
            {/* Admin link - only visible to admin users */}
            {isAdmin() && (
              <NavLink
                to="/admin"
                className={({isActive}) =>
                  `px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800 ${isActive ? 'bg-red-100 dark:bg-red-900/50' : ''}`
                }
              >
                🛡️ Admin
              </NavLink>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200/70 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-6 text-sm text-slate-500 flex items-center justify-between">
          <p>© {new Date().getFullYear()} A KI PRI SA YÉ · Guadeloupe & Martinique</p>
          <p><a className="hover:text-emerald-600" href="https://localhost:5173">Mentions légales</a></p>
        </div>
      </footer>
    </div>
  );
}
