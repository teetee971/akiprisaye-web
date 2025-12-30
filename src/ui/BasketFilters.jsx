import React from 'react';

export default function BasketFilters({ filters, onFilterChange }) {
  const territories = ['all', 'Guadeloupe', 'Martinique', 'Guyane'];
  const timeSlots = ['', '16h-18h', '17h-19h', '17h30-19h30', '18h-20h'];

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4 text-slate-100">
        🔍 Filtres
      </h2>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Territory Filter */}
        <div>
          <label className="block text-sm font-medium mb-2 text-slate-300">
            Territoire
          </label>
          <select
            value={filters.territory || 'all'}
            onChange={(e) => onFilterChange({ ...filters, territory: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 text-slate-100 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {territories.map((t) => (
              <option key={t} value={t}>
                {t === 'all' ? 'Tous les territoires' : t}
              </option>
            ))}
          </select>
        </div>

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
            value={filters.timeSlot || ''}
            onChange={(e) => onFilterChange({ ...filters, timeSlot: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 text-slate-100 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les créneaux</option>
            {timeSlots.filter(t => t).map((slot) => (
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

      {/* Reset Button */}
      <div className="mt-4">
        <button
          onClick={() => onFilterChange({ territory: 'all', store: '', timeSlot: '', stockOnly: false })}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition"
        >
          🔄 Réinitialiser les filtres
        </button>
      </div>
    </div>
  );
}
