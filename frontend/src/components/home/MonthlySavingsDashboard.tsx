/**
 * ⑰ Monthly Savings Dashboard - Gamified Personal Achievement Tracker
 *
 * Shows user's monthly savings with badges, trends, and annual projection.
 * Psychological effect: Pride + engagement → Regular returns to track score
 *
 * Features:
 * - Total saved this month (€ + %)
 * - Comparison with previous month
 * - Achievement badges (unlockable)
 * - Annual projection
 * - Trend visualization
 *
 * Data: 100% safeLocalStorage (GDPR-compliant)
 */

import { useState, useEffect } from 'react';
import { GlassCard } from '../ui/glass-card';
import { safeLocalStorage } from '../../utils/safeLocalStorage';

interface MonthlySavings {
  currentMonth: {
    amount: number;
    percentage: number;
    transactions: number;
  };
  previousMonth: {
    amount: number;
    percentage: number;
  };
  badges: string[];
  annualProjection: number;
}

interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlocked: boolean;
  requirement: string;
}

const AVAILABLE_BADGES: Badge[] = [
  {
    id: 'hunter',
    name: 'Chasseur de Promos',
    icon: '🎯',
    description: 'Économisé plus de 20€ en un mois',
    unlocked: false,
    requirement: '20€+/mois',
  },
  {
    id: 'eco',
    name: 'Éco-Citoyen',
    icon: '🌱',
    description: "Utilisé l'itinéraire optimal 5 fois",
    unlocked: false,
    requirement: '5 itinéraires',
  },
  {
    id: 'regular',
    name: 'Utilisateur Régulier',
    icon: '⭐',
    description: 'Actif pendant 3 mois consécutifs',
    unlocked: false,
    requirement: '3 mois',
  },
  {
    id: 'expert',
    name: 'Expert Économies',
    icon: '💎',
    description: 'Économisé plus de 100€ au total',
    unlocked: false,
    requirement: '100€ total',
  },
];

export function MonthlySavingsDashboard() {
  const [savings, setSavings] = useState<MonthlySavings | null>(null);
  const [badges, setBadges] = useState<Badge[]>(AVAILABLE_BADGES);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadSavingsData();
  }, []);

  const loadSavingsData = () => {
    // Load from safeLocalStorage
    const data = safeLocalStorage.getJSON<MonthlySavings | null>('monthlySavings:v1', null);

    if (data) {
      setSavings(data);
      updateBadges(data);
    } else {
      // Generate example data for demo
      const exampleData: MonthlySavings = {
        currentMonth: {
          amount: 24.35,
          percentage: 12.5,
          transactions: 8,
        },
        previousMonth: {
          amount: 18.2,
          percentage: 9.8,
        },
        badges: ['hunter'],
        annualProjection: 292.2,
      };
      setSavings(exampleData);
      updateBadges(exampleData);
    }
  };

  const updateBadges = (data: MonthlySavings) => {
    const updatedBadges = AVAILABLE_BADGES.map((badge) => ({
      ...badge,
      unlocked: data.badges.includes(badge.id),
    }));
    setBadges(updatedBadges);
  };

  const getTrendIcon = () => {
    if (!savings) return '→';
    const diff = savings.currentMonth.amount - savings.previousMonth.amount;
    if (diff > 0) return '📈';
    if (diff < 0) return '📉';
    return '→';
  };

  const getTrendText = () => {
    if (!savings) return 'Stable';
    const diff = savings.currentMonth.amount - savings.previousMonth.amount;
    const diffPercent = ((diff / savings.previousMonth.amount) * 100).toFixed(1);

    if (diff > 0) {
      return `+${diff.toFixed(2)}€ (${diffPercent}%) vs mois dernier`;
    }
    if (diff < 0) {
      return `${diff.toFixed(2)}€ (${diffPercent}%) vs mois dernier`;
    }
    return 'Identique au mois dernier';
  };

  if (!savings) {
    return (
      <GlassCard className="animate-pulse">
        <div className="h-48 bg-gray-700/30 rounded"></div>
      </GlassCard>
    );
  }

  const monthName = new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(new Date());

  return (
    <GlassCard className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📊</span>
          <div>
            <h3 className="text-xl font-bold text-white">Votre Bilan Économies</h3>
            <p className="text-sm text-gray-400 capitalize">{monthName} 2026</p>
          </div>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
          aria-label="Toggle details"
        >
          {showDetails ? 'Masquer' : 'Détails'}
        </button>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Current Month Savings */}
        <div className="glass p-4 rounded-lg border border-green-500/30">
          <div className="text-sm text-gray-400 mb-1">Total économisé ce mois</div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-green-400">
              {savings.currentMonth.amount.toFixed(2)}€
            </span>
            <span className="text-xl text-green-400/70">-{savings.currentMonth.percentage}%</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Sur {savings.currentMonth.transactions} transactions
          </div>
        </div>

        {/* Annual Projection */}
        <div className="glass p-4 rounded-lg border border-blue-500/30">
          <div className="text-sm text-gray-400 mb-1">Projection annuelle</div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-blue-400">
              {savings.annualProjection.toFixed(2)}€
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-1">Si vous continuez à ce rythme</div>
        </div>
      </div>

      {/* Trend Indicator */}
      <div className="mb-6 p-3 rounded-lg bg-gray-800/50 border border-gray-700/50">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getTrendIcon()}</span>
          <div className="flex-1">
            <div className="text-sm font-medium text-white">Tendance</div>
            <div className="text-xs text-gray-400">{getTrendText()}</div>
          </div>
        </div>
      </div>

      {/* Achievement Badges */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
          <span>🏆</span>
          Achievements ({badges.filter((b) => b.unlocked).length}/{badges.length})
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`p-3 rounded-lg border transition-all ${
                badge.unlocked
                  ? 'bg-yellow-500/10 border-yellow-500/30 hover:bg-yellow-500/20'
                  : 'bg-gray-800/30 border-gray-700/30 opacity-50'
              }`}
              title={badge.unlocked ? badge.description : `Débloquer: ${badge.requirement}`}
            >
              <div className="text-center">
                <div className={`text-3xl mb-1 ${badge.unlocked ? '' : 'grayscale'}`}>
                  {badge.icon}
                </div>
                <div className="text-xs font-medium text-white">{badge.name}</div>
                {!badge.unlocked && (
                  <div className="text-xs text-gray-500 mt-1">{badge.requirement}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Details Panel */}
      {showDetails && (
        <div className="mt-4 p-4 rounded-lg bg-gray-800/50 border border-gray-700/50 space-y-3">
          <div className="text-sm text-gray-300">
            <strong>Comment c'est calculé ?</strong>
          </div>
          <ul className="text-xs text-gray-400 space-y-2">
            <li>
              • <strong>Total économisé</strong> : Différence entre prix observé et meilleur prix
              trouvé
            </li>
            <li>
              • <strong>Pourcentage</strong> : Économies / Prix total sans comparaison
            </li>
            <li>
              • <strong>Projection annuelle</strong> : (Moyenne mensuelle × 12)
            </li>
            <li>
              • <strong>Badges</strong> : Débloqués automatiquement selon votre activité
            </li>
          </ul>
          <div className="text-xs text-gray-500 italic pt-2 border-t border-gray-700/50">
            💡 Revenez régulièrement pour débloquer tous les badges !
          </div>
        </div>
      )}

      {/* Data Attribution */}
      <div className="mt-4 pt-4 border-t border-gray-700/50 text-xs text-gray-500 text-center">
        📊 Données personnelles • Stockées localement • Outil d'information
      </div>
    </GlassCard>
  );
}
