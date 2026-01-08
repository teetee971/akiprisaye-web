import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import AssistantChatButton from "../AssistantChat";
import PanierButton from "../TiPanierButton";
import { useIsMobile } from "../../hooks/useIsMobile";

/**
 * FloatingActions - Unified container for floating action buttons
 * Prevents overlap on mobile by stacking chat and cart buttons vertically
 * 
 * Features:
 * - Vertically stacked buttons with proper spacing
 * - Pointer-events management to prevent blocking UI
 * - Auto-raises when bottom input is focused on mobile
 * - Responsive sizing for different screen sizes
 */
export default function FloatingActions() {
  const location = useLocation();
  const disabledRoutes = ['/observatoire', '/pricing', '/tarifs', '/inscription', '/login', '/connexion', '/subscribe'];
  const isDisabled = disabledRoutes.some((path) => location.pathname.startsWith(path));
  const [isRaised, setIsRaised] = useState(false);
  const isMobile = useIsMobile();

  // Handle input focus events to raise the FAB container on mobile
  useEffect(() => {
    if (!isMobile) {
      return; // Only apply on mobile
    }

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      
      // Check if focused element is an input near the bottom of the viewport
      // Use case-insensitive matching for better browser compatibility
      const tagName = target.tagName.toUpperCase();
      if (
        tagName === 'INPUT' ||
        tagName === 'TEXTAREA' ||
        tagName === 'SELECT'
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
  }, [isMobile]);

  if (isDisabled) {
    return null;
  }

  return (
    <div 
      className={`fab-container ${isRaised ? 'fab-container--raised' : ''}`}
      role="region"
      aria-label="Actions flottantes"
    >
      <AssistantChatButton />
      <PanierButton />
    </div>
  );
}
