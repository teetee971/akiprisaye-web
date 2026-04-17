/**
 * card.jsx — backward-compat shim
 * Delegates to GlassCard (Civic Glass design system).
 * Prefer importing GlassCard directly from './glass-card'.
 */
export { GlassCard as Card } from './glass-card';

export const CardContent = ({ children, className }) => <div className={className}>{children}</div>;
