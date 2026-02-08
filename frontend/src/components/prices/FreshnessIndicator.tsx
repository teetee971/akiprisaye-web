/**
 * FreshnessIndicator Component
 * 
 * Time-based status indicator for price data freshness
 */

import React from 'react';

export type FreshnessStatus = 'FRESH' | 'RECENT' | 'STALE' | 'OUTDATED';

interface FreshnessIndicatorProps {
  createdAt: Date | string;
  status?: FreshnessStatus;
  showIcon?: boolean;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const FreshnessIndicator: React.FC<FreshnessIndicatorProps> = ({
  createdAt,
  status,
  showIcon = true,
  showLabel = true,
  size = 'md',
}) => {
  const date = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  const freshnessStatus = status || calculateFreshnessStatus(date);

  // Get status configuration
  const getStatusConfig = () => {
    switch (freshnessStatus) {
      case 'FRESH':
        return {
          color: 'text-green-700 bg-green-50 border-green-200',
          icon: '✓',
          label: 'Frais',
          description: 'Moins de 7 jours',
        };
      case 'RECENT':
        return {
          color: 'text-blue-700 bg-blue-50 border-blue-200',
          icon: '●',
          label: 'Récent',
          description: '7-14 jours',
        };
      case 'STALE':
        return {
          color: 'text-yellow-700 bg-yellow-50 border-yellow-200',
          icon: '◐',
          label: 'Ancien',
          description: '14-30 jours',
        };
      case 'OUTDATED':
        return {
          color: 'text-red-700 bg-red-50 border-red-200',
          icon: '!',
          label: 'Obsolète',
          description: 'Plus de 30 jours',
        };
    }
  };

  const config = getStatusConfig();

  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  // Format time ago
  const timeAgo = getTimeAgo(date);

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-md border ${config.color} ${sizeClasses[size]} font-medium`}
      role="status"
      aria-label={`Fraîcheur: ${config.label}`}
      title={`${config.description} - ${timeAgo}`}
    >
      {showIcon && <span className="font-bold">{config.icon}</span>}
      {showLabel && <span>{config.label}</span>}
      <span className="opacity-70 text-xs">({timeAgo})</span>
    </div>
  );
};

/**
 * Calculate freshness status based on age
 */
function calculateFreshnessStatus(date: Date): FreshnessStatus {
  const now = new Date();
  const ageInDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);

  if (ageInDays < 7) return 'FRESH';
  if (ageInDays < 14) return 'RECENT';
  if (ageInDays < 30) return 'STALE';
  return 'OUTDATED';
}

/**
 * Get human-readable time ago string
 */
function getTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}min`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}j`;
  
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}sem`;
  
  const months = Math.floor(days / 30);
  return `${months}mois`;
}

export default FreshnessIndicator;
