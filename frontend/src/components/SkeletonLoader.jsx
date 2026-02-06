export function SkeletonCard() {
  return (
    <div className="bg-slate-900 dark:bg-slate-800 p-6 rounded-xl border border-slate-700 dark:border-slate-600 animate-pulse">
      <div className="h-12 w-12 bg-slate-700 dark:bg-slate-600 rounded-lg mb-4"></div>
      <div className="h-6 bg-slate-700 dark:bg-slate-600 rounded mb-2 w-3/4"></div>
      <div className="h-4 bg-slate-700 dark:bg-slate-600 rounded w-full"></div>
      <div className="h-4 bg-slate-700 dark:bg-slate-600 rounded w-5/6 mt-2"></div>
    </div>
  );
}

export function SkeletonText({ lines = 3 }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="h-4 bg-slate-700 dark:bg-slate-600 rounded"
          style={{ width: index === lines - 1 ? '60%' : '100%' }}
        ></div>
      ))}
    </div>
  );
}

export function SkeletonImage({ className = '' }) {
  return (
    <div className={`bg-slate-700 dark:bg-slate-600 animate-pulse rounded ${className}`}></div>
  );
}

export function SkeletonButton() {
  return (
    <div className="h-10 w-32 bg-slate-700 dark:bg-slate-600 animate-pulse rounded-lg"></div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }) {
  return (
    <div className="animate-pulse">
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {/* Header */}
        {Array.from({ length: columns }).map((_, i) => (
          <div key={`header-${i}`} className="h-8 bg-slate-700 dark:bg-slate-600 rounded"></div>
        ))}
        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) =>
          Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={`row-${rowIndex}-col-${colIndex}`}
              className="h-6 bg-slate-800 dark:bg-slate-700 rounded"
            ></div>
          )),
        )}
      </div>
    </div>
  );
}
