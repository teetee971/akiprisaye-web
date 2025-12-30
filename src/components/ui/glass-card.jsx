import { cn } from '../../lib/utils';

/**
 * GlassCard - Universal glass component
 * Civic Glass design system - institutional & chic
 */
export function GlassCard({
  className,
  children,
  ...props
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-glass-border',
        'bg-glass backdrop-blur-glass',
        'shadow-[0_8px_30px_rgba(0,0,0,0.25)]',
        'p-6',
        'transition-all duration-300',
        'hover:border-glass-border-hover hover:bg-glass-hover',
        className,
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
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-glass-border',
        'bg-glass backdrop-blur-glass',
        'shadow-[0_8px_30px_rgba(0,0,0,0.25)]',
        'p-6',
        className,
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
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-glass-border',
        'bg-glass-strong backdrop-blur-strong',
        'shadow-[0_12px_40px_rgba(0,0,0,0.3)]',
        'p-6',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
