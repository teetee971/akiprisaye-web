import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface InflationTrendProps {
  trend: 'up' | 'down' | 'stable';
  value?: number;
  size?: number;
}

export const InflationTrend: React.FC<InflationTrendProps> = ({ 
  trend, 
  value, 
  size = 20 
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp size={size} className="text-red-600" />;
      case 'down':
        return <TrendingDown size={size} className="text-green-600" />;
      case 'stable':
        return <Minus size={size} className="text-gray-600" />;
    }
  };

  const getTrendText = () => {
    switch (trend) {
      case 'up':
        return 'En hausse';
      case 'down':
        return 'En baisse';
      case 'stable':
        return 'Stable';
    }
  };

  return (
    <span 
      className="inline-flex items-center gap-1"
      aria-label={`Tendance: ${getTrendText()}${value ? ` (${value.toFixed(1)}%)` : ''}`}
    >
      {getTrendIcon()}
      {value !== undefined && (
        <span className="text-sm font-medium">
          {value > 0 ? '+' : ''}{value.toFixed(1)}%
        </span>
      )}
    </span>
  );
};
