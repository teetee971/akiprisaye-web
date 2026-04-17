/**
 * BadgeGrid Component
 * Grid layout for badge collection
 */

import React, { useState } from 'react';
import { BadgeCard } from './BadgeCard';
import { Filter } from 'lucide-react';
import type { UserBadge } from '../../types/gamification';

interface BadgeGridProps {
  badges: UserBadge[];
  showProgress?: boolean;
  onBadgeClick?: (badge: UserBadge) => void;
  className?: string;
}

type FilterType =
  | 'all'
  | 'unlocked'
  | 'locked'
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'diamond';

export function BadgeGrid({
  badges,
  showProgress = true,
  onBadgeClick,
  className = '',
}: BadgeGridProps) {
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredBadges = badges.filter((badge) => {
    if (filter === 'all') return true;
    if (filter === 'unlocked') return badge.isUnlocked;
    if (filter === 'locked') return !badge.isUnlocked;
    return badge.tier === filter;
  });

  const stats = {
    total: badges.length,
    unlocked: badges.filter((b) => b.isUnlocked).length,
    locked: badges.filter((b) => !b.isUnlocked).length,
  };

  const filters: { value: FilterType; label: string }[] = [
    { value: 'all', label: `Tous (${stats.total})` },
    { value: 'unlocked', label: `Débloqués (${stats.unlocked})` },
    { value: 'locked', label: `Verrouillés (${stats.locked})` },
    { value: 'bronze', label: 'Bronze' },
    { value: 'silver', label: 'Argent' },
    { value: 'gold', label: 'Or' },
    { value: 'platinum', label: 'Platine' },
    { value: 'diamond', label: 'Diamant' },
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Filter size={18} className="text-gray-500 flex-shrink-0" />
        {filters.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              filter === value
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Stats Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-gray-900">{stats.unlocked}</span>
            <span className="text-gray-600 ml-2">/ {stats.total} badges</span>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Progression</div>
            <div className="text-xl font-bold text-blue-600">
              {((stats.unlocked / stats.total) * 100).toFixed(0)}%
            </div>
          </div>
        </div>
        <div className="mt-3 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
            style={{ width: `${(stats.unlocked / stats.total) * 100}%` }}
          />
        </div>
      </div>

      {/* Badge Grid */}
      {filteredBadges.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredBadges.map((badge) => (
            <BadgeCard
              key={badge.id}
              badge={badge}
              showProgress={showProgress}
              onClick={onBadgeClick ? () => onBadgeClick(badge) : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p>Aucun badge dans cette catégorie</p>
        </div>
      )}
    </div>
  );
}
