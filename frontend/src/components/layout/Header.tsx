import { Menu, Search, X, User, LogOut, Crown, Shield, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { getShoppingListCount } from '../../store/useShoppingListStore';
import { NotificationCenter } from '../NotificationCenter';
import GlobalSearch, { useGlobalSearchShortcut } from '../GlobalSearch';
import { useAuth } from '../../context/AuthContext';

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
  { to: '/transparence', label: 'Transparence' },
  { to: '/contact', label: 'Contact' },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [count, setCount] = useState(() => getShoppingListCount());
  const [accountOpen, setAccountOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { user, userRole, isAdmin, isCreator, signOutUser, loading } = useAuth();

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

  // Close account dropdown on outside click
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  const handleSignOut = async () => {
    setAccountOpen(false);
    await signOutUser();
    navigate('/');
  };

  // Derive initials for avatar
  const initials = user?.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email
      ? user.email[0].toUpperCase()
      : '?';

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

            {/* ── Account button ─────────────────────────────────── */}
            {loading ? (
              /* Auth is still settling (e.g. OAuth redirect return).
                 Show a neutral skeleton — never "Se connecter" while in-flight. */
              <div
                className="h-8 w-8 rounded-full bg-slate-700 animate-pulse"
                role="status"
                aria-label="Chargement du compte…"
              />
            ) : user ? (
              /* Logged-in: avatar + dropdown */
              <div ref={accountRef} className="relative">
                <button
                  type="button"
                  onClick={() => setAccountOpen(v => !v)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-2 py-1.5 text-slate-100 hover:bg-slate-800 transition-colors"
                  aria-label="Mon compte"
                  aria-expanded={accountOpen}
                  aria-haspopup="true"
                >
                  {/* Avatar circle */}
                  <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold flex-shrink-0 ${
                    isCreator ? 'bg-amber-500 text-slate-900' :
                    isAdmin   ? 'bg-blue-600 text-white' :
                                'bg-slate-600 text-white'
                  }`}>
                    {isCreator ? '✨' : initials}
                  </span>
                  <ChevronDown size={12} className={`transition-transform ${accountOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>

                {/* Dropdown */}
                {accountOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-slate-700 bg-slate-900 shadow-xl z-50 overflow-hidden">
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-slate-800">
                      {user.displayName && (
                        <p className="text-sm font-medium text-slate-200 truncate">{user.displayName}</p>
                      )}
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      {isCreator && (
                        <span className="inline-flex items-center gap-1 mt-1 text-xs font-bold text-amber-400">
                          <Crown size={11} /> Créateur
                        </span>
                      )}
                      {!isCreator && isAdmin && (
                        <span className="inline-flex items-center gap-1 mt-1 text-xs font-bold text-blue-400">
                          <Shield size={11} /> Administrateur
                        </span>
                      )}
                    </div>

                    {/* Links */}
                    <div className="py-1">
                      <Link
                        to="/mon-compte"
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-800 transition-colors"
                      >
                        <User size={15} className="text-slate-400" />
                        Mon compte
                      </Link>

                      {isCreator && (
                        <Link
                          to="/espace-createur"
                          onClick={() => setAccountOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-amber-300 hover:bg-amber-900/30 transition-colors"
                        >
                          <Crown size={15} />
                          Espace Créateur
                        </Link>
                      )}

                      {isAdmin && !isCreator && (
                        <Link
                          to="/admin"
                          onClick={() => setAccountOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-blue-300 hover:bg-blue-900/30 transition-colors"
                        >
                          <Shield size={15} />
                          Administration
                        </Link>
                      )}
                    </div>

                    {/* Sign out */}
                    <div className="border-t border-slate-800 py-1">
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-900/20 transition-colors"
                      >
                        <LogOut size={15} />
                        Se déconnecter
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Logged-out: "Se connecter" button */
              <Link
                to="/connexion"
                className="flex items-center gap-1.5 rounded-lg border border-slate-600 bg-blue-600 hover:bg-blue-500 px-3 py-1.5 text-sm font-semibold text-white transition-colors"
                aria-label="Se connecter"
              >
                <User size={14} aria-hidden="true" />
                <span className="hidden sm:inline">Se connecter</span>
              </Link>
            )}

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

      {/* Mobile full-width search bar */}
      <div className="sm:hidden border-t border-slate-800 px-4 py-2 bg-slate-950/95">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-400 text-sm transition-colors"
          aria-label="Ouvrir la recherche globale"
        >
          <Search size={14} className="shrink-0" aria-hidden="true" />
          <span className="flex-1 text-left truncate">Rechercher un produit, un magasin…</span>
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

            {/* Account links in mobile menu */}
            <li className="border-t border-slate-800 mt-2 pt-2">
              {loading ? (
                /* Skeleton while auth is settling */
                <div className="px-3 py-2 flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-slate-700 animate-pulse" />
                  <div className="h-4 w-24 rounded bg-slate-700 animate-pulse" />
                </div>
              ) : user ? (
                <div className="space-y-1">
                  {user.displayName && (
                    <div className="px-3 py-1.5 text-sm font-medium text-slate-200 truncate">{user.displayName}</div>
                  )}
                  <div className="px-3 py-1.5 text-xs text-slate-500 truncate">{user.email}</div>
                  <NavLink to="/mon-compte" onClick={closeMenu}
                    className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-slate-800 text-white' : 'text-slate-200'}`}>
                    <User size={14} /> Mon compte
                  </NavLink>
                  {isCreator && (
                    <NavLink to="/espace-createur" onClick={closeMenu}
                      className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-amber-900/40 text-amber-300' : 'text-amber-300'}`}>
                      <Crown size={14} /> Espace Créateur
                    </NavLink>
                  )}
                  {isAdmin && !isCreator && (
                    <NavLink to="/admin" onClick={closeMenu}
                      className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-blue-900/40 text-blue-300' : 'text-blue-300'}`}>
                      <Shield size={14} /> Administration
                    </NavLink>
                  )}
                  <button type="button" onClick={() => { closeMenu(); handleSignOut(); }}
                    className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-900/20 transition-colors">
                    <LogOut size={14} /> Se déconnecter
                  </button>
                </div>
              ) : (
                <Link to="/connexion" onClick={closeMenu}
                  className="flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors">
                  <User size={14} /> Se connecter / Créer un compte
                </Link>
              )}
            </li>
          </ul>
        </nav>
      )}
      </header>
    </>
  );
}
