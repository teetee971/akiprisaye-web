import React from 'react';
import { MapPin } from 'lucide-react';
import { InflationBadge } from './InflationBadge';
import { InflationTrend } from './InflationTrend';

interface TerritoryInflationCardProps {
  territoryName: string;
  territoryCode: string;
  inflationRate: number;
  comparedToMetropole: number;
  trend: 'up' | 'down' | 'stable';
  lastUpdated: string;
  onClick?: () => void;
}

export const TerritoryInflationCard: React.FC<TerritoryInflationCardProps> = ({
  territoryName,
  territoryCode,
  inflationRate,
  comparedToMetropole,
  trend,
  lastUpdated,
  onClick,
}) => {
  const formattedDate = new Date(lastUpdated).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div
      className={`bg-white rounded-lg shadow-md border border-gray-200 p-6 transition-all hover:shadow-lg ${
        onClick ? 'cursor-pointer hover:border-blue-400' : ''
      }`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-gray-600" />
          <h3 className="font-semibold text-gray-900">{territoryName}</h3>
        </div>
        <InflationTrend trend={trend} size={18} />
      </div>

      <div className="space-y-3">
        <div>
          <div className="text-sm text-gray-500 mb-1">Taux d'inflation</div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-gray-900">
              {inflationRate.toFixed(1)}%
            </span>
            <InflationBadge rate={inflationRate} size="sm" />
          </div>
        </div>

        <div className="pt-3 border-t border-gray-200">
          <div className="text-sm text-gray-500 mb-1">vs Métropole</div>
          <div className="text-lg font-semibold text-orange-600">
            +{comparedToMetropole.toFixed(1)}%
          </div>
        </div>

        <div className="pt-2 text-xs text-gray-400">
          Mis à jour le {formattedDate}
        </div>
      </div>
    </div>
  );
};
