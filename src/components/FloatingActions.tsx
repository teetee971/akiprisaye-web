/**
 * FloatingActions - Stacked floating action buttons (chat and cart)
 * 
 * Features:
 * - Vertically stacked buttons with proper spacing
 * - Responsive sizing for mobile devices
 * - Pointer-events management to prevent blocking UI
 * - Optional raised state when bottom input is focused
 * - Accessible and follows WCAG guidelines
 */

import { useState, useEffect } from 'react';
import { MessageCircle, ShoppingCart } from 'lucide-react';
import { useTiPanier } from '../hooks/useTiPanier';

interface FloatingActionsProps {
  onChatClick?: () => void;
  onCartClick?: () => void;
  cartCount?: number;
  className?: string;
  raised?: boolean;
}

export default function FloatingActions({
  onChatClick,
  onCartClick,
  cartCount: externalCartCount,
  className = '',
  raised = false
}: FloatingActionsProps) {
  const { count: internalCartCount } = useTiPanier('comparison');
  const [isRaised, setIsRaised] = useState(raised);
  
  // Use external count if provided, otherwise use internal hook
  const cartCount = externalCartCount ?? internalCartCount;

  // Handle input focus events to raise the FAB container on mobile
  useEffect(() => {
    if (typeof window === 'undefined' || window.innerWidth > 768) {
      return; // Only apply on mobile
    }

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      
      // Check if focused element is an input near the bottom of the viewport
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      ) {
        const rect = target.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        
        // If input is in bottom third of viewport, raise the FABs
        if (rect.bottom > viewportHeight * 0.66) {
          setIsRaised(true);
        }
      }
    };

    const handleFocusOut = () => {
      setIsRaised(false);
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  // Sync with external raised prop
  useEffect(() => {
    setIsRaised(raised);
  }, [raised]);

  return (
    <div 
      className={`fab-container ${isRaised ? 'fab-container--raised' : ''} ${className}`}
      role="region"
      aria-label="Actions flottantes"
    >
      {/* Chat Button */}
      <button
        onClick={onChatClick}
        className="fab-button bg-blue-600 hover:bg-blue-500 text-white"
        aria-label="Ouvrir le chat d'assistance"
        title="Chat d'assistance"
        type="button"
      >
        <MessageCircle size={24} aria-hidden="true" />
      </button>

      {/* Cart Button */}
      <button
        onClick={onCartClick}
        className="fab-button bg-blue-600 hover:bg-blue-500 text-white relative"
        aria-label={`Panier: ${cartCount} article${cartCount > 1 ? 's' : ''}`}
        title={`Panier (${cartCount})`}
        type="button"
      >
        <ShoppingCart size={24} aria-hidden="true" />
        {cartCount > 0 && (
          <span 
            className="fab-badge"
            data-new={cartCount > 0}
            aria-hidden="true"
          >
            {cartCount}
          </span>
        )}
      </button>
    </div>
  );
}
