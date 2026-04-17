/**
 * LevelProgressBar Component
 * XP progress bar showing progress to next level
 */

import React from 'react';
import { LEVELS } from '../../types/gamification';

interface LevelProgressBarProps {
  currentXP: number;
  level: number;
  showDetails?: boolean;
  className?: string;
}

export function LevelProgressBar({
  currentXP,
  level,
  showDetails = true,
  className = '',
}: LevelProgressBarProps) {
  const currentLevelData = LEVELS.find((l) => l.level === level) || LEVELS[0];
  const nextLevelIndex = LEVELS.findIndex((l) => l.level === level) + 1;
  const nextLevelData = nextLevelIndex < LEVELS.length ? LEVELS[nextLevelIndex] : null;

  const progressInLevel = currentXP - currentLevelData.minXP;
  const xpNeededForLevel = currentLevelData.maxXP - currentLevelData.minXP + 1;
  const percentage = Math.min((progressInLevel / xpNeededForLevel) * 100, 100);
  const xpToNext = nextLevelData ? nextLevelData.minXP - currentXP : 0;

  return (
    <div className={`space-y-2 ${className}`}>
      {showDetails && (
        <div className="flex justify-between items-center text-sm">
          <span className="font-semibold text-gray-700">{currentLevelData.name}</span>
          {nextLevelData && (
            <span className="text-gray-500">
              {xpToNext} XP jusqu'au niveau {nextLevelData.level}
            </span>
          )}
        </div>
      )}

      <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out relative"
          style={{
            width: `${percentage}%`,
            backgroundColor: currentLevelData.color,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white opacity-30"></div>
          <div className="absolute inset-0 animate-pulse bg-white opacity-20"></div>
        </div>
      </div>

      {showDetails && (
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>{progressInLevel.toLocaleString()} XP</span>
          <span className="font-medium">{percentage.toFixed(0)}%</span>
          <span>{xpNeededForLevel.toLocaleString()} XP</span>
        </div>
      )}
    </div>
  );
}
