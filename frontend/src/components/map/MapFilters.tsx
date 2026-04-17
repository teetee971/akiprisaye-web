/**
 * MapFilters Component
 * Provides filtering controls for the interactive map
 */

import React, { useState } from 'react';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { OpenNowFilter } from '../store/OpenNowFilter';

interface MapFiltersProps {
  territory: string;
  onTerritoryChange: (territory: string) => void;
  chains: string[];
  onChainsChange: (chains: string[]) => void;
  priceCategory?: 'all' | 'cheap' | 'medium' | 'expensive';
  onPriceCategoryChange?: (category: 'all' | 'cheap' | 'medium' | 'expensive') => void;
  services?: string[];
  onServicesChange?: (services: string[]) => void;
  radius?: number;
  onRadiusChange?: (radius: number) => void;
  openOnly?: boolean;
  onOpenOnlyChange?: (openOnly: boolean) => void;
  availableChains?: string[];
  availableServices?: string[];
}

const TERRITORIES = [
  { code: 'GP', name: 'Guadeloupe' },
  { code: 'MQ', name: 'Martinique' },
  { code: 'GF', name: 'Guyane' },
  { code: 'RE', name: 'La Réunion' },
  { code: 'YT', name: 'Mayotte' },
  { code: 'NC', name: 'Nouvelle-Calédonie' },
  { code: 'PF', name: 'Polynésie française' },
  { code: 'WF', name: 'Wallis-et-Futuna' },
  { code: 'PM', name: 'Saint-Pierre-et-Miquelon' },
  { code: 'SM', name: 'Saint-Martin' },
  { code: 'BL', name: 'Saint-Barthélemy' },
];

const DEFAULT_CHAINS = [
  'Carrefour',
  'E.Leclerc',
  'Système U',
  'Intermarché',
  'Casino',
  'Leader Price',
  'Auchan',
];

const DEFAULT_SERVICES = ['parking', 'carte_bancaire', 'livraison', 'retrait_course', 'essence'];

/**
 * MapFilters component for filtering stores on the map
 */
export function MapFilters({
  territory,
  onTerritoryChange,
  chains,
  onChainsChange,
  priceCategory = 'all',
  onPriceCategoryChange,
  services = [],
  onServicesChange,
  radius = 10,
  onRadiusChange,
  openOnly = false,
  onOpenOnlyChange,
  availableChains = DEFAULT_CHAINS,
  availableServices = DEFAULT_SERVICES,
}: MapFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleChainToggle = (chain: string) => {
    if (chains.includes(chain)) {
      onChainsChange(chains.filter((c) => c !== chain));
    } else {
      onChainsChange([...chains, chain]);
    }
  };

  const handleServiceToggle = (service: string) => {
    if (!onServicesChange) return;

    if (services.includes(service)) {
      onServicesChange(services.filter((s) => s !== service));
    } else {
      onServicesChange([...services, service]);
    }
  };

  const handleClearFilters = () => {
    onChainsChange([]);
    onServicesChange?.([]);
    onPriceCategoryChange?.('all');
    onOpenOnlyChange?.(false);
    onRadiusChange?.(10);
  };

  const hasActiveFilters =
    chains.length > 0 ||
    services.length > 0 ||
    priceCategory !== 'all' ||
    openOnly ||
    radius !== 10;

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-lg">Filtres</h3>
          {hasActiveFilters && (
            <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">Actifs</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
              aria-label="Effacer tous les filtres"
            >
              <X className="w-4 h-4" />
              Effacer
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-100 rounded"
            aria-label={isExpanded ? 'Réduire les filtres' : 'Développer les filtres'}
            aria-expanded={isExpanded}
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Territory Selector - Always visible */}
      <div className="mb-3">
        <label htmlFor="territory" className="block text-sm font-medium text-gray-700 mb-1">
          Territoire
        </label>
        <select
          id="territory"
          value={territory}
          onChange={(e) => onTerritoryChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {TERRITORIES.map((t) => (
            <option key={t.code} value={t.code}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* Open Now Toggle - Always visible */}
      {onOpenOnlyChange && (
        <div className="mb-3">
          <OpenNowFilter enabled={openOnly} onChange={onOpenOnlyChange} />
        </div>
      )}

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="space-y-4 pt-3 border-t">
          {/* Price Category */}
          {onPriceCategoryChange && (
            <div>
              <p className="block text-sm font-medium text-gray-700 mb-2">Catégorie de prix</p>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => onPriceCategoryChange('all')}
                  className={`px-3 py-2 text-sm rounded ${
                    priceCategory === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Tous
                </button>
                <button
                  onClick={() => onPriceCategoryChange('cheap')}
                  className={`px-3 py-2 text-sm rounded ${
                    priceCategory === 'cheap'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🟢 Pas cher
                </button>
                <button
                  onClick={() => onPriceCategoryChange('medium')}
                  className={`px-3 py-2 text-sm rounded ${
                    priceCategory === 'medium'
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🟡 Moyen
                </button>
                <button
                  onClick={() => onPriceCategoryChange('expensive')}
                  className={`px-3 py-2 text-sm rounded ${
                    priceCategory === 'expensive'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🔴 Cher
                </button>
              </div>
            </div>
          )}

          {/* Chains Filter */}
          <div>
            <p className="block text-sm font-medium text-gray-700 mb-2">
              Enseignes ({chains.length} sélectionnées)
            </p>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {availableChains.map((chain) => (
                <label
                  key={chain}
                  aria-label={chain}
                  className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={chains.includes(chain)}
                    onChange={() => handleChainToggle(chain)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">{chain}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Services Filter */}
          {onServicesChange && availableServices.length > 0 && (
            <div>
              <p className="block text-sm font-medium text-gray-700 mb-2">
                Services ({services.length} sélectionnés)
              </p>
              <div className="grid grid-cols-2 gap-2">
                {availableServices.map((service) => (
                  <label
                    key={service}
                    aria-label={service}
                    className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={services.includes(service)}
                      onChange={() => handleServiceToggle(service)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm capitalize">{service.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Radius Slider */}
          {onRadiusChange && (
            <div>
              <label htmlFor="radius" className="block text-sm font-medium text-gray-700 mb-2">
                Rayon de recherche: {radius} km
              </label>
              <input
                type="range"
                id="radius"
                min="1"
                max="50"
                value={radius}
                onChange={(e) => onRadiusChange(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1 km</span>
                <span>50 km</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MapFilters;
