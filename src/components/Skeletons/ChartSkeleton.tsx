/**
 * ChartSkeleton Component
 * 
 * Skeleton loading state for charts and graphs
 * Provides a visual representation of chart structure
 */

import { Shimmer } from '@/components/Loading/Shimmer';

export function ChartSkeleton() {
  return (
    <div className="chart-skeleton space-y-4 p-6" role="status" aria-label="Chargement du graphique">
      {/* Title */}
      <Shimmer className="h-6 w-1/3 rounded" />
      
      {/* Chart area */}
      <div className="relative h-64 flex items-end gap-4">
        {/* Bars with varying heights */}
        {[60, 80, 45, 90, 70, 55].map((height, i) => (
          <Shimmer
            key={i}
            className="flex-1 rounded-t"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex gap-4 justify-center">
        <Shimmer className="h-4 w-16 rounded" />
        <Shimmer className="h-4 w-16 rounded" />
        <Shimmer className="h-4 w-16 rounded" />
      </div>
    </div>
  );
}
