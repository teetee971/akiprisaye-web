/**
 * Badges Page
 * Badge collection page showing all badges (locked and unlocked)
 */

import React, { useState } from 'react';
import { Award, ArrowLeft, RefreshCw, Info } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useBadges } from '../hooks/useBadges';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';
import { BadgeGrid, BadgeUnlockModal } from '../components/gamification';
import type { UserBadge } from '../types/gamification';

export default function BadgesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId') || 'demo-user';

  const { badges, unlockedBadges, lockedBadges, loading, error, refresh } = useBadges({ userId });
  const [selectedBadge, setSelectedBadge] = useState<UserBadge | null>(null);

  const stats = {
    total: badges.length,
    unlocked: unlockedBadges.length,
    locked: lockedBadges.length,
    percentage: badges.length > 0 ? (unlockedBadges.length / badges.length) * 100 : 0,
    totalXP: unlockedBadges.reduce((sum, badge) => sum + badge.xpReward, 0),
  };

  // Group badges by category
  const badgesByCategory = badges.reduce(
    (acc, badge) => {
      if (!acc[badge.category]) {
        acc[badge.category] = [];
      }
      acc[badge.category].push(badge);
      return acc;
    },
    {} as Record<string, UserBadge[]>
  );

  const categoryLabels: Record<string, { label: string; icon: string; color: string }> = {
    scan: { label: 'Scanner', icon: '📱', color: 'from-blue-500 to-blue-600' },
    contribution: { label: 'Contribution', icon: '✍️', color: 'from-green-500 to-green-600' },
    social: { label: 'Social', icon: '👥', color: 'from-purple-500 to-purple-600' },
    streak: { label: 'Séries', icon: '🔥', color: 'from-orange-500 to-orange-600' },
    special: { label: 'Spécial', icon: '⭐', color: 'from-yellow-500 to-yellow-600' },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2 animate-fade-in">
        <HeroImage
          src={PAGE_HERO_IMAGES.badges}
          alt="Collection de badges — récompenses citoyens"
          gradient="from-purple-900 to-pink-950"
          height="h-44 sm:h-52"
        >
          <div className="flex items-center justify-between w-full mb-2">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm"
            >
              <ArrowLeft size={16} />
              <span>Retour</span>
            </button>
            <button
              onClick={refresh}
              disabled={loading}
              className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
              aria-label="Actualiser"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <Award size={32} />
            <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow">🏆 Mes Badges</h1>
            <p className="text-slate-200 text-sm drop-shadow">
              Vos récompenses pour votre contribution à la communauté
            </p>
          </div>
          <p className="text-slate-200 text-sm drop-shadow">
            {stats.unlocked}/{stats.unlocked + stats.locked} débloqués ·{' '}
            {stats.percentage.toFixed(0)}% de progression
          </p>
        </HeroImage>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">Comment débloquer des badges ?</p>
            <p>
              Chaque badge représente un accomplissement spécifique. Scannez des produits,
              contribuez des prix, comparez des offres et maintenez votre série de connexion pour
              débloquer de nouveaux badges et gagner des points XP !
            </p>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && !badges.length && (
          <div className="bg-white rounded-lg shadow-md p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement des badges...</p>
            </div>
          </div>
        )}

        {/* Badge Grid */}
        {!loading && badges.length > 0 && (
          <div className="space-y-8">
            {/* All Badges */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Tous les badges</h2>
              <BadgeGrid badges={badges} showProgress={true} onBadgeClick={setSelectedBadge} />
            </div>

            {/* Badges by Category */}
            {Object.entries(badgesByCategory).map(([category, categoryBadges]) => {
              const categoryInfo = categoryLabels[category] || {
                label: category,
                icon: '🏅',
                color: 'from-gray-500 to-gray-600',
              };

              return (
                <div key={category} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`w-12 h-12 bg-gradient-to-br ${categoryInfo.color} rounded-lg flex items-center justify-center text-2xl shadow-md`}
                    >
                      {categoryInfo.icon}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{categoryInfo.label}</h2>
                      <p className="text-sm text-gray-600">
                        {categoryBadges.filter((b) => b.isUnlocked).length} /{' '}
                        {categoryBadges.length} débloqués
                      </p>
                    </div>
                  </div>
                  <BadgeGrid
                    badges={categoryBadges}
                    showProgress={true}
                    onBadgeClick={setSelectedBadge}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && badges.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12">
            <div className="text-center">
              <Award size={64} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun badge disponible</h3>
              <p className="text-gray-600">
                Les badges apparaîtront ici une fois que vous commencerez à utiliser la plateforme
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <BadgeUnlockModal
          badge={selectedBadge}
          isOpen={!!selectedBadge}
          onClose={() => setSelectedBadge(null)}
        />
      )}
    </div>
  );
}
