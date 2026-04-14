import React, { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, Navigate } from 'react-router-dom';
import { Building2, Clock3, Crown, Key, RefreshCw, Wrench } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getDailyStats } from '../utils/priceClickTracker';
import { generateDailyPost, getGhostwriterHistory, saveGhostwriterPost } from '../services/ghostwriterService';
import type { GhostwriterHistoryEntry } from '../services/ghostwriterService';
import { getPredatorSeedAlerts, runPredatorMonitoring } from '../services/predatorService';
import { useVisitorStats } from '../hooks/useVisitorStats';
import type { InterestStats, TerritoryInterestStat, TerritoryStats } from '../hooks/useVisitorStats';
import CreatorSkeleton from '../components/creator/CreatorSkeleton';

const CreatorAudiencePanel = lazy(
  () => import('../components/creator/CreatorAudiencePanel'),
);
const CreatorRevenuePanel = lazy(
  () => import('../components/creator/CreatorRevenuePanel'),
);
const CreatorAdminTools = lazy(
  () => import('../components/creator/CreatorAdminTools'),
);
const CreatorActivationGuide = lazy(
  () => import('../components/creator/CreatorActivationGuide'),
);

const radarStyle = `
@keyframes radarPulse { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 1; transform: scale(1.1); } }
`;

const normalizeInterestKey = (value: string | undefined) => {
  if (!value) return '';
  if (value === 'scan') return 'scanner';
  return value.toLowerCase();
};

export function buildCreatorBriefing({
  topTerritory,
  topInterest,
  topTerritoryHistoricalInterest,
}: {
  topTerritory?: TerritoryStats;
  topInterest?: InterestStats;
  topTerritoryHistoricalInterest?: TerritoryInterestStat;
}) {
  const territoryName = topTerritory?.name ?? 'ce territoire';
  const liveEmoji = topInterest?.emoji ?? '📌';
  const liveLabel = (topInterest?.name ?? 'aucun focus').toLowerCase();
  const historicalEmoji = topTerritoryHistoricalInterest?.emoji ?? '';
  const historicalLabel = (topTerritoryHistoricalInterest?.name ?? 'aucun historique dominant').toLowerCase();

  const liveKey = normalizeInterestKey(topInterest?.key);
  const historicalKey = normalizeInterestKey(topTerritoryHistoricalInterest?.interest);
  const sameSignal = Boolean(liveKey && historicalKey && liveKey === historicalKey);

  const historicalSentence = sameSignal
    ? 'ce besoin confirme aussi le meilleur signal historique sur ce territoire'
    : `tandis que le meilleur signal historique sur ce territoire reste ${historicalEmoji ? `${historicalEmoji} ` : ''}${historicalLabel}`;

  return `Sur ${territoryName}, Le foyer d’attention principal est ${liveEmoji} ${liveLabel}; ${historicalSentence}.`;
}

