/**
 * Store Selector Component
 * 
 * Allows filtering stores by territory, distance, and other criteria
 */

import React from 'react';
import { MapPin, Filter } from 'lucide-react';

export interface StoreFilterOptions {
  territories: string[];
  maxDistance?: number;
  includePromos: boolean;
}

interface StoreSelectorProps {
  availableTerritories: string[];
  filters: StoreFilterOptions;
  onFiltersChange: (filters: StoreFilterOptions) => void;
  hasUserLocation: boolean;
  className?: string;
}

export function StoreSelector({
  availableTerritories,
  filters,
  onFiltersChange,
  hasUserLocation,
  className = ''
}: StoreSelectorProps) {
  const handleTerritoryToggle = (territory: string) => {
    const newTerritories = filters.territories.includes(territory)
      ? filters.territories.filter(t => t !== territory)
      : [...filters.territories, territory];
    
    onFiltersChange({ ...filters, territories: newTerritories });
  };

  const handleSelectAllTerritories = () => {
    onFiltersChange({ ...filters, territories: availableTerritories });
  };

  const handleDeselectAllTerritories = () => {
    onFiltersChange({ ...filters, territories: [] });
  };

  const handleDistanceChange = (distance: number | undefined) => {
    onFiltersChange({ ...filters, maxDistance: distance });
  };

  const handlePromosToggle = () => {
    onFiltersChange({ ...filters, includePromos: !filters.includePromos });
  };

  return (
    <div className={`bg-slate-800/50 border border-slate-700 rounded-lg p-5 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Filter className="text-blue-400" size={20} />
        <h3 className="text-sm font-semibold text-gray-300 uppercase">Filtres</h3>
      </div>

      {/* Territory Filter */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Territoires
        </label>
        
        <div className="flex gap-2 mb-2">
          <button
            onClick={handleSelectAllTerritories}
            className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 text-gray-300 rounded transition-colors"
          >
            Tous
          </button>
          <button
            onClick={handleDeselectAllTerritories}
            className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 text-gray-300 rounded transition-colors"
          >
            Aucun
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {availableTerritories.map(territory => {
            const isSelected = filters.territories.includes(territory);
            
            return (
              <button
                key={territory}
                onClick={() => handleTerritoryToggle(territory)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  isSelected
                    ? 'bg-blue-900/40 border-blue-600 text-blue-300'
                    : 'bg-slate-900/50 border-slate-700 text-gray-400 hover:border-slate-600'
                }`}
              >
                {isSelected && '✓ '}
                {territory}
              </button>
            );
          })}
        </div>
      </div>

      {/* Distance Filter */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          <MapPin className="inline mr-1" size={14} />
          Distance maximale
        </label>
        
        {!hasUserLocation && (
          <div className="mb-2 text-xs text-amber-300 bg-amber-900/20 border border-amber-700/50 rounded p-2">
            ℹ️ Activez la géolocalisation pour filtrer par distance
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleDistanceChange(undefined)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              filters.maxDistance === undefined
                ? 'bg-blue-900/40 border-blue-600 text-blue-300'
                : 'bg-slate-900/50 border-slate-700 text-gray-400 hover:border-slate-600'
            }`}
            disabled={!hasUserLocation}
          >
            Tous
          </button>
          
          {[1, 5, 10, 20, 50].map(distance => (
            <button
              key={distance}
              onClick={() => handleDistanceChange(distance)}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                filters.maxDistance === distance
                  ? 'bg-blue-900/40 border-blue-600 text-blue-300'
                  : 'bg-slate-900/50 border-slate-700 text-gray-400 hover:border-slate-600'
              }`}
              disabled={!hasUserLocation}
            >
              {distance} km
            </button>
          ))}
        </div>
      </div>

      {/* Promotions Filter */}
      <div>
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              checked={filters.includePromos}
              onChange={handlePromosToggle}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-700 rounded-full peer-checked:bg-blue-600 transition-colors"></div>
            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
          </div>
          
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
              Inclure les promotions
            </div>
            <div className="text-xs text-gray-500">
              Afficher les prix en promotion si disponibles
            </div>
          </div>
        </label>
      </div>
    </div>
  );
}
