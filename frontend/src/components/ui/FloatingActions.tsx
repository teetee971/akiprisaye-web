import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AssistantChat from '../AssistantChat';
import '../../styles/floating-actions.css';

type ActionItem = {
  key: string;
  label: string;
  to?: string;
  onClick?: () => void;
};

export default function FloatingActions() {
  const location = useLocation();
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const isHelpRoute = location.pathname.startsWith('/faq') || location.pathname.startsWith('/contact');

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current) {
        return;
      }
      if (!menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const actions = useMemo<ActionItem[]>(
    () => [
      {
        key: 'search',
        label: 'Rechercher un produit',
        onClick: () => {
          if (location.pathname === '/' || location.pathname === '/home') {
            const input = document.getElementById('home-search-input') as HTMLInputElement | null;
            input?.focus();
            input?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
          }
          navigate('/recherche-prix');
        }
      },
      { key: 'scan-ean', label: 'Scanner EAN', to: '/scan-ean' },
      { key: 'scan-ticket', label: 'Scanner ticket', to: '/recherche-prix?source=ticket' },
      { key: 'help', label: 'Aide / FAQ', to: '/faq' }
    ],
    [location.pathname, navigate]
  );

  const handleActionClick = (action: ActionItem) => {
    setIsOpen(false);
    action.onClick?.();
  };

  return (
    <>
      <div ref={menuRef}>
        {isOpen && (
          <div className="fabMenu" role="menu" aria-label="Actions rapides">
            <ul className="fabMenuList">
              {actions.map((action) => (
                <li key={action.key}>
                  {action.to ? (
                    <Link to={action.to} className="fabMenuItem" role="menuitem" onClick={() => setIsOpen(false)}>
                      {action.label}
                    </Link>
                  ) : (
                    <button type="button" className="fabMenuItem" role="menuitem" onClick={() => handleActionClick(action)}>
                      {action.label}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="button"
          className="fab"
          aria-label={isOpen ? 'Fermer les actions' : 'Ouvrir les actions rapides'}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((prev) => !prev)}
        >
          Actions
        </button>
      </div>

      {isHelpRoute && <div className="helpChatAnchor"><AssistantChat /></div>}
    </>
  );
}
