import { useLocation } from "react-router-dom";
import AssistantChatButton from "../AssistantChat";
import PanierButton from "../TiPanierButton";
import "../../styles/floating-actions.css";

interface FloatingActionsProps {
  cartCount?: number;
  onChatClick?: () => void;
  onCartClick?: () => void;
  raised?: boolean;
}

/**
 * FloatingActions - Unified container for floating action buttons
 * Prevents overlap on mobile by stacking chat and cart buttons vertically
 * 
 * Features:
 * - Stacked vertical layout with responsive sizing
 * - Pointer-events handling prevents blocking underlying UI
 * - Optional raised state to avoid covering bottom inputs/controls
 * - Accessible and keyboard-navigable
 * 
 * @param cartCount - Optional cart item count to pass to cart button
 * @param onChatClick - Optional callback for chat button clicks
 * @param onCartClick - Optional callback for cart button clicks
 * @param raised - Optional flag to raise the container (e.g., when bottom input is focused)
 */
export default function FloatingActions({ 
  cartCount, 
  onChatClick, 
  onCartClick,
  raised = false 
}: FloatingActionsProps) {
  const location = useLocation();
  const disabledRoutes = ['/observatoire', '/pricing', '/tarifs', '/inscription', '/login', '/connexion', '/subscribe'];
  const isDisabled = disabledRoutes.some((path) => location.pathname.startsWith(path));

  if (isDisabled) {
    return null;
  }

  const containerClass = `floating-actions${raised ? ' fab-container--raised' : ''}`;

  return (
    <div className={containerClass}>
      <AssistantChatButton />
      <PanierButton />
    </div>
  );
}
