/**
 * LevelBadge Component
 * Displays user's level badge with icon and level number
 */

import React from 'react';
import { LEVELS } from '../../types/gamification';

interface LevelBadgeProps {
  level: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-10 h-10 text-xs',
  md: 'w-14 h-14 text-sm',
  lg: 'w-20 h-20 text-lg',
  xl: 'w-28 h-28 text-2xl',
};

const iconSizes = {
  sm: 'text-base',
  md: 'text-xl',
  lg: 'text-3xl',
  xl: 'text-5xl',
};

export function LevelBadge({
  level,
  size = 'md',
  showName = false,
  className = '',
}: LevelBadgeProps) {
  const levelData = LEVELS.find((l) => l.level === level) || LEVELS[0];

  return (
    <div className={`inline-flex flex-col items-center gap-2 ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold shadow-lg border-4 border-white relative`}
        style={{
          backgroundColor: levelData.color,
          color: 'white',
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={iconSizes[size]} role="img" aria-label={levelData.name}>
            {levelData.icon}
          </span>
        </div>
        <div
          className="absolute -bottom-1 -right-1 bg-white text-gray-900 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-md border-2"
          style={{ borderColor: levelData.color }}
        >
          {level}
        </div>
      </div>

      {showName && (
        <div className="text-center">
          <div className="font-semibold text-sm" style={{ color: levelData.color }}>
            {levelData.name}
          </div>
          <div className="text-xs text-gray-500">Niveau {level}</div>
        </div>
      )}
    </div>
  );
}
