/**
 * StreakCounter Component
 * Display current streak with flame animation
 */

import React from 'react';
import { StreakFlame } from './StreakFlame';
import { Trophy } from 'lucide-react';

interface StreakCounterProps {
  currentStreak: number;
  longestStreak?: number;
  todayCompleted?: boolean;
  showLongest?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeConfig = {
  sm: { flame: 20, text: 'text-sm', subtext: 'text-xs' },
  md: { flame: 28, text: 'text-xl', subtext: 'text-sm' },
  lg: { flame: 36, text: 'text-3xl', subtext: 'text-base' },
};

export function StreakCounter({
  currentStreak,
  longestStreak,
  todayCompleted = false,
  showLongest = false,
  size = 'md',
  className = '',
}: StreakCounterProps) {
  const config = sizeConfig[size];
  const isActive = currentStreak > 0;

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div className="flex flex-col items-center">
        <StreakFlame isActive={isActive} size={config.flame} />
        {todayCompleted && (
          <div className="text-xs text-green-600 font-medium mt-1">Aujourd'hui ✓</div>
        )}
      </div>

      <div className="flex flex-col">
        <div className="flex items-baseline gap-2">
          <span
            className={`${config.text} font-bold ${isActive ? 'text-orange-600' : 'text-gray-400'}`}
          >
            {currentStreak}
          </span>
          <span className={`${config.subtext} text-gray-600`}>
            {currentStreak === 1 ? 'jour' : 'jours'}
          </span>
        </div>

        {showLongest && longestStreak !== undefined && longestStreak > currentStreak && (
          <div className={`${config.subtext} text-gray-500 flex items-center gap-1`}>
            <Trophy size={12} className="text-yellow-600" />
            <span>Record: {longestStreak} jours</span>
          </div>
        )}
      </div>
    </div>
  );
}
