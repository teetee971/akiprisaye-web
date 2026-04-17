/**
 * UserRankBadge Component
 * Display rank badges (#1, #2, #3)
 */

import React from 'react';
import { Crown, Medal, Award } from 'lucide-react';

interface UserRankBadgeProps {
  rank: number;
  size?: 'sm' | 'md' | 'lg';
  showRank?: boolean;
  className?: string;
}

const rankConfig = {
  1: {
    icon: Crown,
    color: 'text-yellow-500',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    label: '1er',
  },
  2: {
    icon: Medal,
    color: 'text-gray-400',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    label: '2ème',
  },
  3: {
    icon: Award,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    label: '3ème',
  },
};

const sizeClasses = {
  sm: { icon: 16, container: 'w-8 h-8 text-xs' },
  md: { icon: 20, container: 'w-10 h-10 text-sm' },
  lg: { icon: 28, container: 'w-14 h-14 text-base' },
};

export function UserRankBadge({
  rank,
  size = 'md',
  showRank = false,
  className = '',
}: UserRankBadgeProps) {
  const config = rankConfig[rank as keyof typeof rankConfig];
  const sizeConfig = sizeClasses[size];

  if (!config) {
    return showRank ? (
      <div
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-sm ${className}`}
      >
        <span className="font-semibold">#{rank}</span>
      </div>
    ) : null;
  }

  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div
        className={`${sizeConfig.container} ${config.bg} ${config.border} border-2 rounded-full flex items-center justify-center shadow-sm`}
      >
        <Icon size={sizeConfig.icon} className={config.color} />
      </div>

      {showRank && <span className={`font-bold ${config.color}`}>{config.label}</span>}
    </div>
  );
}
