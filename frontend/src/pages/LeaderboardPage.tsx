/**
 * Leaderboard Page
 * Leaderboard page with filters (all-time, monthly, weekly, by territory)
 */

import React, { useState } from 'react';
import {
  Trophy,
  Filter,
  ArrowLeft,
  RefreshCw,
  MapPin,
  Calendar,
  Gift,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';
import { LeaderboardTable, UserRankBadge } from '../components/gamification';

const TERRITORIES = [
  { code: '', label: 'Tous les territoires' },
  { code: 'GP', label: 'Guadeloupe' },
  { code: 'MQ', label: 'Martinique' },
  { code: 'GF', label: 'Guyane' },
  { code: 'RE', label: 'La Réunion' },
  { code: 'YT', label: 'Mayotte' },
  { code: 'NC', label: 'Nouvelle-Calédonie' },
  { code: 'PF', label: 'Polynésie française' },
  { code: 'WF', label: 'Wallis-et-Futuna' },
  { code: 'PM', label: 'Saint-Pierre-et-Miquelon' },
  { code: 'BL', label: 'Saint-Barthélemy' },
  { code: 'MF', label: 'Saint-Martin' },
];

const PERIODS = [
  { value: 'all_time', label: 'Tout temps', icon: '🏆' },
  { value: 'monthly', label: 'Ce mois', icon: '📅' },
  { value: 'weekly', label: 'Cette semaine', icon: '📆' },
] as const;

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId') || 'demo-user';

  const [period, setPeriod] = useState<'all_time' | 'monthly' | 'weekly'>('all_time');
  const [territory, setTerritory] = useState<string>('');

  const { leaderboard, userRank, neighbors, loading, error, refresh, updateFilters } =
    useLeaderboard({
      userId,
      period,
      territory,
      limit: 100,
    });

  const handlePeriodChange = (newPeriod: 'all_time' | 'monthly' | 'weekly') => {
    setPeriod(newPeriod);
    updateFilters({ period: newPeriod });
  };

  const handleTerritoryChange = (newTerritory: string) => {
    setTerritory(newTerritory);
    updateFilters({ territory: newTerritory || undefined });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero banner — real Unsplash photo with gradient fallback */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2 animate-fade-in">
        <HeroImage
          src={PAGE_HERO_IMAGES.leaderboard}
          alt="Classement des meilleurs contributeurs"
          gradient="from-slate-950 to-yellow-900"
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
              onClick={refresh}
              disabled={loading}
              className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
              aria-label="Actualiser"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <Trophy size={32} />
            <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow">Classement</h1>
          </div>
          <p className="text-slate-200 text-sm drop-shadow">
            Les meilleurs contributeurs de la plateforme
          </p>
        </HeroImage>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={20} className="text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Filtres</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Period Filter */}
            <div>
              <span className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar size={16} />
                Période
              </span>
              <div className="flex gap-2">
                {PERIODS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => handlePeriodChange(p.value)}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      period === p.value
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span className="mr-1">{p.icon}</span>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Territory Filter */}
            <div>
              <label
                htmlFor="territory"
                className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
              >
                <MapPin size={16} />
                Territoire
              </label>
              <select
                id="territory"
                value={territory}
                onChange={(e) => handleTerritoryChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {TERRITORIES.map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && !leaderboard.length && (
          <div className="bg-white rounded-lg shadow-md p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement du classement...</p>
            </div>
          </div>
        )}

        {/* Leaderboard Table */}
        {!loading && leaderboard.length > 0 && (
          <>
            {/* Stats Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg p-4 text-white">
                <div className="text-3xl font-bold mb-1">{leaderboard.length}</div>
                <div className="text-sm text-white/80">Participants</div>
              </div>
              <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg p-4 text-white">
                <div className="text-3xl font-bold mb-1">
                  {leaderboard[0]?.totalXP.toLocaleString()}
                </div>
                <div className="text-sm text-white/80">XP du leader</div>
              </div>
              <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg p-4 text-white">
                <div className="text-3xl font-bold mb-1">
                  {Math.floor(
                    leaderboard.reduce((sum, e) => sum + e.totalXP, 0) / leaderboard.length
                  ).toLocaleString()}
                </div>
                <div className="text-sm text-white/80">XP moyen</div>
              </div>
            </div>

            {/* Table */}
            <LeaderboardTable
              entries={leaderboard}
              currentUserId={userId}
              showTerritory={!territory}
            />
          </>
        )}

        {/* Empty State */}
        {!loading && !error && leaderboard.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12">
            <div className="text-center">
              <Trophy size={64} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Aucun classement disponible
              </h3>
              <p className="text-gray-600">
                Essayez de modifier les filtres pour voir plus de résultats
              </p>
            </div>
          </div>
        )}

        {/* Parrainage Section */}
        <ParrainageSection userId={userId} />
      </div>
    </div>
  );
}

// ── Parrainage Section ──────────────────────────────────────────────────────

const REFERRALS_KEY = 'akiprisaye_referral_used';

function loadUsedReferrals(): string[] {
  try {
    return JSON.parse(localStorage.getItem(REFERRALS_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveUsedReferrals(codes: string[]) {
  localStorage.setItem(REFERRALS_KEY, JSON.stringify(codes));
}

function ParrainageSection({ userId }: { userId: string }) {
  const [code, setCode] = useState('');
  const [usedCodes, setUsedCodes] = useState<string[]>(loadUsedReferrals);

  function handleVerify() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      toast.error('Veuillez saisir un code');
      return;
    }
    if (usedCodes.includes(trimmed)) {
      toast.error(`Code "${trimmed}" déjà utilisé`);
      return;
    }
    if (trimmed.startsWith('AKI-')) {
      const updated = [trimmed, ...usedCodes];
      setUsedCodes(updated);
      saveUsedReferrals(updated);
      setCode('');
      toast.success(`✅ Code valide ! +50 XP ajoutés à votre compte`);
    } else {
      toast.error(`Code "${trimmed}" invalide — Les codes valides commencent par "AKI-"`);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mt-6">
      <div className="flex items-center gap-3 mb-4">
        <Gift size={22} className="text-yellow-500" />
        <h2 className="text-lg font-semibold text-gray-900">Mes parrainages</h2>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Code parrainage (ex: AKI-XXXXX)"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
        />
        <button
          onClick={handleVerify}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
        >
          <CheckCircle size={16} />
          Vérifier
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700 mb-4 flex items-start gap-2">
        <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
        <span>
          Les codes valides commencent par <strong>AKI-</strong> et donnent <strong>+50 XP</strong>
        </span>
      </div>

      {usedCodes.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Codes utilisés :</p>
          <div className="flex flex-wrap gap-2">
            {usedCodes.map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full font-medium"
              >
                <CheckCircle size={12} />
                {c} (+50 XP)
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
