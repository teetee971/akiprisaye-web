import type { ReactNode } from 'react';

interface EmptyStateProps {
  /** Icon or emoji displayed above the message */
  icon?: ReactNode;
  /** Primary message */
  title: string;
  /** Optional secondary description */
  description?: string;
  /** Optional call-to-action element (e.g. a button or link) */
  action?: ReactNode;
  /** Additional classes for the wrapper */
  className?: string;
}

/**
 * Consistent empty-state placeholder used whenever a list or data section
 * has no items to display.  Accepts an optional icon, title, description and
 * CTA so each usage can be contextualised without duplicating layout code.
 */
export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/8 bg-white/[0.02] px-6 py-12 text-center ${className}`}
    >
      {icon && <div className="text-4xl" aria-hidden="true">{icon}</div>}
      <p className="text-base font-semibold text-white/80">{title}</p>
      {description && <p className="text-sm text-white/50 max-w-xs">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
