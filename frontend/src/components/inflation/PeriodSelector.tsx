import React from 'react';

interface PeriodSelectorProps {
  value: string;
  onChange: (period: string) => void;
  periods?: Array<{ value: string; label: string }>;
}

const defaultPeriods = [
  { value: '1m', label: '1 mois' },
  { value: '3m', label: '3 mois' },
  { value: '6m', label: '6 mois' },
  { value: '1y', label: '1 an' },
];

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({ 
  value, 
  onChange, 
  periods = defaultPeriods 
}) => {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="period-select" className="text-sm font-medium text-gray-700">
        Période :
      </label>
      <select
        id="period-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
        aria-label="Sélectionner une période"
      >
        {periods.map((period) => (
          <option key={period.value} value={period.value}>
            {period.label}
          </option>
        ))}
      </select>
    </div>
  );
};
