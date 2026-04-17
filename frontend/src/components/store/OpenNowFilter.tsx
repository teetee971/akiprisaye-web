/**
 * OpenNowFilter Component
 *
 * Toggle filter to show only stores that are currently open
 */

import { Store } from 'lucide-react';

interface OpenNowFilterProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  count?: number; // Optional count of open stores
  className?: string;
}

export function OpenNowFilter({ enabled, onChange, count, className = '' }: OpenNowFilterProps) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
        enabled
          ? 'bg-green-50 border-green-500 text-green-900 font-semibold'
          : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
      } ${className}`}
      role="switch"
      aria-checked={enabled}
      aria-label={`Filtrer les magasins ouverts maintenant${count !== undefined ? ` (${count} ouvert${count > 1 ? 's' : ''})` : ''}`}
    >
      {/* Icon */}
      <div className="relative">
        <Store
          className={`w-5 h-5 ${enabled ? 'text-green-600' : 'text-gray-500'}`}
          aria-hidden="true"
        />
        {enabled && (
          <span
            className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"
            aria-hidden="true"
          />
        )}
      </div>

      {/* Label */}
      <span className="text-sm">Ouverts maintenant</span>

      {/* Count Badge */}
      {count !== undefined && enabled && (
        <span
          className="ml-1 px-2 py-0.5 bg-green-600 text-white text-xs font-bold rounded-full"
          aria-label={`${count} magasin${count > 1 ? 's' : ''}`}
        >
          {count}
        </span>
      )}
    </button>
  );
}
