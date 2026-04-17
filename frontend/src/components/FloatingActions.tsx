import React from 'react';
import '../styles/floating-actions.css';

type Props = {
  cartCount?: number;
  onOpenChat?: () => void;
  onOpenCart?: () => void;
};

export const FloatingActions: React.FC<Props> = ({ cartCount = 0, onOpenChat, onOpenCart }) => {
  return (
    <div className="fab-container" aria-hidden={false}>
      <button className="fab" id="chatFab" aria-label="Ouvrir le chat" onClick={onOpenChat}>
        <span className="fab-icon" aria-hidden>
          💬
        </span>
      </button>

      <button className="fab fab--large" id="cartFab" aria-label="Panier" onClick={onOpenCart}>
        <span className="fab-icon" aria-hidden>
          🛒
        </span>
        <span className="fab-badge" aria-live="polite">
          {cartCount}
        </span>
      </button>
    </div>
  );
};

export default FloatingActions;
