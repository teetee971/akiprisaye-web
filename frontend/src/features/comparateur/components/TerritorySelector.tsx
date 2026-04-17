/**
 * TerritorySelector Component
 * Multi-select component for choosing territories to compare
 */

import type { Territory } from '../../../types/comparatorCommon';
import { getTerritoryLabel } from '../../../utils/territoryMapper';

interface TerritorySelectorProps {
  territories: Territory[];
  selected: Territory[];
  onSelectionChange: (selected: Territory[]) => void;
}

/**
 * Mock function to get territory coverage info
 */
function getTerritoryCoverage(territory: Territory): string {
  const coverage: Record<Territory, string> = {
    GP: '45 magasins',
    MQ: '38 magasins',
    GF: '22 magasins',
    RE: '52 magasins',
    YT: '15 magasins',
    MF: '8 magasins',
    BL: '6 magasins',
    PM: '4 magasins',
    WF: '3 magasins',
    PF: '18 magasins',
    NC: '25 magasins',
  };
  return coverage[territory] || 'N/A';
}

export function TerritorySelector({
  territories,
  selected,
  onSelectionChange,
}: TerritorySelectorProps) {
  const toggleTerritory = (territory: Territory) => {
    if (selected.includes(territory)) {
      onSelectionChange(selected.filter((t) => t !== territory));
    } else {
      onSelectionChange([...selected, territory]);
    }
  };

  const selectAll = () => onSelectionChange(territories);
  const clearAll = () => onSelectionChange([]);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-white">
          Sélectionnez les territoires à comparer
        </h4>
        <div className="flex gap-2">
          <button
            onClick={selectAll}
            className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Tout sélectionner
          </button>
          <button
            onClick={clearAll}
            className="px-3 py-1 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Tout désélectionner
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {territories.map((territory) => {
          const isSelected = selected.includes(territory);
          return (
            <label
              key={territory}
              aria-label={getTerritoryLabel(territory)}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleTerritory(territory)}
                className="w-5 h-5 text-blue-600 bg-slate-800 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${isSelected ? 'text-blue-400' : 'text-white'}`}>
                    {getTerritoryLabel(territory)}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-slate-800 rounded-full text-slate-400">
                    {territory}
                  </span>
                </div>
                <span className="text-xs text-slate-400">{getTerritoryCoverage(territory)}</span>
              </div>
            </label>
          );
        })}
      </div>

      {selected.length > 0 && (
        <p className="text-sm text-slate-400 text-center">
          {selected.length} territoire{selected.length > 1 ? 's' : ''} sélectionné
          {selected.length > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
