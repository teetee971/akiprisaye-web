import { Menu, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { getShoppingListCount } from '../../store/useShoppingListStore';

const links = [
  { to: '/search', label: 'Recherche' },
  { to: '/scanner', label: 'Scan' },
  { to: '/pricing', label: 'Offres' },
  { to: '/liste', label: 'Liste' },
  { to: '/observatoire', label: 'Observatoire' },
  { to: '/actualites', label: 'Actualités' },
  { to: '/faq', label: 'FAQ' },
  { to: '/methodologie', label: 'Méthodologie' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/contact', label: 'Contact' },
];

export default function Header() {
  const [open, setOpen] = useState(false);
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

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center" aria-label="Accueil">
          <img src={`${import.meta.env.BASE_URL}logo-akiprisaye.svg`} alt="A KI PRI SA YÉ" className="h-8 w-auto" />
        </Link>
        <Link
          to="/liste"
          className="mr-3 rounded-lg border border-slate-700 px-3 py-1 text-sm text-slate-100"
          aria-label={`Ma liste (${count} article${count !== 1 ? 's' : ''})`}
        >
          Liste <span className="ml-1 rounded-full bg-blue-600 px-2 py-0.5 text-xs" aria-hidden="true">{count}</span>
        </Link>
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
  );
}
