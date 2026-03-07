 
// src/components/TerritoryAdvancedFilter.tsx
// Advanced territorial filters - client-side filtering only
import React, { useState } from 'react'
import { GlassCard } from './ui/glass-card'

export type Territory = 'GP' | 'MQ' | 'GF' | 'RE' | 'YT' | 'COM' | 'all'
export type ZoneType = 'urban' | 'peri_urban' | 'rural' | 'all'
export type DataCategory = 'food' | 'hygiene' | 'energy' | 'transport' | 'all'

export type TerritoryFilters = {
  territory: Territory
  zone: ZoneType
  category: DataCategory
}

type TerritoryAdvancedFilterProps = {
  filters: TerritoryFilters
  onChange: (filters: TerritoryFilters) => void
  className?: string
}

/**
 * Get French label for territory
 */
function getTerritoryLabel(territory: Territory): string {
  switch (territory) {
    case 'GP':
      return 'Guadeloupe'
    case 'MQ':
      return 'Martinique'
    case 'GF':
      return 'Guyane'
    case 'RE':
      return 'La Réunion'
    case 'YT':
      return 'Mayotte'
    case 'COM':
      return 'Autres COM'
    case 'all':
      return 'Tous les territoires'
  }
}

/**
 * Get French label for zone type
 */
function getZoneTypeLabel(zone: ZoneType): string {
  switch (zone) {
    case 'urban':
      return 'Urbaine'
    case 'peri_urban':
      return 'Péri-urbaine'
    case 'rural':
      return 'Rurale'
    case 'all':
      return 'Toutes les zones'
  }
}

/**
 * Get French label for data category
 */
function getDataCategoryLabel(category: DataCategory): string {
  switch (category) {
    case 'food':
      return 'Produits alimentaires'
    case 'hygiene':
      return 'Hygiène'
    case 'energy':
      return 'Énergie'
    case 'transport':
      return 'Transport'
    case 'all':
      return 'Toutes catégories'
  }
}

export default function TerritoryAdvancedFilter({
  filters,
  onChange,
  className = '',
}: TerritoryAdvancedFilterProps) {
  // Check feature flag
  const isEnabled = import.meta.env.VITE_FEATURE_TERRITORY_FILTERS === 'true'

  if (!isEnabled) {
    return null
  }

  const hasActiveFilters =
    filters.territory !== 'all' || filters.zone !== 'all' || filters.category !== 'all'

  const handleReset = () => {
    onChange({
      territory: 'all',
      zone: 'all',
      category: 'all',
    })
  }

  const territories: Territory[] = ['all', 'GP', 'MQ', 'GF', 'RE', 'YT', 'COM']
  const zoneTypes: ZoneType[] = ['all', 'urban', 'peri_urban', 'rural']
  const dataCategories: DataCategory[] = ['all', 'food', 'hygiene', 'energy', 'transport']

  return (
    <GlassCard title="Filtres territoriaux" className={className}>
      <div className="space-y-4">
        {/* Territory Filter */}
        <div>
          <label htmlFor="territory-filter" className="block text-sm font-medium text-white mb-2">
            Territoire
          </label>
          <select
            id="territory-filter"
            value={filters.territory}
            onChange={(e) =>
              onChange({ ...filters, territory: e.target.value as Territory })
            }
            className="w-full px-4 py-3 bg-white/[0.1] border border-white/[0.22] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {territories.map((territory) => (
              <option key={territory} value={territory} className="bg-gray-800">
                {getTerritoryLabel(territory)}
              </option>
            ))}
          </select>
        </div>

        {/* Zone Type Filter */}
        <div>
          <label htmlFor="zone-filter" className="block text-sm font-medium text-white mb-2">
            Type de zone
          </label>
          <select
            id="zone-filter"
            value={filters.zone}
            onChange={(e) =>
              onChange({ ...filters, zone: e.target.value as ZoneType })
            }
            className="w-full px-4 py-3 bg-white/[0.1] border border-white/[0.22] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {zoneTypes.map((zone) => (
              <option key={zone} value={zone} className="bg-gray-800">
                {getZoneTypeLabel(zone)}
              </option>
            ))}
          </select>
        </div>

        {/* Data Category Filter */}
        <div>
          <label htmlFor="category-filter" className="block text-sm font-medium text-white mb-2">
            Type de données
          </label>
          <select
            id="category-filter"
            value={filters.category}
            onChange={(e) =>
              onChange({ ...filters, category: e.target.value as DataCategory })
            }
            className="w-full px-4 py-3 bg-white/[0.1] border border-white/[0.22] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {dataCategories.map((category) => (
              <option key={category} value={category} className="bg-gray-800">
                {getDataCategoryLabel(category)}
              </option>
            ))}
          </select>
        </div>

        {/* Active Filters Indicator & Reset */}
        {hasActiveFilters && (
          <div className="pt-4 border-t border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-white/70">Filtres actifs :</span>
              <span className="text-sm font-medium text-blue-400">
                {[
                  filters.territory !== 'all' && getTerritoryLabel(filters.territory),
                  filters.zone !== 'all' && getZoneTypeLabel(filters.zone),
                  filters.category !== 'all' && getDataCategoryLabel(filters.category),
                ]
                  .filter(Boolean)
                  .length}
              </span>
            </div>

            <button
              onClick={handleReset}
              className="w-full px-4 py-2 text-sm font-medium text-white/70 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] rounded-lg transition-colors"
              aria-label="Réinitialiser les filtres"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}
      </div>
    </GlassCard>
  )
}
