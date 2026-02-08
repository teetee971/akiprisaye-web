import React from 'react';

interface InflationBadgeProps {
  rate: number;
  size?: 'sm' | 'md' | 'lg';
}

export const InflationBadge: React.FC<InflationBadgeProps> = ({ rate, size = 'md' }) => {
  const getColorClass = () => {
    if (rate < 2) return 'bg-green-100 text-green-800 border-green-200';
    if (rate < 5) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (rate < 8) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold border ${getColorClass()} ${
        sizeClasses[size]
      }`}
      role="status"
      aria-label={`Taux d'inflation: ${rate.toFixed(1)}%`}
    >
      {rate > 0 ? '+' : ''}{rate.toFixed(1)}%
    </span>
  );
};
