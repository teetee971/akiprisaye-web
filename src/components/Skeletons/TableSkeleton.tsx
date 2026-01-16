/**
 * TableSkeleton Component
 * 
 * Skeleton loading state for data tables
 * Configurable rows and columns
 */

import { Shimmer } from '../Loading/Shimmer';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <div className="table-skeleton" role="status" aria-label="Chargement du tableau">
      {/* Header */}
      <div className="flex gap-4 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
        {Array.from({ length: columns }).map((_, i) => (
          <Shimmer key={i} className="h-6 flex-1 rounded" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 mb-3">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Shimmer 
              key={colIndex} 
              className={`h-10 flex-1 rounded ${colIndex === 0 ? 'w-2/5' : ''}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
