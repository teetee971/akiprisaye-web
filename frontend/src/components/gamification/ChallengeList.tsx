/**
 * ChallengeList Component
 * List of active challenges
 */

import React, { useState } from 'react';
import { ChallengeCard } from './ChallengeCard';
import { Filter, Target } from 'lucide-react';
import type { UserChallenge } from '../../types/gamification';

interface ChallengeListProps {
  challenges: UserChallenge[];
  title?: string;
  showFilters?: boolean;
  compact?: boolean;
  className?: string;
}

type FilterType = 'all' | 'daily' | 'weekly' | 'monthly' | 'special' | 'active' | 'completed';

export function ChallengeList({
  challenges,
  title = 'Défis',
  showFilters = true,
  compact = false,
  className = '',
}: ChallengeListProps) {
  const [filter, setFilter] = useState<FilterType>('active');

  const filteredChallenges = challenges.filter((challenge) => {
    if (filter === 'all') return true;
    if (filter === 'active') return !challenge.isCompleted && challenge.isActive;
    if (filter === 'completed') return challenge.isCompleted;
    return challenge.type === filter;
  });

  const stats = {
    total: challenges.length,
    active: challenges.filter((c) => !c.isCompleted && c.isActive).length,
    completed: challenges.filter((c) => c.isCompleted).length,
  };

  const filters: { value: FilterType; label: string }[] = [
    { value: 'active', label: `Actifs (${stats.active})` },
    { value: 'completed', label: `Terminés (${stats.completed})` },
    { value: 'all', label: `Tous (${stats.total})` },
    { value: 'daily', label: 'Quotidiens' },
    { value: 'weekly', label: 'Hebdomadaires' },
    { value: 'monthly', label: 'Mensuels' },
    { value: 'special', label: 'Spéciaux' },
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target size={24} className="text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        </div>
        {stats.active > 0 && (
          <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
            {stats.active} en cours
          </div>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
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
      )}

      {/* Challenge List */}
      {filteredChallenges.length > 0 ? (
        <div className="space-y-3">
          {filteredChallenges.map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} compact={compact} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Target size={48} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucun défi dans cette catégorie</p>
          {filter === 'active' && stats.completed > 0 && (
            <button
              onClick={() => setFilter('completed')}
              className="mt-3 text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              Voir les défis terminés
            </button>
          )}
        </div>
      )}
    </div>
  );
}
