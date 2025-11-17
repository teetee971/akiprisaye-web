import { useState } from 'react';

const territories = [
  { code: 'GP', name: 'Guadeloupe', flag: '🇬🇵' },
  { code: 'MQ', name: 'Martinique', flag: '🇲🇶' },
  { code: 'GF', name: 'Guyane', flag: '🇬🇫' },
  { code: 'RE', name: 'La Réunion', flag: '🇷🇪' },
  { code: 'YT', name: 'Mayotte', flag: '🇾🇹' },
  { code: 'PM', name: 'Saint-Pierre-et-Miquelon', flag: '🇵🇲' },
  { code: 'BL', name: 'Saint-Barthélemy', flag: '🇧🇱' },
  { code: 'MF', name: 'Saint-Martin', flag: '🇲🇫' },
  { code: 'WF', name: 'Wallis-et-Futuna', flag: '🇼🇫' },
  { code: 'PF', name: 'Polynésie française', flag: '🇵🇫' },
  { code: 'NC', name: 'Nouvelle-Calédonie', flag: '🇳🇨' },
  { code: 'TF', name: 'Terres australes et antarctiques françaises', flag: '🇹🇫' },
];

export default function TerritorySelector({ value, onChange, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedTerritory = territories.find(t => t.code === value) || territories[0];

  const handleSelect = (territory) => {
    onChange(territory.code);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[#1e1e1e] text-white border border-gray-700 px-4 py-3 rounded-lg flex items-center justify-between hover:bg-[#2a2a2a] transition-colors"
        aria-label="Sélectionner un territoire"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2">
          <span className="text-2xl">{selectedTerritory.flag}</span>
          <span>{selectedTerritory.name}</span>
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
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute z-20 w-full mt-2 bg-[#1e1e1e] border border-gray-700 rounded-lg shadow-xl max-h-80 overflow-y-auto">
            {territories.map((territory) => (
              <button
                key={territory.code}
                type="button"
                onClick={() => handleSelect(territory)}
                className={`w-full px-4 py-3 text-left hover:bg-[#2a2a2a] transition-colors flex items-center gap-3 ${
                  territory.code === value ? 'bg-[#2a2a2a]' : ''
                }`}
              >
                <span className="text-2xl">{territory.flag}</span>
                <span className="text-white">{territory.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
