import React from 'react';
import { TerritoryInflationCard } from './TerritoryInflationCard';

interface TerritoryData {
  territory: string;
  territoryName: string;
  overallInflationRate: number;
  comparedToMetropole: number;
  lastUpdated: string;
}

interface TerritoryInflationGridProps {
  territories: TerritoryData[];
  onTerritoryClick?: (territoryCode: string) => void;
}

export const TerritoryInflationGrid: React.FC<TerritoryInflationGridProps> = ({
  territories,
  onTerritoryClick,
}) => {
  const getTrend = (rate: number): 'up' | 'down' | 'stable' => {
    if (rate > 3) return 'up';
    if (rate < 1) return 'down';
    return 'stable';
  };

  if (territories.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500">Aucune donnée d'inflation disponible</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {territories.map((territory) => (
        <TerritoryInflationCard
          key={territory.territory}
          territoryCode={territory.territory}
          territoryName={territory.territoryName}
          inflationRate={territory.overallInflationRate}
          comparedToMetropole={territory.comparedToMetropole}
          trend={getTrend(territory.overallInflationRate)}
          lastUpdated={territory.lastUpdated}
          onClick={onTerritoryClick ? () => onTerritoryClick(territory.territory) : undefined}
        />
      ))}
    </div>
  );
};
