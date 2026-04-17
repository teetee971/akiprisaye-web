/**
 * StoreHoursDisplay Component
 *
 * Displays complete store opening hours with expandable view
 * Highlights current day and shows special hours
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp, Clock } from 'lucide-react';
import {
  StoreHours,
  formatDayHours,
  getTodayHours,
  getStoreLocalTime,
} from '../../utils/storeHoursUtils';

interface StoreHoursDisplayProps {
  hours: StoreHours | null | undefined;
  className?: string;
}

const DAYS_OF_WEEK = [
  { key: 'lundi', label: 'Lundi' },
  { key: 'mardi', label: 'Mardi' },
  { key: 'mercredi', label: 'Mercredi' },
  { key: 'jeudi', label: 'Jeudi' },
  { key: 'vendredi', label: 'Vendredi' },
  { key: 'samedi', label: 'Samedi' },
  { key: 'dimanche', label: 'Dimanche' },
];

export function StoreHoursDisplay({ hours, className = '' }: StoreHoursDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!hours || !hours.regularHours) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        <Clock className="inline w-4 h-4 mr-1" />
        Horaires non disponibles
      </div>
    );
  }

  // Get current day in store's timezone
  const storeTime = getStoreLocalTime(hours.timezone);
  const currentDayIndex = storeTime.getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Convert to our day keys (lundi = 1, dimanche = 0)
  const currentDayKey = currentDayIndex === 0 ? 'dimanche' : DAYS_OF_WEEK[currentDayIndex - 1].key;

  const todayHours = getTodayHours(hours);
  const todayFormatted = todayHours ? formatDayHours(todayHours) : 'Fermé';

  return (
    <div className={`${className}`}>
      {/* Today's Hours - Always Visible */}
      <div className="flex items-start gap-2 mb-2">
        <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1">
          <div className="text-sm font-semibold text-gray-900">Horaires aujourd'hui</div>
          <div className="text-base font-medium text-gray-700">{todayFormatted}</div>
        </div>
      </div>

      {/* Expand/Collapse Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors mt-2"
        aria-expanded={isExpanded}
        aria-controls="full-hours-display"
      >
        <span>{isExpanded ? 'Masquer' : 'Voir tous les horaires'}</span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" aria-hidden="true" />
        ) : (
          <ChevronDown className="w-4 h-4" aria-hidden="true" />
        )}
      </button>

      {/* Full Week Hours - Expandable */}
      {isExpanded && (
        <div
          id="full-hours-display"
          className="mt-3 space-y-2 border-t pt-3"
          role="region"
          aria-label="Horaires de la semaine"
        >
          {DAYS_OF_WEEK.map((day) => {
            const dayHours = hours.regularHours[day.key];
            const formatted = dayHours ? formatDayHours(dayHours) : 'Fermé';
            const isToday = day.key === currentDayKey;

            return (
              <div
                key={day.key}
                className={`flex justify-between text-sm py-1 px-2 rounded ${
                  isToday ? 'bg-blue-50 font-semibold' : ''
                }`}
                aria-current={isToday ? 'true' : undefined}
              >
                <span className={isToday ? 'text-blue-900' : 'text-gray-700'}>{day.label}</span>
                <span className={isToday ? 'text-blue-800' : 'text-gray-600'}>{formatted}</span>
              </div>
            );
          })}

          {/* Special Hours Notice */}
          {hours.specialHours && hours.specialHours.length > 0 && (
            <div className="mt-3 pt-3 border-t text-xs text-gray-500">
              <p className="font-semibold mb-1">Horaires spéciaux :</p>
              <ul className="space-y-1">
                {hours.specialHours.slice(0, 3).map((special) => (
                  <li key={special.date}>
                    {new Date(special.date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                    })}
                    {' - '}
                    {special.closed ? 'Fermé' : `${special.open} - ${special.close}`}
                    {special.reason && ` (${special.reason})`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
