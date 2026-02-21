import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useShoppingListStore } from '../../store/useShoppingListStore';

const links = [
  { to: '/search', label: 'Recherche' },
  { to: '/liste', label: 'Liste de courses' },
  { to: '/scanner', label: 'Scan' },
  { to: '/observatoire', label: 'Observatoire' },
  { to: '/actualites', label: 'Actualités' },
  { to: '/faq', label: 'FAQ' },
  { to: '/methodologie', label: 'Méthodologie' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/contact', label: 'Contact' },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const { items } = useShoppingListStore();
  const count = items.length;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center" aria-label="Accueil">
          <img src="/logo-akiprisaye.svg" alt="A KI PRI SA YÉ" className="h-8 w-auto" />
        </Link>

        <div className="flex items-center gap-2">
          <Link
            to="/liste"
            className="inline-flex items-center gap-2 rounded-lg border border-blue-500/60 bg-blue-600/20 px-3 py-2 text-sm font-semibold text-blue-100 hover:bg-blue-600/30"
            aria-label={`Ouvrir la liste de courses (${count} article${count > 1 ? 's' : ''})`}
          >
            <span aria-hidden>🛒</span>
            <span>Liste</span>
            <span className="rounded-full bg-blue-500 px-2 py-0.5 text-xs text-white">{count}</span>
          </Link>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="rounded-lg border border-slate-700 p-2 text-slate-100"
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-slate-800 bg-slate-900 px-4 py-2">
          <ul className="space-y-1">
            {links.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `block rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-slate-800 text-white' : 'text-slate-200'}`
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
