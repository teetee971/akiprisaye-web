import { cn } from '../../lib/utils';

/**
 * ListItem - Civic Glass list component
 * Clean, readable, institutional
 * Used for shopping lists, stores, etc.
 */
export function ListItem({
  title,
  right,
  subtitle,
  className,
  ...props
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between',
        'rounded-xl border border-glass-border',
        'bg-glass backdrop-blur-glass',
        'p-3',
        'transition-all duration-200',
        'hover:border-glass-border-hover hover:bg-glass-hover',
        className,
      )}
      {...props}
    >
      <div className="flex flex-col">
        <span className="text-sm font-medium text-foreground">{title}</span>
        {subtitle && <span className="text-xs text-muted mt-0.5">{subtitle}</span>}
      </div>
      {right && (
        <span className="text-xs text-muted font-mono">{right}</span>
      )}
    </div>
  );
}

/**
 * ListItemStatic - Non-interactive list item
 * No hover effects
 */
export function ListItemStatic({
  title,
  right,
  subtitle,
  className,
  ...props
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between',
        'rounded-xl border border-glass-border',
        'bg-glass backdrop-blur-glass',
        'p-3',
        className,
      )}
      {...props}
    >
      <div className="flex flex-col">
        <span className="text-sm font-medium text-foreground">{title}</span>
        {subtitle && <span className="text-xs text-muted mt-0.5">{subtitle}</span>}
      </div>
      {right && (
        <span className="text-xs text-muted font-mono">{right}</span>
      )}
    </div>
  );
}
