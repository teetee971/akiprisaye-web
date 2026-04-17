/**
 * Freshness Indicator Component
 * Shows how recent the price data is
 */

import React from 'react';

export interface FreshnessIndicatorProps {
  observedAt: string;
  status?: 'fresh' | 'recent' | 'stale' | 'outdated';
  showLabel?: boolean;
}

const calculateDaysSince = (dateString: string): number => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

const getFreshnessStatus = (daysSince: number): 'fresh' | 'recent' | 'stale' | 'outdated' => {
  if (daysSince <= 7) return 'fresh';
  if (daysSince <= 30) return 'recent';
  if (daysSince <= 60) return 'stale';
  return 'outdated';
};

const getStatusConfig = (status: 'fresh' | 'recent' | 'stale' | 'outdated') => {
  const configs = {
    fresh: {
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      label: 'Très récent',
      icon: '🟢',
    },
    recent: {
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      label: 'Récent',
      icon: '🔵',
    },
    stale: {
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      label: 'Ancien',
      icon: '🟠',
    },
    outdated: {
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      label: 'Périmé',
      icon: '🔴',
    },
  };
  return configs[status];
};

const FreshnessIndicator: React.FC<FreshnessIndicatorProps> = ({
  observedAt,
  status: propStatus,
  showLabel = true,
}) => {
  const daysSince = calculateDaysSince(observedAt);
  const status = propStatus || getFreshnessStatus(daysSince);
  const config = getStatusConfig(status);

  const observedDate = new Date(observedAt);
  const formattedDate = observedDate.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const getTimeAgoText = (days: number): string => {
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return 'Hier';
    if (days < 7) return `Il y a ${days} jours`;
    if (days < 30) {
      const weeks = Math.floor(days / 7);
      return `Il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`;
    }
    if (days < 365) {
      const months = Math.floor(days / 30);
      return `Il y a ${months} mois`;
    }
    const years = Math.floor(days / 365);
    return `Il y a ${years} an${years > 1 ? 's' : ''}`;
  };

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${config.bgColor} ${config.borderColor}`}
      title={`Observé le ${formattedDate}`}
    >
      <span className="text-lg" aria-hidden="true">
        {config.icon}
      </span>
      <div className="flex flex-col">
        {showLabel && <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>}
        <span className={`text-sm ${config.color}`}>{getTimeAgoText(daysSince)}</span>
      </div>
    </div>
  );
};

export default FreshnessIndicator;
