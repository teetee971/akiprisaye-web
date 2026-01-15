import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface SortOption {
  value: string;
  label: string;
}

interface SortControlProps {
  options: SortOption[];
  currentSort: string;
  currentDirection: 'asc' | 'desc';
  onSortChange: (sort: string, direction: 'asc' | 'desc') => void;
}

const SortControl: React.FC<SortControlProps> = ({
  options,
  currentSort,
  currentDirection,
  onSortChange,
}) => {
  const handleSortClick = (value: string) => {
    if (currentSort === value) {
      // Toggle direction if clicking the same sort
      onSortChange(value, currentDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Default to ascending for new sort
      onSortChange(value, 'asc');
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-gray-400">Trier par:</span>
      {options.map((option) => {
        const isActive = currentSort === option.value;
        return (
          <button
            key={option.value}
            onClick={() => handleSortClick(option.value)}
            className={`
              flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors
              ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
              }
            `}
            aria-label={`Trier par ${option.label} ${isActive ? (currentDirection === 'asc' ? 'croissant' : 'décroissant') : ''}`}
          >
            {option.label}
            {isActive && (
              currentDirection === 'asc' ? (
                <ArrowUp className="w-3 h-3" aria-hidden="true" />
              ) : (
                <ArrowDown className="w-3 h-3" aria-hidden="true" />
              )
            )}
            {!isActive && <ArrowUpDown className="w-3 h-3 opacity-50" aria-hidden="true" />}
          </button>
        );
      })}
    </div>
  );
};

export default SortControl;
