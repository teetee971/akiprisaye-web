import { useLocation } from "react-router-dom";
import AssistantChatButton from "../AssistantChat";
import PanierButton from "../TiPanierButton";
import "../../styles/floating-actions.css";

/**
 * FloatingActions - Unified container for floating action buttons
 * Prevents overlap on mobile by stacking chat and cart buttons vertically
 */
export default function FloatingActions() {
  const location = useLocation();
  const disabledRoutes = ['/observatoire', '/pricing', '/tarifs', '/inscription', '/login', '/connexion', '/subscribe'];
  const isDisabled = disabledRoutes.some((path) => location.pathname.startsWith(path));

  if (isDisabled) {
    return null;
  }

  return (
    <div className="floating-actions">
      <AssistantChatButton />
      <PanierButton />
    </div>
  );
}
