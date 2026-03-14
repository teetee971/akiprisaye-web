/**
 * StatsOverview Component
 * User statistics overview
 */

import React from 'react';
import { 
  Scan, 
  Scale, 
  FileText, 
  MapPin, 
  Calendar, 
  TrendingUp,
  Award,
  Target
} from 'lucide-react';
import type { UserProfile } from '../../types/gamification';

interface StatsOverviewProps {
  profile: UserProfile;
  className?: string;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-md p-4 border-l-4 ${color}`}>
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-lg bg-opacity-10 ${color.replace('border-', 'bg-')}`}>
          {icon}
        </div>
        <div className="flex-1">
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className="text-sm text-gray-600">{label}</div>
        </div>
      </div>
    </div>
  );
}

export function StatsOverview({ profile, className = '' }: StatsOverviewProps) {
  const stats = profile.stats;

  const statCards = [
    {
      icon: <Scan className="text-blue-600" size={24} />,
      label: 'Scans effectués',
      value: stats.totalScans.toLocaleString(),
      color: 'border-blue-600'
    },
    {
      icon: <Scale className="text-purple-600" size={24} />,
      label: 'Comparaisons',
      value: stats.totalComparisons.toLocaleString(),
      color: 'border-purple-600'
    },
    {
      icon: <FileText className="text-green-600" size={24} />,
      label: 'Contributions',
      value: stats.totalContributions.toLocaleString(),
      color: 'border-green-600'
    },
    {
      icon: <MapPin className="text-orange-600" size={24} />,
      label: 'Territoires visités',
      value: stats.territoriesVisited?.length || 0,
      color: 'border-orange-600'
    },
    {
      icon: <Calendar className="text-teal-600" size={24} />,
      label: 'Jours actifs',
      value: stats.activeDays.toLocaleString(),
      color: 'border-teal-600'
    },
    {
      icon: <Award className="text-yellow-600" size={24} />,
      label: 'Badges débloqués',
      value: profile.badges.length,
      color: 'border-yellow-600'
    },
    {
      icon: <Target className="text-pink-600" size={24} />,
      label: 'Défis complétés',
      value: profile.completedChallenges.length,
      color: 'border-pink-600'
    },
    {
      icon: <TrendingUp className="text-indigo-600" size={24} />,
      label: 'Total XP',
      value: profile.totalXP.toLocaleString(),
      color: 'border-indigo-600'
    }
  ];

  return (
    <div className={className}>
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Statistiques</h2>
        <p className="text-gray-600">Votre progression en détail</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Additional Info */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Account Info */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Informations du compte</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Membre depuis</span>
              <span className="font-medium text-gray-900">
                {new Date(profile.createdAt).toLocaleDateString('fr-FR')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Dernière activité</span>
              <span className="font-medium text-gray-900">
                {new Date(profile.lastActivityDate).toLocaleDateString('fr-FR')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">ID utilisateur</span>
              <span className="font-mono text-xs text-gray-600">
                {profile.userId.slice(0, 8)}...
              </span>
            </div>
          </div>
        </div>

        {/* Territories */}
        {stats.territoriesVisited && stats.territoriesVisited.length > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Territoires explorés</h3>
            <div className="flex flex-wrap gap-2">
              {stats.territoriesVisited.map(territory => (
                <span 
                  key={territory}
                  className="px-3 py-1 bg-white rounded-full text-sm font-medium text-gray-700 shadow-sm"
                >
                  {territory}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
