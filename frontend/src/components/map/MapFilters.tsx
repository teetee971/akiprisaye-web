import { useState } from 'react';
import { MapFilters as MapFiltersType } from '../../types/map';
import { getAllTerritoryCodes } from '../../utils/mapConfig';
import { PRICE_COLORS, PriceCategory } from '../../utils/priceColors';
import { MAP_CONFIG } from '../../utils/mapConfig';

interface MapFiltersProps {
  filters: MapFiltersType;
  availableChains: string[];
  availableServices: string[];
  onFiltersChange: (filters: MapFiltersType) => void;
}

export default function MapFilters({
  filters,
  availableChains,
  availableServices,
  onFiltersChange,
}: MapFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const territories = getAllTerritoryCodes();

  const handleTerritoryChange = (territory: string | null) => {
    onFiltersChange({ ...filters, territory });
  };

  const handleChainToggle = (chain: string) => {
    const newChains = filters.chains.includes(chain)
      ? filters.chains.filter((c) => c !== chain)
      : [...filters.chains, chain];
    onFiltersChange({ ...filters, chains: newChains });
  };

  const handlePriceCategoryToggle = (category: PriceCategory) => {
    const newCategories = filters.priceCategory.includes(category)
      ? filters.priceCategory.filter((c) => c !== category)
      : [...filters.priceCategory, category];
    onFiltersChange({ ...filters, priceCategory: newCategories });
  };

  const handleServiceToggle = (service: string) => {
    const newServices = filters.services.includes(service)
      ? filters.services.filter((s) => s !== service)
      : [...filters.services, service];
    onFiltersChange({ ...filters, services: newServices });
  };

  const handleRadiusChange = (radius: number) => {
    onFiltersChange({ ...filters, radius });
  };

  const handleOnlyOpenToggle = () => {
    onFiltersChange({ ...filters, onlyOpen: !filters.onlyOpen });
  };

  const handleReset = () => {
    onFiltersChange({
      territory: null,
      chains: [],
      priceCategory: [],
      services: [],
      radius: MAP_CONFIG.defaultRadius,
      onlyOpen: false,
    });
  };

  return (
    <div
      className="absolute top-4 left-4 bg-white shadow-lg rounded-lg z-[1000] max-w-xs"
      role="region"
      aria-label="Filtres de la carte"
    >
      {/* Header */}
      <div className="p-3 border-b border-slate-200 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">Filtres</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-slate-600 hover:text-slate-900 transition-colors"
          aria-expanded={isExpanded}
          aria-controls="filter-panel"
        >
          {isExpanded ? '−' : '+'}
        </button>
      </div>

      {/* Filter Panel */}
      {isExpanded && (
        <div id="filter-panel" className="p-3 max-h-[70vh] overflow-y-auto">
          {/* Territory Filter */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Territoire
            </label>
            <select
              value={filters.territory || ''}
              onChange={(e) =>
                handleTerritoryChange(e.target.value || null)
              }
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les territoires</option>
              {territories.map((code) => (
                <option key={code} value={code}>
                  {code.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Chain Filter */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Enseignes
            </label>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {availableChains.map((chain) => (
                <label
                  key={chain}
                  className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50 p-1 rounded"
                >
                  <input
                    type="checkbox"
                    checked={filters.chains.includes(chain)}
                    onChange={() => handleChainToggle(chain)}
                    className="rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-slate-700">{chain}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Category Filter */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Catégories de prix
            </label>
            <div className="space-y-1">
              {(Object.keys(PRICE_COLORS) as PriceCategory[]).map((category) => {
                const config = PRICE_COLORS[category];
                return (
                  <label
                    key={category}
                    className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50 p-1 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={filters.priceCategory.includes(category)}
                      onChange={() => handlePriceCategoryToggle(category)}
                      className="rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                    />
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: config.color }}
                      aria-hidden="true"
                    />
                    <span className="text-slate-700">{config.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Services Filter */}
          {availableServices.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Services
              </label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {availableServices.map((service) => (
                  <label
                    key={service}
                    className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50 p-1 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={filters.services.includes(service)}
                      onChange={() => handleServiceToggle(service)}
                      className="rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-slate-700">{service}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Radius Slider */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Rayon de recherche: {filters.radius} km
            </label>
            <input
              type="range"
              min="1"
              max="50"
              step="1"
              value={filters.radius}
              onChange={(e) => handleRadiusChange(Number(e.target.value))}
              className="w-full accent-blue-500"
              aria-label="Rayon de recherche en kilomètres"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>1 km</span>
              <span>50 km</span>
            </div>
          </div>

          {/* Only Open Toggle */}
          <div className="mb-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={filters.onlyOpen}
                onChange={handleOnlyOpenToggle}
                className="rounded border-slate-300 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-slate-700">Uniquement les magasins ouverts</span>
            </label>
          </div>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            className="w-full px-3 py-2 bg-slate-100 text-slate-700 text-sm rounded hover:bg-slate-200 transition-colors"
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}
    </div>
  );
}
