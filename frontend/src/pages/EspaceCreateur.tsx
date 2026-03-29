import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, Navigate } from 'react-router-dom';
import { BarChart3, Bell, BrainCircuit, Building2, Clock3, Crown, RefreshCw, Wrench, Users, Key } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getDailyStats } from '../utils/priceClickTracker';
import { generateDailyPost } from '../services/ghostwriterService';
import { getPredatorSeedAlerts, runPredatorMonitoring } from '../services/predatorService';
import { useVisitorStats } from '../hooks/useVisitorStats';
import type { InterestStats, TerritoryInterestStat, TerritoryStats } from '../hooks/useVisitorStats';

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
  const { isCreator, loading } = useAuth();
  const { totalOnline, byTerritory, byInterest } = useVisitorStats();

  const [ghostwriterCopied, setGhostwriterCopied] = useState(false);
  const [predatorScanning, setPredatorScanning] = useState(false);
  const [predatorAlerts, setPredatorAlerts] = useState(() => getPredatorSeedAlerts());
  const [predatorLastScan, setPredatorLastScan] = useState<string | null>(null);

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

  const ghostwriterPost = useMemo(() => (
    generateDailyPost({
      territory: byTerritory[0]?.name ?? 'Guadeloupe',
      topCategory: byInterest[0]?.name ?? 'produits frais',
      averagePriceChangePct: analytics.monthlyCtr * 100,
    })
  ), [byTerritory, byInterest, analytics.monthlyCtr]);

  const handleCopyGhostwriterPost = useCallback(() => {
    navigator.clipboard.writeText(ghostwriterPost);
    setGhostwriterCopied(true);
    setTimeout(() => setGhostwriterCopied(false), 2000);
  }, [ghostwriterPost]);

  const handleScan = useCallback(async () => {
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
            <h1 className="text-2xl font-black">Espace Créateur V3.1</h1>
            <p className="text-xs text-amber-200/60 flex items-center gap-1 mt-1">
              <Clock3 size={12} /> Dernière synchro: {predatorLastScan ? new Date(predatorLastScan).toLocaleTimeString('fr-FR') : 'en attente'}
            </p>
          </div>
        </div>
      </header>

      <section className="mb-8 rounded-3xl border border-violet-500/30 bg-slate-900/50 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <BrainCircuit className="text-violet-400" /> Ghostwriter Social
          </h2>
          <button
            type="button"
            onClick={handleCopyGhostwriterPost}
            className="text-xs bg-violet-600 px-3 py-2 rounded-lg font-bold hover:bg-violet-500 transition"
          >
            {ghostwriterCopied ? 'Copié !' : 'Copier le texte'}
          </button>
        </div>
        <pre className="whitespace-pre-wrap text-sm text-slate-300 bg-slate-950 p-5 rounded-xl border border-slate-800">
          {ghostwriterPost}
        </pre>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <article className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-md">
          <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Revenu 7j</p>
          <p className="text-3xl font-black text-emerald-400 mt-2">{analytics.weeklyRevenue.toFixed(2)} €</p>
        </article>
        <article className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-md">
          <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">CTR mensuel</p>
          <p className="text-3xl font-black text-amber-400 mt-2">{(analytics.monthlyCtr * 100).toFixed(2)}%</p>
        </article>
        <article className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-md">
          <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Audience live</p>
          <p className="text-3xl font-black text-fuchsia-400 mt-2">{totalOnline}</p>
        </article>
        <article className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-md">
          <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Paiement estimé</p>
          <p className="text-3xl font-black text-slate-100 mt-2">{analytics.monthlyRevenue.toFixed(2)} €</p>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-4">
            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, analytics.payoutProgress)}%` }} />
          </div>
        </article>
      </section>

      <section className="order-2 md:order-1 mb-8 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <BarChart3 className="text-emerald-400" /> Trackers d'engagement CPC
            </h2>
            <p className="text-sm text-slate-400 mt-1">Gains sur les 30 derniers jours : <strong className="text-white">{analytics.monthlyRevenue.toFixed(2)} €</strong></p>
          </div>
        </div>

        <div className="space-y-3">
          {weeklyStats.slice().reverse().map((stat) => (
            <div key={stat.date} className="flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition">
              <p className="text-sm font-bold text-slate-300 w-24">
                {new Date(stat.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}
              </p>
              <div className="flex gap-4 text-xs text-slate-500">
                <span className="w-16 text-right">{stat.views} vues</span>
                <span className="w-16 text-right">{stat.clicks} clics</span>
              </div>
              <p className="text-lg font-black text-emerald-400 w-20 text-right">{stat.estimatedRevenue.toFixed(2)} €</p>
            </div>
          ))}
        </div>
      </section>

      <section className="order-1 md:order-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <h2 className="sr-only">Outils d'administration</h2>
        <Link to="/admin" className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex gap-4 items-center hover:bg-slate-800 transition shadow-sm">
          <BarChart3 className="text-blue-400" size={24} />
          <span className="font-bold">Admin Global</span>
        </Link>
        <Link to="/admin/stores" className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex gap-4 items-center hover:bg-slate-800 transition shadow-sm">
          <Building2 className="text-emerald-400" size={24} />
          <span className="font-bold">Enseignes</span>
        </Link>
        <Link to="/admin/calculs-batiment" className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex gap-4 items-center hover:bg-slate-800 transition shadow-sm">
          <Wrench className="text-amber-400" size={24} />
          <span className="font-bold">Calculs BTP</span>
        </Link>
        <Link to="/admin/users" className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex gap-4 items-center hover:bg-slate-800 transition shadow-sm">
          <Users className="text-purple-400" size={24} />
          <span className="font-bold">Utilisateurs</span>
        </Link>
      </section>

      <section className="bg-emerald-950/20 border border-emerald-500/20 p-6 rounded-3xl mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2 text-emerald-400">
            <Bell size={18} /> Alertes Predator
          </h3>
          <button
            type="button"
            onClick={() => { void handleScan(); }}
            disabled={predatorScanning}
            className="text-xs bg-emerald-700 px-4 py-2 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50 hover:bg-emerald-600 transition"
          >
            <RefreshCw size={14} className={predatorScanning ? 'animate-spin' : ''} />
            {predatorScanning ? 'Analyse en cours...' : 'Scanner le marché'}
          </button>
        </div>

        <div className="space-y-3">
          {predatorAlerts.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-6 border border-dashed border-slate-800 rounded-xl">Aucune alerte critique détectée sur le marché.</p>
          )}
          {predatorAlerts.map((alert) => (
            <div key={alert.id} className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <p className="text-sm font-bold text-white">{alert.targetName}</p>
              <p className="text-xs text-slate-400">{alert.message}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-center gap-8 mt-4 pt-6 border-t border-slate-800/50 pb-8">
        <Link to="/admin/stores" className="text-slate-500 hover:text-slate-300 hover:scale-110 transition-transform" aria-label="Gestion des enseignes">
          <Building2 size={22} />
        </Link>
        <Link to="/admin/calculs-batiment" className="text-slate-500 hover:text-slate-300 hover:scale-110 transition-transform" aria-label="Outils BTP">
          <Wrench size={22} />
        </Link>
        <Link to="/mon-compte" className="text-slate-500 hover:text-slate-300 hover:scale-110 transition-transform" aria-label="Mon compte">
          <Key size={22} />
        </Link>
        <button onClick={() => window.location.reload()} className="text-slate-500 hover:text-slate-300 hover:scale-110 transition-transform" aria-label="Rafraîchir la page">
          <RefreshCw size={22} />
        </button>
      </div>
    </div>
  );
};

export default EspaceCreateur;
