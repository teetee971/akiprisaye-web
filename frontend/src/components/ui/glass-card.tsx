import { cn } from '../../lib/utils';
import { useTilt3D } from '../../hooks/useTilt3D';
// 3D tilt effect styles — imported here so they only load with components that use them
import '../../styles/innovations-3d.css';

/**
 * GlassCard - Universal glass component
 * Civic Glass design system - institutional & chic
 * Supports optional 3D tilt effect via the `tilt` prop.
 */
export function GlassCard({
  className,
  children,
  tilt = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { tilt?: boolean }) {
  const tiltRef = useTilt3D<HTMLDivElement>();

  return (
    <div
      ref={tilt ? tiltRef : undefined}
      className={cn(
        'rounded-2xl border border-glass-border',
        'bg-glass backdrop-blur-glass',
        'shadow-[0_8px_30px_rgba(0,0,0,0.25)]',
        'p-4',
        'transition-all duration-250 ease-smooth',
        'hover:border-glass-border-hover hover:bg-glass-hover',
        'hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)]',
        'will-change-transform',
        tilt && 'card-3d',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * GlassCardStatic - Glass card without hover effects
 * For static content panels
 */
export function GlassCardStatic({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-glass-border',
        'bg-glass backdrop-blur-glass',
        'shadow-[0_8px_30px_rgba(0,0,0,0.25)]',
        'p-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * GlassCardStrong - Stronger glass effect
 * For important UI elements
 */
export function GlassCardStrong({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-glass-border',
        'bg-glass-strong backdrop-blur-strong',
        'shadow-[0_12px_40px_rgba(0,0,0,0.3)]',
        'p-4',
        'transition-all duration-250 ease-smooth',
        'hover:shadow-[0_16px_48px_rgba(0,0,0,0.4)]',
        'will-change-transform',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Export Card alias for backward compatibility
export { GlassCard as Card };
