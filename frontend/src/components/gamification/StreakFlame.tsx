/**
 * StreakFlame Component
 * Animated flame icon for streak display
 */

import React from 'react';
import { Flame } from 'lucide-react';

interface StreakFlameProps {
  isActive?: boolean;
  size?: number;
  className?: string;
}

export function StreakFlame({ isActive = true, size = 24, className = '' }: StreakFlameProps) {
  return (
    <div className={`relative inline-block ${className}`}>
      <Flame
        size={size}
        className={`${isActive ? 'text-orange-500 animate-pulse' : 'text-gray-400'} transition-colors duration-300`}
        fill={isActive ? 'currentColor' : 'none'}
      />
      {isActive && (
        <>
          <div className="absolute inset-0 animate-ping opacity-30">
            <Flame size={size} className="text-orange-400" />
          </div>
          <div className="absolute inset-0 blur-sm opacity-50">
            <Flame size={size} className="text-yellow-400" fill="currentColor" />
          </div>
        </>
      )}
    </div>
  );
}
