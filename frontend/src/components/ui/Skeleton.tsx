export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl border border-white/8 bg-white/[0.03] ${className}`}
    />
  );
}
