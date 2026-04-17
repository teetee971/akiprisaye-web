/**
 * ChallengeCard Component
 * Single challenge display with progress
 */

import React from 'react';
import { CheckCircle, Clock, Trophy, Zap } from 'lucide-react';
import type { UserChallenge } from '../../types/gamification';

interface ChallengeCardProps {
  challenge: UserChallenge;
  compact?: boolean;
  className?: string;
}

const typeColors = {
  daily: 'from-blue-500 to-blue-600',
  weekly: 'from-purple-500 to-purple-600',
  monthly: 'from-pink-500 to-pink-600',
  special: 'from-yellow-500 to-orange-600',
};

const typeLabels = {
  daily: 'Quotidien',
  weekly: 'Hebdomadaire',
  monthly: 'Mensuel',
  special: 'Spécial',
};

export function ChallengeCard({ challenge, compact = false, className = '' }: ChallengeCardProps) {
  const progress = Math.min((challenge.progress / challenge.requirement.count) * 100, 100);
  const isCompleted = challenge.isCompleted;
  const gradient = typeColors[challenge.type];
  const label = typeLabels[challenge.type];

  const timeRemaining = new Date(challenge.endDate).getTime() - Date.now();
  const daysLeft = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));

  return (
    <div
      className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${
        isCompleted
          ? 'bg-green-50 border-green-200'
          : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-lg'
      } ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`px-2 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${gradient}`}
            >
              {label}
            </span>
            {isCompleted && <CheckCircle size={16} className="text-green-600" />}
          </div>
          <h3
            className={`font-bold text-sm ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'}`}
          >
            {challenge.name}
          </h3>
          {!compact && <p className="text-xs text-gray-600 mt-1">{challenge.description}</p>}
        </div>

        {!isCompleted && daysLeft > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            <Clock size={12} />
            <span>{daysLeft}j</span>
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-600">
            {challenge.progress} / {challenge.requirement.count}
          </span>
          <span className={`font-semibold ${isCompleted ? 'text-green-600' : 'text-blue-600'}`}>
            {progress.toFixed(0)}%
          </span>
        </div>

        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              isCompleted ? 'bg-green-500' : `bg-gradient-to-r ${gradient}`
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Rewards */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1 text-sm">
          <Zap size={16} className="text-yellow-500" />
          <span className="font-semibold text-gray-700">+{challenge.xpReward} XP</span>
        </div>

        {challenge.badgeReward && (
          <div className="flex items-center gap-1 text-sm">
            <Trophy size={16} className="text-purple-500" />
            <span className="text-gray-600">Badge</span>
          </div>
        )}
      </div>

      {/* Completed Overlay */}
      {isCompleted && (
        <div className="absolute top-2 right-2 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
          Terminé ✓
        </div>
      )}
    </div>
  );
}
