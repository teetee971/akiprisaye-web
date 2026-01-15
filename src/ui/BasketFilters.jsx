import { getActiveTerritories } from '../constants/territories';
import { TIME_SLOTS, ALL_TIME_SLOTS } from '../config/periods';

export default function BasketFilters({ filters, onFilterChange }) {
  // Get active territories (excluding 'all' option for multi-select)
  const territories = getActiveTerritories()
    .filter(t => ['GP', 'MQ', 'GF'].includes(t.code))
    .map(t => ({ code: t.code, name: t.name, flag: t.flag }));

  // Handle territory selection toggle
  const handleTerritoryToggle = (territoryCode) => {
    const currentTerritories = filters.selectedTerritories || [];
    let newTerritories;

    if (currentTerritories.includes(territoryCode)) {
      // Deselect territory (keep at least one selected)
      newTerritories = currentTerritories.filter(t => t !== territoryCode);
      if (newTerritories.length === 0) {
        // If trying to deselect the last one, keep it selected
        return;
      }
    } else {
      // Select territory
      newTerritories = [...currentTerritories, territoryCode];
    }

    onFilterChange({ 
      ...filters, 
      selectedTerritories: newTerritories,
      // Remove legacy single territory filter
      territory: undefined 
    });
  };

  // Initialize selectedTerritories if not present (backward compatibility)
  const selectedTerritories = filters.selectedTerritories || 
    (filters.territory && filters.territory !== 'all' ? [filters.territory] : [territories[0]?.code]);

  // Select all territories
  const handleSelectAll = () => {
    onFilterChange({ 
      ...filters, 
      selectedTerritories: territories.map(t => t.code),
      territory: undefined 
    });
  };

  // Clear selection (keep first territory)
  const handleClearSelection = () => {
    onFilterChange({ 
      ...filters, 
      selectedTerritories: [territories[0]?.code],
      territory: undefined 
    });
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4 text-slate-100">
        🔍 Filtres
      </h2>

      <div className="space-y-4">
        {/* Multi-Territory Selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-slate-300">
              Territoires à comparer {selectedTerritories.length > 1 && (
                <span className="text-blue-400">({selectedTerritories.length} sélectionnés)</span>
              )}
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition"
              >
                Tout sélectionner
              </button>
              {selectedTerritories.length > 1 && (
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition"
                >
                  Réinitialiser
                </button>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {territories.map((territory) => {
              const isSelected = selectedTerritories.includes(territory.code);
              return (
                <label
                  key={territory.code}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                    ${isSelected
                      ? 'bg-blue-900/30 border-blue-500 hover:bg-blue-900/40'
                      : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-slate-600'
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleTerritoryToggle(territory.code)}
                    className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="flex items-center gap-2 flex-1">
                    <span className="text-xl">{territory.flag}</span>
                    <span className="text-sm font-medium text-slate-200">{territory.name}</span>
                  </span>
                </label>
              );
            })}
          </div>

          {selectedTerritories.length > 1 && (
            <div className="mt-2 p-2 bg-blue-900/20 border border-blue-700/30 rounded text-xs text-blue-300">
              💡 <strong>Mode comparaison actif</strong> - Le tableau comparatif s'affichera pour chaque panier
            </div>
          )}
        </div>

        {/* Other Filters */}
        <div className="grid md:grid-cols-3 gap-4 pt-4 border-t border-slate-700">
          {/* Store Filter */}
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-300">
              Enseigne
            </label>
            <input
              type="text"
              value={filters.store || ''}
              onChange={(e) => onFilterChange({ ...filters, store: e.target.value })}
              placeholder="Rechercher une enseigne..."
              className="w-full px-3 py-2 rounded-lg bg-slate-800 text-slate-100 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
            />
          </div>

          {/* Time Slot Filter */}
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-300">
              Créneau horaire
            </label>
            <select
              value={filters.timeSlot || ALL_TIME_SLOTS}
              onChange={(e) => onFilterChange({ ...filters, timeSlot: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 text-slate-100 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={ALL_TIME_SLOTS}>Tous les créneaux</option>
              {TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
          </div>

          {/* Stock Filter */}
          <div className="flex items-end">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.stockOnly || false}
                onChange={(e) => onFilterChange({ ...filters, stockOnly: e.target.checked })}
                className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-300">Uniquement en stock</span>
            </label>
          </div>
        </div>
      </div>

      {/* Reset Button */}
      <div className="mt-4 pt-4 border-t border-slate-700">
        <button
          onClick={() => onFilterChange({ 
            selectedTerritories: [territories[0]?.code], 
            territory: undefined,
            store: '', 
            timeSlot: ALL_TIME_SLOTS, 
            stockOnly: false 
          })}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition"
        >
          🔄 Réinitialiser tous les filtres
        </button>
      </div>
    </div>
  );
}
