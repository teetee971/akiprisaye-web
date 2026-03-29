import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, Navigate } from 'react-router-dom';
import {
  BarChart3, Bell, BrainCircuit, Building2, Crown,
  Key, RefreshCw, Users, Wrench
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getDailyStats } from '../utils/priceClickTracker';
import { generateDailyPost } from '../services/ghostwriterService';
import { getPredatorSeedAlerts, runPredatorMonitoring } from '../services/predatorService';
import { useVisitorStats } from '../hooks/useVisitorStats';
import type { InterestStats, TerritoryInterestStat, TerritoryStats } from '../hooks/useVisitorStats';

const predatorRadarStyle = `
@keyframes predatorPulse { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 1; transform: scale(1.1); } }
@keyframes predatorSweep { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;

type CreatorBriefingInput = {
  topTerritory?: TerritoryStats;
  topInterest?: InterestStats;
  topTerritoryHistoricalInterest?: TerritoryInterestStat;
};

const INTEREST_ALIASES: Record<string, string> = {
  scan: 'scanner',
  scanner: 'scanner',
};

function normalizeInterestKey(value?: string): string {
  const key = String(value || '').trim().toLowerCase();
  return INTEREST_ALIASES[key] ?? key;
}

export function buildCreatorBriefing({
  topTerritory,
  topInterest,
  topTerritoryHistoricalInterest,
}: CreatorBriefingInput): string {
  const liveEmoji = topInterest?.emoji ?? '📊';
  const liveName = (topInterest?.name ?? 'Prix local').toLowerCase();
  const liveKey = normalizeInterestKey(topInterest?.key);

  const historicalEmoji = topTerritoryHistoricalInterest?.emoji ?? '';
  const historicalName = (topTerritoryHistoricalInterest?.name ?? 'aucun historique dominant').toLowerCase();
  const historicalKey = normalizeInterestKey(topTerritoryHistoricalInterest?.interest);

  const sameFocus = Boolean(topTerritoryHistoricalInterest) && liveKey && liveKey === historicalKey;

  const focusLine = `Le foyer d’attention principal est ${liveEmoji} ${liveName}`;
  const territoryName = topTerritory?.name ?? 'ce territoire';

  if (!topTerritoryHistoricalInterest) {
    return `${focusLine} sur ${territoryName}, tandis que le meilleur signal historique sur ce territoire reste aucun historique dominant`;
  }

  if (sameFocus) {
    return `${focusLine} sur ${territoryName}, ce besoin confirme aussi le meilleur signal historique sur ce territoire`;
  }

  return `${focusLine} sur ${territoryName}, tandis que le meilleur signal historique sur ce territoire reste ${historicalEmoji} ${historicalName}`;
}

const EspaceCreateur: React.FC = () => {
  const { isCreator, loading } = useAuth();
  const { totalOnline, byTerritory, byInterest } = useVisitorStats();
  const [ghostwriterCopied, setGhostwriterCopied] = useState(false);
  const [predatorAlerts, setPredatorAlerts] = useState(() => getPredatorSeedAlerts());

  const weeklyStats = useMemo(() => getDailyStats(7), []);
  const monthlyStats = useMemo(() => getDailyStats(30), []);
  const revenueAnalytics = useMemo(() => {
    const weeklyRevenue = weeklyStats.reduce((sum, item) => sum + item.estimatedRevenue, 0);
    const monthlyRevenue = monthlyStats.reduce((sum, item) => sum + item.estimatedRevenue, 0);
    return {
      weeklyRevenue,
      monthlyRevenue,
      revenueTrend: weeklyStats.length >= 2 ? weeklyStats[weeklyStats.length - 1].estimatedRevenue - weeklyStats[0].estimatedRevenue : 0,
    };
  }, [weeklyStats, monthlyStats]);

  const ghostwriterPost = useMemo(() => {
    const draft = generateDailyPost({
      territory: byTerritory[0]?.name ?? 'Guadeloupe',
      topCategory: byInterest[0]?.name ?? 'Prix local',
      averagePriceChangePct: revenueAnalytics.revenueTrend,
    });
    return draft;
  }, [byTerritory, byInterest, revenueAnalytics.revenueTrend]);
  const handleCopyGhostwriterPost = () => {
    navigator.clipboard.writeText(ghostwriterPost);
    setGhostwriterCopied(true);
    setTimeout(() => setGhostwriterCopied(false), 2000);
  };

  const handleReload = () => {
    window.location.reload();
  };


  useEffect(() => {
    runPredatorMonitoring().then(setPredatorAlerts).catch(console.error);
  }, []);

  if (loading) return <div data-testid="auth-loading-spinner" className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Vérification...</div>;
  if (!isCreator) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4">
      <Helmet><title>Dashboard Ultra</title></Helmet>
      <style>{predatorRadarStyle}</style>

      {/* Badge Radar */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-full border border-fuchsia-500/35 bg-slate-900/85 px-3 py-1.5 backdrop-blur-md">
        <div className="relative h-2 w-2">
          <div className="absolute inset-0 rounded-full bg-fuchsia-500 animate-ping" />
          <div className="relative h-2 w-2 bg-fuchsia-400 rounded-full" />
        </div>
        <span className="text-[9px] font-bold uppercase text-fuchsia-100">Predator Active</span>
      </div>

      <header className="mb-6 flex items-center gap-4 p-5 bg-amber-500/10 border border-amber-500/20 rounded-3xl">
        <Crown className="text-amber-400" size={32} />
        <div><h1 className="text-xl font-black">ULTRA V3.1</h1><p className="text-[10px] text-amber-200/50">SYSTÈME RESTAURÉ</p></div>
      </header>
      <h2 className="sr-only">Espace Créateur</h2>
      <h3 className="sr-only">Tableau de bord IA — audience & comportement</h3>

      {/* Ghostwriter */}
      <section className="mb-6 rounded-3xl border border-violet-500/30 bg-slate-900/50 p-5">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-bold flex items-center gap-2"><BrainCircuit className="text-violet-400" size={18} /> Ghostwriter</h2>
          <button onClick={handleCopyGhostwriterPost} className="text-[10px] bg-violet-600 px-2 py-1 rounded-lg">
            {ghostwriterCopied ? 'Copié !' : 'Copier'}
          </button>
        </div>
        <pre className="whitespace-pre-wrap text-xs text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800">{ghostwriterPost}</pre>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
          <p className="text-[10px] text-slate-500 uppercase">Revenu 7j</p>
          <p className="text-xl font-bold text-emerald-400">{revenueAnalytics.weeklyRevenue.toFixed(2)} €</p>
        </div>
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
          <p className="text-[10px] text-slate-500 uppercase">Live</p>
          <p className="text-xl font-bold text-fuchsia-400">{totalOnline} pers.</p>
        </div>
      </div>

      <section className="order-2 md:order-1 mb-6 rounded-3xl border border-fuchsia-500/20 bg-slate-900/50 p-5">
        <h2 className="text-sm font-bold mb-3">Revenus CPC — suivi créateur</h2>
        <p className="text-[10px] text-slate-500 uppercase">Revenu 30 jours</p>
        <p className="text-lg font-bold text-fuchsia-300">{revenueAnalytics.monthlyRevenue.toFixed(2)} €</p>
      </section>

      {/* Admin Links */}
      <section className="order-1 md:order-2 mb-6">
        <h2 className="text-sm font-bold mb-3">Outils d'administration</h2>
        <p className="sr-only">Dashboard Admin</p>
        <p className="sr-only">Ouvrir</p>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link to="/admin" className="flex items-center gap-3 p-4 bg-slate-900 border border-slate-800 rounded-2xl hover:bg-slate-800">
          <BarChart3 size={20} className="text-blue-400" />
          <span className="text-sm font-bold">Admin</span>
        </Link>
        <Link to="/admin/users" className="flex items-center gap-3 p-4 bg-slate-900 border border-slate-800 rounded-2xl hover:bg-slate-800">
          <Users size={20} className="text-purple-400" />
          <span className="text-sm font-bold">Rôles</span>
        </Link>
      </div>
      </section>

      {/* Predator Radar Alerts */}
      <section className="bg-emerald-950/20 border border-emerald-500/20 p-5 rounded-3xl">
        <h3 className="text-xs font-bold mb-4 flex items-center gap-2 text-emerald-400"><Bell size={16} /> Alertes Predator</h3>
        <div className="space-y-2">
          {predatorAlerts.slice(0, 3).map(alert => (
            <div key={alert.id} className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-[11px]">
              <span className="font-bold text-white">{alert.targetName}</span>: {alert.message}
            </div>
          ))}
        </div>
      </section>

      {/* Tools Shortcut */}
      <div className="mt-6 flex justify-center gap-4">
        <Link to="/admin/stores" className="text-slate-500"><Building2 size={18} /></Link>
        <Link to="/admin/calculs-batiment" className="text-slate-500"><Wrench size={18} /></Link>
        <Link to="/mon-compte" className="text-slate-500"><Key size={18} /></Link>
        <button onClick={handleReload} className="text-slate-500"><RefreshCw size={18} /></button>
      </div>
    </div>
  );
};
export default EspaceCreateur;
