import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const actions = [
  { to: '/search', label: 'Rechercher' },
  { to: '/scanner?mode=ean', label: 'Scanner EAN' },
  { to: '/scanner?mode=ticket', label: 'Scanner ticket' },
  { to: '/faq', label: 'Aide' },
];

export default function FabActions() {
  const [open, setOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > window.innerHeight * 0.25);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Move focus to first action link when menu opens
  useEffect(() => {
    if (open && menuRef.current) {
      const firstLink = menuRef.current.querySelector<HTMLElement>('a');
      firstLink?.focus();
    }
  }, [open]);

  // Close menu on Escape and return focus to trigger button
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

  return (
    <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-30">
      {open && (
        <div
          ref={menuRef}
          id="fab-actions-menu"
          role="menu"
          aria-label="Actions rapides"
          className="mb-2 w-44 rounded-xl border border-slate-700 bg-slate-900/95 p-2 shadow-xl"
        >
          {actions.map((action) => (
            <Link
              key={action.label}
              to={action.to}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm text-slate-100 hover:bg-slate-800"
            >
              {action.label}
            </Link>
          ))}
        </div>
      )}

      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`rounded-full bg-blue-600 text-white shadow-lg transition-all hover:bg-blue-500 ${compact ? 'px-3 py-3 text-xs' : 'px-4 py-3 text-sm'}`}
        aria-expanded={open}
        aria-controls="fab-actions-menu"
        aria-label={open ? 'Fermer les actions rapides' : 'Ouvrir les actions rapides'}
      >
        Actions
      </button>
    </div>
  );
}
