/**
 * TimeRangeSelector Component
 *
 * Allows users to select a time period for ILPP and Anti-Crisis analysis
 * - 30 days
 * - 90 days
 *
 * Design: Discreet, institutional, non-marketing
 * Purpose: Observe price stability evolution over time (descriptive only)
 */

import React from 'react';
import type { TimeRange } from '../utils/antiCrisisReading';

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
  className?: string;
}

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  '30d': '30 jours',
  '90d': '90 jours',
};

const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const ranges: TimeRange[] = ['30d', '90d'];

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <span className="text-sm text-gray-600 mr-2">Période observée :</span>
      <div className="inline-flex rounded-lg border border-gray-300 bg-white overflow-hidden">
        {ranges.map((range) => (
          <button
            key={range}
            onClick={() => onChange(range)}
            className={`
              px-4 py-2 text-sm font-medium transition-colors
              ${
                value === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }
              ${range !== ranges[ranges.length - 1] ? 'border-r border-gray-300' : ''}
            `}
            aria-pressed={value === range}
            aria-label={`Période de ${TIME_RANGE_LABELS[range]}`}
          >
            {TIME_RANGE_LABELS[range]}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TimeRangeSelector;