const EspaceCreateur: React.FC = () => {
  const { isCreator, isAdmin, loading } = useAuth();
  const { totalOnline, byTerritory, byInterest } = useVisitorStats();
  const creatorSpaceVersion = import.meta.env.VITE_APP_VERSION ?? '0.0.0';

  const [ghostwriterCopied, setGhostwriterCopied] = useState(false);
  const [predatorScanning, setPredatorScanning] = useState(false);
  const [predatorAlerts, setPredatorAlerts] = useState(() => getPredatorSeedAlerts());
  const [predatorLastScan, setPredatorLastScan] = useState<string | null>(null);
  const [postHistory, setPostHistory] = useState<GhostwriterHistoryEntry[]>(() => getGhostwriterHistory());

  const weeklyStats = useMemo(() => getDailyStats(7), []);
  const monthlyStats = useMemo(() => getDailyStats(30), []);

  const analytics = useMemo(() => {
    const weeklyRevenue = weeklyStats.reduce((sum, day) => sum + day.estimatedRevenue, 0);
    const monthlyRevenue = monthlyStats.reduce((sum, day) => sum + day.estimatedRevenue, 0);
    const monthlyClicks = monthlyStats.reduce((sum, day) => sum + day.clicks, 0);
    const monthlyViews = monthlyStats.reduce((sum, day) => sum + day.views, 0);
    const monthlyCtr = monthlyViews > 0 ? monthlyClicks / monthlyViews : 0;

    return {
      weeklyRevenue,
      monthlyRevenue,
      monthlyClicks,
      monthlyCtr,
      payoutProgress: (monthlyRevenue / 100) * 100,
    };
  }, [weeklyStats, monthlyStats]);

  // Most dormant territory — lowest live online count; available for growth-ops recommendations
  const mostDormantTerritory = useMemo(
    () =>
      byTerritory.length > 0
        ? [...byTerritory].sort((a, b) => a.online - b.online)[0]
        : undefined,
    [byTerritory],
  );
  void mostDormantTerritory;

  const ghostwriterRevenueTrend =
    typeof window !== 'undefined'
      ? (window as { revenueAnalytics?: { revenueTrend?: number } }).revenueAnalytics?.revenueTrend
      : undefined;
  const ghostwriterPriceSignal = ghostwriterRevenueTrend ?? 0;

  const ghostwriterPost = useMemo(() => {
    const drops = predatorAlerts
      .filter((a) => a.deltaPercent < 0)
      .map((a) => ({ name: a.targetName, changePct: a.deltaPercent }));
    const increases = predatorAlerts
      .filter((a) => a.deltaPercent > 0)
      .map((a) => ({ name: a.targetName, changePct: a.deltaPercent }));
    const avgDelta =
      predatorAlerts.length > 0
        ? predatorAlerts.reduce((sum, a) => sum + a.deltaPercent, 0) / predatorAlerts.length
        : ghostwriterPriceSignal;
    const topProduct =
      predatorAlerts.length > 0 ? predatorAlerts[0].targetName : undefined;

    return generateDailyPost({
      territory: byTerritory[0]?.name ?? 'Guadeloupe',
      topCategory: byInterest[0]?.name ?? 'produits frais',
      averagePriceChangePct: avgDelta,
      notableDrops: drops,
      notableIncreases: increases,
      topProduct,
      date: new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }),
    });
  }, [byTerritory, byInterest, predatorAlerts, ghostwriterPriceSignal]);

  const audienceBriefing = useMemo(
    () =>
      buildCreatorBriefing({
        topTerritory: byTerritory[0],
        topInterest: byInterest[0],
        topTerritoryHistoricalInterest: byTerritory[0]?.topInterests[0]
          ? {
              territory: byTerritory[0].code ?? '',
              interest: byTerritory[0].topInterests[0].key,
              name: byTerritory[0].topInterests[0].name,
              emoji: byTerritory[0].topInterests[0].emoji,
              totalViews: byTerritory[0].topInterests[0].online,
            }
          : undefined,
      }),
    [byTerritory, byInterest],
  );

  const handleCopyGhostwriterPost = useCallback(() => {
    navigator.clipboard.writeText(ghostwriterPost);
    setGhostwriterCopied(true);
    setTimeout(() => setGhostwriterCopied(false), 2000);
    const entry = saveGhostwriterPost(ghostwriterPost, audienceBriefing);
    setPostHistory((prev) =>
      prev.length > 0 && prev[0].id === entry.id ? prev : [entry, ...prev].slice(0, 10),
    );
  }, [ghostwriterPost, audienceBriefing]);

  const handleScan = useCallback(async () => {
    if (typeof window === 'undefined') return;
    setPredatorScanning(true);
    try {
      const alerts = await runPredatorMonitoring();
      setPredatorAlerts(alerts);
      setPredatorLastScan(new Date().toISOString());
    } catch (error) {
      console.warn('Predator monitoring unavailable:', error);
    } finally {
      setPredatorScanning(false);
    }
  }, []);

  useEffect(() => {
    void handleScan();
  }, [handleScan]);

  if (loading) {
    return (
      <div
        data-testid="auth-loading-spinner"
        className="min-h-screen bg-slate-950 flex items-center justify-center text-white"
      >
        Initialisation...
      </div>
    );
  }

  if (!isCreator) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8">
      <Helmet>
        <title>Espace Créateur — Akiprisaye</title>
      </Helmet>
      <style>{radarStyle}</style>

      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-full border border-fuchsia-500/35 bg-slate-900/85 px-3 py-1.5 backdrop-blur-md">
        <span className="relative inline-flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-fuchsia-500" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-fuchsia-400" />
        </span>
        <span className="text-[9px] font-bold uppercase text-fuchsia-100">Predator Active</span>
      </div>

      <header className="mb-8 rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-900/20 to-slate-900 p-6 shadow-lg">
        <div className="flex items-center gap-4">
          <Crown className="text-amber-400" size={32} />
          <div>
            <h1 className="text-2xl font-black">Espace Créateur v{creatorSpaceVersion}</h1>
            <p className="text-xs text-amber-200/60 flex items-center gap-1 mt-1">
              <Clock3 size={12} /> Dernière synchro: {predatorLastScan ? new Date(predatorLastScan).toLocaleTimeString('fr-FR') : 'en attente'}
            </p>
          </div>
        </div>
      </header>

      <Suspense fallback={<CreatorSkeleton />}>
        <CreatorAudiencePanel
          ghostwriterPost={ghostwriterPost}
          audienceBriefing={audienceBriefing}
          ghostwriterCopied={ghostwriterCopied}
          onCopy={handleCopyGhostwriterPost}
          postHistory={postHistory}
        />
      </Suspense>

      <Suspense fallback={<CreatorSkeleton />}>
        <CreatorRevenuePanel
          analytics={analytics}
          totalOnline={totalOnline}
          weeklyStats={weeklyStats}
        />
      </Suspense>

      <Suspense fallback={<CreatorSkeleton />}>
        <CreatorAdminTools isAdmin={isAdmin} />
      </Suspense>

      <Suspense fallback={<CreatorSkeleton />}>
        <CreatorActivationGuide
          predatorAlerts={predatorAlerts}
          predatorScanning={predatorScanning}
          onScan={handleScan}
        />
      </Suspense>

      <div className="flex justify-center gap-8 mt-4 pt-6 border-t border-slate-800/50 pb-8">
        <Link
          to={isAdmin ? '/admin/stores' : '/mon-compte'}
          className="text-slate-500 hover:text-slate-300 hover:scale-110 transition-transform"
          aria-label={isAdmin ? 'Gestion des enseignes' : 'Mon compte'}
        >
          <Building2 size={22} />
        </Link>
        <Link
          to={isAdmin ? '/admin/calculs-batiment' : '/mon-compte'}
          className="text-slate-500 hover:text-slate-300 hover:scale-110 transition-transform"
          aria-label={isAdmin ? 'Outils BTP' : 'Mon compte'}
        >
          <Wrench size={22} />
        </Link>
        <Link to="/mon-compte" className="text-slate-500 hover:text-slate-300 hover:scale-110 transition-transform" aria-label="Mon compte">
          <Key size={22} />
        </Link>
        <button
          onClick={() => {
            if (typeof window !== 'undefined') window.location.reload();
          }}
          className="text-slate-500 hover:text-slate-300 hover:scale-110 transition-transform"
          aria-label="Rafraîchir la page"
        >
          <RefreshCw size={22} />
        </button>
      </div>
    </div>
  );
};

export default EspaceCreateur;
