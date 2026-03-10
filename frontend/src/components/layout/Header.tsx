import { Menu, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { getShoppingListCount } from '../../store/useShoppingListStore';
import { NotificationCenter } from '../NotificationCenter';
import GlobalSearch, { useGlobalSearchShortcut } from '../GlobalSearch';

const links = [
  { to: '/search', label: 'Recherche' },
  { to: '/scanner', label: 'Scan' },
  { to: '/comparateurs', label: 'Comparateurs' },
  { to: '/pricing', label: 'Offres' },
  { to: '/liste', label: 'Liste' },
  { to: '/observatoire', label: 'Observatoire' },
  { to: '/actualites', label: 'Actualités' },
  { to: '/faq', label: 'FAQ' },
  { to: '/methodologie', label: 'Méthodologie' },
  { to: '/privacy', label: 'Transparence' },
  { to: '/contact', label: 'Contact' },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [count, setCount] = useState(() => getShoppingListCount());
  const buttonRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onStorage = () => setCount(getShoppingListCount());
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onStorage);
    window.addEventListener('akiprisaye:shopping-list-updated', onStorage as EventListener);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onStorage);
      window.removeEventListener('akiprisaye:shopping-list-updated', onStorage as EventListener);
    };
  }, []);

  // Move focus to first nav link when menu opens
  useEffect(() => {
    if (open && navRef.current) {
      const firstLink = navRef.current.querySelector<HTMLElement>('a');
      firstLink?.focus();
    }
  }, [open]);

  // Close menu on Escape key and return focus to trigger button
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const closeMenu = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  // Global search keyboard shortcut Ctrl+K / Cmd+K
  useGlobalSearchShortcut(() => setSearchOpen(true));

  return (
    <>
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center" aria-label="Accueil">
            <img src={`${import.meta.env.BASE_URL}logo-akiprisaye.svg`} alt="A KI PRI SA YÉ" className="h-8 w-auto" width="32" height="32" />
          </Link>

          {/* Search bar — compact trigger */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="hidden sm:flex items-center gap-2 flex-1 max-w-xs mx-4 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-400 text-sm transition-colors group"
            aria-label="Ouvrir la recherche globale (Ctrl+K)"
          >
            <Search size={14} className="shrink-0" aria-hidden="true" />
            <span className="flex-1 text-left truncate">Rechercher…</span>
            <kbd className="hidden lg:block text-xs px-1.5 py-0.5 rounded border border-slate-700 bg-slate-800 font-mono text-slate-500 group-hover:border-slate-600">⌘K</kbd>
          </button>

          <div className="flex items-center gap-1.5">
            {/* Mobile search icon */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="sm:hidden rounded-lg border border-slate-700 p-2 text-slate-100"
              aria-label="Recherche"
            >
              <Search size={18} aria-hidden="true" />
            </button>

            <Link
              to="/liste"
              className="rounded-lg border border-slate-700 px-3 py-1 text-sm text-slate-100"
              aria-label={`Ma liste (${count} article${count !== 1 ? 's' : ''})`}
            >
              Liste <span className="ml-1 rounded-full bg-blue-600 px-2 py-0.5 text-xs" aria-hidden="true">{count}</span>
            </Link>
            <NotificationCenter />
            <button
              ref={buttonRef}
              type="button"
              onClick={() => setOpen((value) => !value)}
              className="rounded-lg border border-slate-700 p-2 text-slate-100"
              aria-expanded={open}
              aria-controls="main-nav"
              aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
            >
              {open ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
            </button>
          </div>
        </div>

      {open && (
        <nav
          id="main-nav"
          ref={navRef}
          aria-label="Navigation principale"
          className="border-t border-slate-800 bg-slate-900 px-4 py-2"
        >
          <ul className="space-y-1">
            {links.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `flex items-center justify-between rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-slate-800 text-white' : 'text-slate-200'}`
                  }
                >
                  <span>{link.label}</span>
                  {link.to === '/liste' ? (
                    <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white" aria-hidden="true">{count}</span>
                  ) : null}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
      </header>
    </>
  );
}
