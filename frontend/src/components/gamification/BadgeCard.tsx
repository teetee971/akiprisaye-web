/**
 * BadgeCard Component
 * Single badge display with locked/unlocked states
 */

import React from 'react';
import { Lock, CheckCircle } from 'lucide-react';
import type { UserBadge } from '../../types/gamification';

interface BadgeCardProps {
  badge: UserBadge;
  showProgress?: boolean;
  onClick?: () => void;
  className?: string;
}

const tierColors = {
  bronze: 'from-amber-700 to-amber-900',
  silver: 'from-gray-300 to-gray-500',
  gold: 'from-yellow-400 to-yellow-600',
  platinum: 'from-cyan-300 to-cyan-600',
  diamond: 'from-blue-400 to-purple-600'
};

const rarityBorders = {
  common: 'border-gray-300',
  uncommon: 'border-green-400',
  rare: 'border-blue-400',
  epic: 'border-purple-500',
  legendary: 'border-yellow-500'
};

export function BadgeCard({ badge, showProgress = false, onClick, className = '' }: BadgeCardProps) {
  const isLocked = !badge.isUnlocked;
  const tierGradient = tierColors[badge.tier];
  const rarityBorder = rarityBorders[badge.rarity];

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!onClick) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <div 
      className={`relative p-4 rounded-xl border-2 ${rarityBorder} transition-all duration-300 ${
        isLocked 
          ? 'bg-gray-50 opacity-60' 
          : `bg-gradient-to-br ${tierGradient} text-white shadow-lg hover:shadow-xl`
      } ${onClick ? 'cursor-pointer hover:scale-105' : ''} ${className}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Badge Icon */}
      <div className="flex justify-center mb-3">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl ${
          isLocked ? 'bg-gray-200' : 'bg-white/20 backdrop-blur-sm'
        }`}>
          {isLocked ? (
            <Lock className="text-gray-400" size={28} />
          ) : (
            <span role="img" aria-label={badge.name}>{badge.icon}</span>
          )}
        </div>
      </div>

      {/* Badge Info */}
      <div className="text-center space-y-1">
        <h3 className={`font-bold text-sm ${isLocked ? 'text-gray-700' : 'text-white'}`}>
          {badge.name}
        </h3>
        <p className={`text-xs ${isLocked ? 'text-gray-500' : 'text-white/80'}`}>
          {badge.description}
        </p>
      </div>

      {/* Progress Bar */}
      {showProgress && badge.progress !== undefined && isLocked && (
        <div className="mt-3 space-y-1">
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
              style={{ width: `${badge.progress}%` }}
            />
          </div>
          <div className="text-xs text-gray-600 text-center">
            {badge.progress}% complété
          </div>
        </div>
      )}

      {/* Unlocked Indicator */}
      {!isLocked && badge.unlockedAt && (
        <div className="absolute top-2 right-2">
          <CheckCircle className="text-white" size={20} />
        </div>
      )}

      {/* XP Reward */}
      <div className={`mt-2 text-center text-xs font-semibold ${
        isLocked ? 'text-gray-600' : 'text-white/90'
      }`}>
        +{badge.xpReward} XP
      </div>
    </div>
  );
}
