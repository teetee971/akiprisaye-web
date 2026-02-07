import React from 'react';
import { Badge } from '../../services/savingsService';

interface BadgesDisplayProps {
  badges: Badge[];
  className?: string;
}

export default function BadgesDisplay({ badges, className = '' }: BadgesDisplayProps) {
  const unlockedBadges = badges.filter(b => b.unlocked);
  const lockedBadges = badges.filter(b => !b.unlocked);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        🏆 Mes Badges
      </h3>

      {/* Unlocked Badges */}
      {unlockedBadges.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Débloqués ({unlockedBadges.length})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {unlockedBadges.map(badge => (
              <div
                key={badge.id}
                className="flex flex-col items-center p-4 rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-2 border-yellow-300 dark:border-yellow-700"
              >
                <div className="text-4xl mb-2">{badge.icon}</div>
                <h5 className="text-sm font-semibold text-gray-900 dark:text-white text-center">
                  {badge.name}
                </h5>
                <p className="text-xs text-gray-600 dark:text-gray-400 text-center mt-1">
                  {badge.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locked Badges */}
      {lockedBadges.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            À débloquer ({lockedBadges.length})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {lockedBadges.map(badge => (
              <div
                key={badge.id}
                className="flex flex-col items-center p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border-2 border-gray-200 dark:border-gray-700 opacity-60"
              >
                <div className="text-4xl mb-2 grayscale">{badge.icon}</div>
                <h5 className="text-sm font-semibold text-gray-900 dark:text-white text-center">
                  {badge.name}
                </h5>
                <p className="text-xs text-gray-600 dark:text-gray-400 text-center mt-1">
                  {badge.description}
                </p>
                {badge.progress !== undefined && badge.target !== undefined && (
                  <div className="mt-2 w-full">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all"
                        style={{ width: `${(badge.progress / badge.target) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                      {badge.progress} / {badge.target}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {badges.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          Commencez à économiser pour débloquer des badges !
        </p>
      )}
    </div>
  );
}
