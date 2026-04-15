
/**
 * card.jsx — backward-compat shim
 * Delegates to GlassCard (Civic Glass design system).
 * Prefer importing GlassCard directly from './ui/glass-card'.
 */
export { GlassCard as Card } from './ui/glass-card';

export const CardContent = ({ children, className }) => (
  <div className={className}>{children}</div>
);

