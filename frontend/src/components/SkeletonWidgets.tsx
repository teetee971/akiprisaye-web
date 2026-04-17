/**
 * SkeletonWidgets — typed skeleton placeholders for lazy-loaded page sections.
 *
 * Use these as `fallback` props on `<Suspense>` boundaries to prevent CLS:
 * the reserved `minHeight` ensures the page does not jump when the real
 * component mounts.
 */

interface SkeletonSectionProps {
  /** CSS min-height for the reserved block (default "280px") */
  minHeight?: string;
  /** Extra Tailwind classes */
  className?: string;
}

/**
 * Full-width section-level placeholder.
 * Reserves space for a lazy-loaded page section so the page height
 * stays stable while the real component loads.
 */
export function SkeletonSection({ minHeight = '280px', className = '' }: SkeletonSectionProps) {
  return (
    <div
      className={`w-full animate-pulse rounded-xl bg-slate-900/60 border border-slate-800 ${className}`}
      style={{ minHeight }}
      aria-hidden="true"
    />
  );
}

interface SkeletonWidgetProps {
  /** CSS min-height for the body area (default "240px") */
  minHeight?: string;
  /** Extra Tailwind classes */
  className?: string;
}

/**
 * Card-style widget placeholder with a fake title row and body.
 * Use for medium-height widgets (charts, leaderboards, news feeds).
 */
export function SkeletonWidget({ minHeight = '240px', className = '' }: SkeletonWidgetProps) {
  return (
    <div
      className={`w-full rounded-xl border border-slate-800 bg-slate-900/60 p-5 animate-pulse ${className}`}
      aria-hidden="true"
    >
      {/* Fake title */}
      <div className="mb-4 h-5 w-1/3 rounded bg-slate-700" />
      {/* Fake body */}
      <div className="rounded-lg bg-slate-800/60" style={{ minHeight }} />
    </div>
  );
}

interface SkeletonStatGridProps {
  /** Number of stat card placeholders (default 4) */
  count?: number;
}

/**
 * Placeholder for a grid of flip-stat cards.
 * Matches the `grid-cols-2 md:grid-cols-4` layout used in Home.tsx.
 */
export function SkeletonStatGrid({ count = 4 }: SkeletonStatGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-28 rounded-xl border border-slate-800 bg-slate-900/60 animate-pulse"
        />
      ))}
    </div>
  );
}

/**
 * Inline badge placeholder (e.g. LiveOnlineBadge).
 * Keeps the footer row height stable while the badge loads.
 */
export function SkeletonBadge() {
  return (
    <span
      className="inline-block h-5 w-20 rounded-full bg-slate-700 animate-pulse align-middle"
      aria-hidden="true"
    />
  );
}
