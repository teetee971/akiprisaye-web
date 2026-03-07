 
import React from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import {
  GRATIFICATION_BADGES,
  getEarnedBadges,
  getMockUserStats,
  formatDownloadCount,
  formatContributionCount,
  formatScannedProductsCount,
  getContributionMessage,
  type GratificationBadge,
  type UserStats,
} from '@/data/gratification';

interface GratificationDisplayProps {
  userStats?: UserStats;
  accessLevel?: string;
  showStats?: boolean;
}

export default function GratificationDisplay({
  userStats = getMockUserStats(),
  accessLevel = 'PUBLIC',
  showStats = true,
}: GratificationDisplayProps) {
  const earnedBadges = getEarnedBadges(userStats, accessLevel);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          Système de gratification
        </h2>
        <p className="text-gray-400 text-sm">
          Reconnaissance d'usage (sobre)
        </p>
        <p className="text-gray-500 text-xs mt-1">
          Aucune compétition • Aucune notation individuelle • Reconnaissance purement informative
        </p>
      </div>

      {/* Badges Display */}
      <div className="grid gap-4 md:grid-cols-3">
        {GRATIFICATION_BADGES.map((badge) => {
          const isEarned = earnedBadges.some(b => b.id === badge.id);
          
          return (
            <GlassCard
              key={badge.id}
              className={`transition-all ${
                isEarned 
                  ? 'border-blue-500/50 bg-blue-900/20' 
                  : 'opacity-60 grayscale'
              }`}
            >
              <div className="text-center">
                <div className="text-4xl mb-3">{badge.icon}</div>
                <h3 className="font-semibold text-white mb-2">
                  {badge.title}
                </h3>
                <p className="text-sm text-gray-300 mb-3">
                  {badge.description}
                </p>
                <p className="text-xs text-gray-500 italic">
                  {badge.criteria}
                </p>
                
                {isEarned && (
                  <div className="mt-3 pt-3 border-t border-blue-500/30">
                    <span className="text-xs text-blue-400 font-medium">
                      ✓ Obtenu
                    </span>
                  </div>
                )}
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* User Stats (Compteurs) */}
      {showStats && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-white mb-4 text-center">
            Compteurs d'usage
          </h3>
          
          <div className="grid gap-4 md:grid-cols-4">
            {/* Scanned Products Counter - NEW */}
            <GlassCard className="text-center">
              <div className="text-3xl mb-2">📦</div>
              <div className="text-2xl font-bold text-yellow-400 mb-1">
                {userStats.scannedProductsCount}
              </div>
              <p className="text-sm text-gray-300">
                {formatScannedProductsCount(userStats.scannedProductsCount)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Scans EAN réalisés
              </p>
            </GlassCard>

            {/* Contributions Counter */}
            <GlassCard className="text-center">
              <div className="text-3xl mb-2">🤝</div>
              <div className="text-2xl font-bold text-green-400 mb-1">
                {userStats.contributionsCount}
              </div>
              <p className="text-sm text-gray-300">
                {formatContributionCount(userStats.contributionsCount)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Signalements utiles
              </p>
            </GlassCard>

            {/* Downloads Counter */}
            <GlassCard className="text-center">
              <div className="text-3xl mb-2">📥</div>
              <div className="text-2xl font-bold text-blue-400 mb-1">
                {userStats.downloadsCount}
              </div>
              <p className="text-sm text-gray-300">
                {formatDownloadCount(userStats.downloadsCount)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Exports open-data
              </p>
            </GlassCard>

            {/* Active Days Counter */}
            <GlassCard className="text-center">
              <div className="text-3xl mb-2">📅</div>
              <div className="text-2xl font-bold text-purple-400 mb-1">
                {userStats.activeUsageDays}
              </div>
              <p className="text-sm text-gray-300">
                {userStats.activeUsageDays === 1 ? 'jour actif' : 'jours actifs'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Utilisation régulière
              </p>
            </GlassCard>
          </div>
          
          {/* Contribution Message - NEW */}
          <div className="mt-6 text-center">
            <GlassCard className="bg-green-900/20 border-green-500/30">
              <p className="text-base text-green-200 font-medium">
                💚 {getContributionMessage()}
              </p>
            </GlassCard>
          </div>
        </div>
      )}

      {/* Status Information */}
      <div className="mt-6">
        <GlassCard className="bg-slate-800/30">
          <div className="text-center">
            <h4 className="text-sm font-semibold text-white mb-2">
              Statut utilisateur (lecture seule)
            </h4>
            <p className="text-xs text-gray-400">
              {accessLevel === 'PUBLIC' && 'Utilisateur public'}
              {accessLevel === 'CITIZEN' && 'Citoyen+ actif'}
              {accessLevel === 'PROFESSIONAL' && 'Utilisateur Pro'}
              {accessLevel === 'INSTITUTIONAL' && 'Partenaire institutionnel'}
            </p>
            
            {earnedBadges.length > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                {earnedBadges.length} badge{earnedBadges.length > 1 ? 's' : ''} obtenu{earnedBadges.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Disclaimer */}
      <div className="text-center text-xs text-gray-500 mt-4">
        <p>
          Ces indications servent uniquement à contextualiser l'accès aux fonctionnalités.
        </p>
        <p className="mt-1">
          Elles ne constituent ni un classement, ni une distinction publique.
        </p>
      </div>
    </div>
  );
}
