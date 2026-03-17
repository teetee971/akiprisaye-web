 
/**
 * LeaderboardTable Component
 * Full leaderboard table with rankings
 */

import React from 'react';
import { Trophy, TrendingUp, MapPin, Award } from 'lucide-react';
import { LevelBadge } from './LevelBadge';
import { UserRankBadge } from './UserRankBadge';
import type { LeaderboardEntry } from '../../types/gamification';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  showTerritory?: boolean;
  className?: string;
}

export function LeaderboardTable({ 
  entries, 
  currentUserId,
  showTerritory = false,
  className = '' 
}: LeaderboardTableProps) {
  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
        <div className="flex items-center gap-3">
          <Trophy className="text-yellow-300" size={28} />
          <h2 className="text-2xl font-bold text-white">Classement</h2>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Rang
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Utilisateur
              </th>
              {showTerritory && (
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Territoire
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Niveau
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                XP Total
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Badges
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {entries.map((entry, index) => {
              const isCurrentUser = entry.userId === currentUserId;
              const isTopThree = entry.rank <= 3;
              
              return (
                <tr 
                  key={entry.userId}
                  className={`transition-colors ${
                    isCurrentUser 
                      ? 'bg-blue-50 hover:bg-blue-100' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Rank */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {isTopThree ? (
                        <UserRankBadge rank={entry.rank} size="sm" />
                      ) : (
                        <span className={`font-bold text-lg ${
                          isCurrentUser ? 'text-blue-600' : 'text-gray-700'
                        }`}>
                          #{entry.rank}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Username */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {entry.avatar ? (
                        <img 
                          src={entry.avatar} 
                          alt={entry.username}
                          width={40}
                          height={40}
                          loading="lazy"
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-bold">
                          {entry.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className={`font-semibold ${
                          isCurrentUser ? 'text-blue-700' : 'text-gray-900'
                        }`}>
                          {entry.username}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                              Vous
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Territory */}
                  {showTerritory && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      {entry.territory && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <MapPin size={14} />
                          <span>{entry.territory}</span>
                        </div>
                      )}
                    </td>
                  )}

                  {/* Level */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <LevelBadge level={entry.level} size="sm" />
                  </td>

                  {/* XP */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1">
                      <TrendingUp size={16} className="text-blue-600" />
                      <span className="font-bold text-lg text-gray-900">
                        {entry.totalXP.toLocaleString()}
                      </span>
                      <span className="text-sm text-gray-500">XP</span>
                    </div>
                  </td>

                  {/* Badges */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {entry.badges !== undefined && (
                      <div className="flex items-center justify-end gap-1">
                        <Award size={16} className="text-yellow-600" />
                        <span className="font-semibold text-gray-700">
                          {entry.badges}
                        </span>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {entries.length === 0 && (
        <div className="text-center py-12">
          <Trophy size={48} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucune donnée de classement disponible</p>
        </div>
      )}
    </div>
  );
}
