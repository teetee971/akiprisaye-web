import { useState } from 'react';
import { getActiveTerritories } from '../constants/territories';

// Construire la liste des territoires avec "Tous" en premier
const ALL_TERRITORY_CODE = 'all';
const allTerritoriesOption = {
  code: ALL_TERRITORY_CODE,
  name: 'Tous les territoires',
  type: 'Tous',
  flag: '🌍',
};
const activeTerritories = getActiveTerritories().map((t) => ({
  code: t.code,
  name: t.name,
  type: t.type,
  flag: t.flag,
}));
const territories = [allTerritoriesOption, ...activeTerritories];

export default function TerritorySelector({ value, onChange, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedTerritory = territories.find((t) => t.code === value) || territories[0];

  const handleSelect = (territory) => {
    onChange(territory.code);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white/[0.08] backdrop-blur-[14px] text-white border border-white/[0.22] px-4 py-3 rounded-lg flex items-center justify-between hover:bg-white/[0.12] hover:border-blue-500/40 transition-all"
        aria-label="Sélectionner un territoire"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-3">
          <span className="text-lg">{selectedTerritory.flag}</span>
          <span className="px-2 py-0.5 text-xs font-mono bg-blue-600/20 border border-blue-500/40 rounded text-blue-300">
            {selectedTerritory.code}
          </span>
          <span>{selectedTerritory.name}</span>
          <span className="text-xs text-gray-400">({selectedTerritory.type})</span>
        </span>
        <svg
          className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} aria-hidden="true" />
          <div className="absolute z-20 w-full mt-2 bg-slate-900/95 backdrop-blur-[14px] border border-white/[0.22] rounded-lg shadow-xl max-h-80 overflow-y-auto">
            {territories.map((territory) => (
              <button
                key={territory.code}
                type="button"
                onClick={() => handleSelect(territory)}
                className={`w-full px-4 py-3 text-left hover:bg-white/[0.08] transition-colors flex items-center gap-3 ${
                  territory.code === value ? 'bg-white/[0.12] border-l-2 border-blue-500' : ''
                }`}
              >
                <span className="text-lg flex-shrink-0">{territory.flag}</span>
                <span className="px-2 py-0.5 text-xs font-mono bg-blue-600/20 border border-blue-500/40 rounded text-blue-300 flex-shrink-0">
                  {territory.code}
                </span>
                <span className="text-white flex-1">{territory.name}</span>
                <span className="text-xs text-gray-400">({territory.type})</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
