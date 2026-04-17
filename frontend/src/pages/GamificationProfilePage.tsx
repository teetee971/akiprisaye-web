/**
 * Gamification Profile Page
 * Complete user profile page with all stats, badges, challenges, and progress
 */

import React, { useEffect, useState } from 'react';
import { User, Award, TrendingUp, Target, Flame, ArrowLeft, RefreshCw } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGamification } from '../hooks/useGamification';
import { useBadges } from '../hooks/useBadges';
import { useChallenges } from '../hooks/useChallenges';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';
import {
  LevelBadge,
  LevelProgressBar,
  BadgeGrid,
  BadgeUnlockModal,
  StreakCounter,
  ChallengeList,
  StatsOverview,
  LeaderboardCard,
} from '../components/gamification';
import { useLeaderboard } from '../hooks/useLeaderboard';
import type { UserBadge } from '../types/gamification';

export default function GamificationProfilePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId') || 'demo-user'; // Get from auth in production

  const {
    profile,
    dashboard,
    pointsSummary,
    loading: profileLoading,
    error: profileError,
    refresh: refreshProfile,
  } = useGamification({ userId });
  const { badges, loading: badgesLoading, error: badgesError } = useBadges({ userId });
  const {
    activeChallenges,
    loading: challengesLoading,
    error: challengesError,
  } = useChallenges({ userId });
  const { leaderboard, loading: leaderboardLoading } = useLeaderboard({ userId, limit: 10 });

  const [selectedBadge, setSelectedBadge] = useState<UserBadge | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'badges' | 'challenges' | 'stats'>(
    'overview'
  );

  const loading = profileLoading || badgesLoading || challengesLoading;
  const error = profileError || badgesError || challengesError;

  const handleRefresh = async () => {
    await refreshProfile();
  };

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <div className="text-red-600 mb-4 text-center">
            <Award size={48} className="mx-auto mb-2" />
            <h2 className="text-xl font-bold">Erreur</h2>
          </div>
          <p className="text-gray-600 text-center mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Profil non trouvé</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero banner — real Unsplash photo with gradient fallback */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <HeroImage
          src={PAGE_HERO_IMAGES.gamification}
          alt="Récompenses et badges — profil citoyen"
          gradient="from-blue-900 to-purple-950"
          height="h-44 sm:h-56"
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
              onClick={handleRefresh}
              className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Actualiser"
            >
              <RefreshCw size={16} />
            </button>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow">
            🏆 {profile.username || `Utilisateur ${profile.userId.slice(0, 6)}`}
          </h1>
          <p className="text-slate-200 text-sm drop-shadow">
            Niveau {profile.level} ·{' '}
            {profile.totalPoints?.toLocaleString() ?? profile.totalXP?.toLocaleString() ?? 0} points
          </p>
        </HeroImage>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6 p-2">
          <div className="flex gap-2 overflow-x-auto">
            {[
              { id: 'overview', label: "Vue d'ensemble", icon: TrendingUp },
              { id: 'badges', label: 'Badges', icon: Award },
              { id: 'challenges', label: 'Défis', icon: Target },
              { id: 'stats', label: 'Statistiques', icon: User },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Progress Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Progression</h2>
              <LevelProgressBar
                currentXP={profile.totalXP}
                level={profile.level}
                showDetails={true}
              />
            </div>

            {/* Streak Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-2 mb-4">
                <Flame className="text-orange-500" size={24} />
                <h2 className="text-xl font-bold text-gray-900">Série de connexion</h2>
              </div>
              <StreakCounter
                currentStreak={profile.currentStreak}
                longestStreak={profile.longestStreak}
                todayCompleted={
                  new Date(profile.lastActivityDate).toDateString() === new Date().toDateString()
                }
                showLongest={true}
                size="lg"
              />
            </div>

            {/* Recent Activity Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Challenges */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <ChallengeList
                  challenges={activeChallenges.slice(0, 3)}
                  title="Défis actifs"
                  showFilters={false}
                  compact={true}
                />
              </div>

              {/* Leaderboard */}
              <LeaderboardCard
                entries={leaderboard}
                currentUserId={userId}
                onViewAll={() => navigate('/gamification/leaderboard')}
              />
            </div>
          </div>
        )}

        {activeTab === 'badges' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <BadgeGrid badges={badges} showProgress={true} onBadgeClick={setSelectedBadge} />
          </div>
        )}

        {activeTab === 'challenges' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <ChallengeList challenges={activeChallenges} showFilters={true} />
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <StatsOverview profile={profile} />
          </div>
        )}
      </div>

      {/* Badge Unlock Modal */}
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
