import React from 'react';

interface LoadingSkeletonProps {
  type?: 'stats' | 'card' | 'chart';
  count?: number;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ type = 'card', count = 1 }) => {
  if (type === 'stats') {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-slate-800/50 rounded-lg p-4">
            <div className="h-4 bg-slate-700 rounded w-2/3 mb-2"></div>
            <div className="h-8 bg-slate-700 rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'chart') {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-slate-700 rounded w-1/3 mb-4"></div>
        <div className="h-64 bg-slate-800/50 rounded"></div>
      </div>
    );
  }

  // Default: card skeleton
  return (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="border border-slate-700 rounded-lg p-4 animate-pulse">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="h-6 bg-slate-700 rounded w-1/3 mb-3"></div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="h-4 bg-slate-700 rounded w-full"></div>
                <div className="h-4 bg-slate-700 rounded w-full"></div>
                <div className="h-4 bg-slate-700 rounded w-2/3"></div>
                <div className="h-4 bg-slate-700 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LoadingSkeleton;
