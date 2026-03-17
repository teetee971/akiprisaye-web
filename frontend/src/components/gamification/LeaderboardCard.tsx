/**
 * LeaderboardCard Component
 * Compact leaderboard card for dashboard
 */

import React from 'react';
import { Trophy, ArrowRight } from 'lucide-react';
import { LevelBadge } from './LevelBadge';
import { UserRankBadge } from './UserRankBadge';
import type { LeaderboardEntry } from '../../types/gamification';

interface LeaderboardCardProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  onViewAll?: () => void;
  className?: string;
}

export function LeaderboardCard({ 
  entries, 
  currentUserId,
  onViewAll,
  className = '' 
}: LeaderboardCardProps) {
  const topEntries = entries.slice(0, 5);

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="text-yellow-500" size={24} />
          <h3 className="text-lg font-bold text-gray-900">Top Contributeurs</h3>
        </div>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Voir tout
            <ArrowRight size={16} />
          </button>
        )}
      </div>

      {/* Entries */}
      <div className="space-y-3">
        {topEntries.map((entry) => {
          const isCurrentUser = entry.userId === currentUserId;
          const isTopThree = entry.rank <= 3;
          
          return (
            <div 
              key={entry.userId}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                isCurrentUser 
                  ? 'bg-blue-50 border border-blue-200' 
                  : 'hover:bg-gray-50'
              }`}
            >
              {/* Rank */}
              <div className="flex-shrink-0">
                {isTopThree ? (
                  <UserRankBadge rank={entry.rank} size="sm" />
                ) : (
                  <div className="w-8 h-8 flex items-center justify-center">
                    <span className="font-bold text-gray-600">#{entry.rank}</span>
                  </div>
                )}
              </div>

              {/* Avatar & Name */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {entry.avatar ? (
                  <img 
                    src={entry.avatar} 
                    alt={entry.username}
                    width={32}
                    height={32}
                    loading="lazy"
                    className="w-8 h-8 rounded-full flex-shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {entry.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className={`font-semibold text-sm truncate ${
                    isCurrentUser ? 'text-blue-700' : 'text-gray-900'
                  }`}>
                    {entry.username}
                    {isCurrentUser && (
                      <span className="ml-1 text-xs">(Vous)</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Level */}
              <div className="flex-shrink-0">
                <LevelBadge level={entry.level} size="sm" />
              </div>

              {/* XP */}
              <div className="flex-shrink-0 text-right">
                <div className="font-bold text-sm text-gray-900">
                  {entry.totalXP.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">XP</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {topEntries.length === 0 && (
        <div className="text-center py-8">
          <Trophy size={40} className="text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">Aucun classement disponible</p>
        </div>
      )}
    </div>
  );
}
