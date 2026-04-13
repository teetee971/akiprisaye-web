import { Skeleton } from './Skeleton';

interface SkeletonCardProps {
  /** Number of text lines to render below the header area */
  lines?: number;
  /** Show a header bar (title placeholder) */
  showHeader?: boolean;
  /** Additional classes for the outer wrapper */
  className?: string;
}

/**
 * Reusable skeleton placeholder for card-shaped content blocks.
 * Drop-in replacement for spinner loaders in structured list / card UIs.
 */
export function SkeletonCard({ lines = 3, showHeader = true, className = '' }: SkeletonCardProps) {
  return (
    <div
      className={`rounded-2xl border border-white/8 bg-white/[0.03] p-4 space-y-3 ${className}`}
      aria-hidden="true"
    >
      {showHeader && <Skeleton className="h-5 w-2/3" />}
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-4 ${i === lines - 1 ? 'w-1/2' : 'w-full'}`} />
      ))}
    </div>
  );
}
