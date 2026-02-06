/**
 * Shopping Statistics Display Component
 * Shows personal stats and achievement badges
 */

import React from 'react';
import { TrendingUp, Award, Leaf, Fuel, MapPin } from 'lucide-react';
import type { ShoppingStats, Badge } from '../utils/shoppingStats';

interface StatsDisplayProps {
  stats: ShoppingStats;
  badges: Badge[];
  onClearStats?: () => void;
}

export default function StatsDisplay({ stats, badges, onClearStats }: StatsDisplayProps) {
  const unlockedBadges = badges.filter(b => b.unlocked);
  const nextBadges = badges
    .filter(b => !b.unlocked && b.progress !== undefined && b.target !== undefined)
    .sort((a, b) => {
      const progressA = (a.progress! / a.target!) * 100;
      const progressB = (b.progress! / b.target!) * 100;
      return progressB - progressA;
    })
    .slice(0, 3);

  return (
    <div className="space-y-4" role="region" aria-label="Statistiques de courses">
      {/* Stats Overview */}
      <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-700/30 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400" aria-hidden="true" />
            <h3 id="stats-title" className="text-lg font-semibold text-purple-300">📊 Vos Statistiques</h3>
          </div>
          {onClearStats && (
            <button
              onClick={onClearStats}
              className="text-xs text-gray-500 hover:text-gray-400"
              title="Effacer les statistiques"
              aria-label="Effacer toutes les statistiques"
            >
              Effacer
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3" role="group" aria-labelledby="stats-title">
          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1" id="distance-label">
              <MapPin className="w-4 h-4 text-blue-400" aria-hidden="true" />
              <span className="text-xs text-gray-400">Distance</span>
            </div>
            <div className="text-2xl font-bold text-blue-300" aria-describedby="distance-label">
              {stats.totalDistance.toFixed(1)} km
            </div>
            <div className="text-xs text-gray-500">{stats.totalTrips} courses</div>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1" id="fuel-label">
              <Fuel className="w-4 h-4 text-orange-400" aria-hidden="true" />
              <span className="text-xs text-gray-400">Carburant</span>
            </div>
            <div className="text-2xl font-bold text-orange-300" aria-describedby="fuel-label">
              {stats.fuelSaved.toFixed(1)} L
            </div>
            <div className="text-xs text-gray-500">économisés</div>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-3 col-span-2">
            <div className="flex items-center gap-2 mb-1" id="co2-label">
              <Leaf className="w-4 h-4 text-green-400" aria-hidden="true" />
              <span className="text-xs text-gray-400">Impact écologique</span>
            </div>
            <div className="text-2xl font-bold text-green-300" aria-describedby="co2-label">
              {stats.co2Saved.toFixed(1)} kg CO₂
            </div>
            <div className="text-xs text-gray-500">évités grâce à l'optimisation</div>
          </div>
        </div>

        <div className="mt-3 p-2 bg-emerald-900/20 rounded border border-emerald-700/30" role="note">
          <div className="text-xs text-emerald-200">
            🌱 Équivalent à <strong>{Math.round(stats.co2Saved / 2.3)} km</strong> en voiture non parcourus
          </div>
        </div>
      </div>

      {/* Badges */}
      {unlockedBadges.length > 0 && (
        <div className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border border-yellow-700/30 rounded-lg p-4" role="region" aria-label="Badges débloqués">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-5 h-5 text-yellow-400" aria-hidden="true" />
            <h3 id="badges-title" className="text-lg font-semibold text-yellow-300">🏆 Badges Débloqués</h3>
          </div>

          <div className="grid grid-cols-4 gap-2" role="list" aria-labelledby="badges-title">
            {unlockedBadges.map(badge => (
              <div
                key={badge.id}
                className="flex flex-col items-center p-2 bg-slate-800/50 rounded-lg hover:bg-slate-800/70 transition-colors"
                title={badge.description}
                role="listitem"
                aria-label={`Badge ${badge.name} : ${badge.description}`}
              >
                <div className="text-3xl mb-1" aria-hidden="true">{badge.icon}</div>
                <div className="text-xs text-center text-gray-300 font-medium">
                  {badge.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Badges to Unlock */}
      {nextBadges.length > 0 && (
        <div className="bg-slate-800/30 border border-slate-700/30 rounded-lg p-4" role="region" aria-label="Prochains objectifs">
          <div className="text-sm font-semibold text-gray-300 mb-3">
            🎯 Prochains objectifs
          </div>

          <div className="space-y-3" role="list">
            {nextBadges.map(badge => {
              const progress = badge.progress || 0;
              const target = badge.target || 1;
              const percentage = Math.min((progress / target) * 100, 100);

              return (
                <div key={badge.id} className="space-y-1" role="listitem">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-xl" aria-hidden="true">{badge.icon}</span>
                      <span className="text-gray-300 font-medium">{badge.name}</span>
                    </div>
                    <span className="text-gray-400" aria-label={`Progression : ${progress.toFixed(1)} sur ${target}`}>
                      {progress.toFixed(1)} / {target}
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2" role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100} aria-label={`${badge.name} : ${percentage.toFixed(0)}% complété`}>
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500">{badge.description}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Privacy Notice */}
      <div className="p-3 bg-slate-800/20 border border-slate-700/30 rounded-lg" role="note">
        <div className="text-xs text-gray-400">
          🔒 <strong>Confidentialité :</strong> Toutes vos statistiques sont stockées localement sur votre appareil. 
          Aucune donnée n'est envoyée à nos serveurs.
        </div>
      </div>
    </div>
  );
}
