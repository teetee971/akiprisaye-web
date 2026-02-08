import React from 'react';
import { Globe } from 'lucide-react';
import { InflationBadge } from './InflationBadge';
import { InflationTrend } from './InflationTrend';

interface Territory {
  code: string;
  name: string;
}

interface InflationOverviewCardProps {
  globalRate: number;
  trend: 'up' | 'down' | 'stable';
  selectedTerritory: string;
  territories: Territory[];
  onTerritoryChange: (code: string) => void;
}

export const InflationOverviewCard: React.FC<InflationOverviewCardProps> = ({
  globalRate,
  trend,
  selectedTerritory,
  territories,
  onTerritoryChange,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Globe className="text-blue-600" size={24} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Indice d'inflation global
            </h2>
            <p className="text-sm text-gray-500">
              Vue d'ensemble des territoires
            </p>
          </div>
        </div>
        <InflationTrend trend={trend} />
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="text-4xl font-bold text-gray-900">
          {globalRate.toFixed(1)}%
        </div>
        <InflationBadge rate={globalRate} size="lg" />
      </div>

      <div className="mt-6">
        <label htmlFor="territory-select" className="block text-sm font-medium text-gray-700 mb-2">
          Territoire :
        </label>
        <select
          id="territory-select"
          value={selectedTerritory}
          onChange={(e) => onTerritoryChange(e.target.value)}
          className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          aria-label="Sélectionner un territoire"
        >
          <option value="all">Tous les territoires</option>
          {territories.map((territory) => (
            <option key={territory.code} value={territory.code}>
              {territory.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
