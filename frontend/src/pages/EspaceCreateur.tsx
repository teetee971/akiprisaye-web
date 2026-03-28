import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, Navigate } from 'react-router-dom';
import {
  Activity, BarChart3, Bell, BrainCircuit, Building2, Copy, Crown,
  ExternalLink, Eye, Globe, Key, MapPinned, RefreshCw, Settings,
  Smartphone, Sparkles, Terminal, TrendingUp, Users, Wrench,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getConversionStats, getDailyStats } from '../utils/priceClickTracker';
import { generateDailyPost } from '../services/ghostwriterService';
import { getPredatorSeedAlerts, runPredatorMonitoring, type PredatorAlert } from '../services/predatorService';
import { useVisitorStats } from '../hooks/useVisitorStats';

const predatorRadarStyle = `
@keyframes predatorSweep { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
@keyframes predatorPulse { 0%, 100% { opacity: 0.55; transform: scale(1); } 50% { opacity: 1; transform: scale(1.12); } }
@keyframes predatorScanFlash { 0% { box-shadow: 0 0 0 0 rgba(236,72,153,0.4); } 50% { box-shadow: 0 0 0 10px rgba(236,72,153,0); } 100% { box-shadow: 0 0 0 0 rgba(236,72,153,0); } }`;

const ADMIN_TOOLS = [
  { to: '/admin', label: 'Dashboard Admin', icon: BarChart3, description: 'Vue globale des signaux plateforme.' },
  { to: '/admin/stores', label: 'Gestion des enseignes', icon: Building2, description: 'Base magasins et couverture territoriale.' },
  { to: '/admin/calculs-batiment', label: 'Calculs Bâtiment', icon: Wrench, description: 'Module technique des simulateurs BTP.' },
  { to: '/admin/users', label: 'Gestion des rôles', icon: Users, description: 'Accès, permissions et rôles créateur/admin.' },
];

const EspaceCreateur: React.FC = () => {
  const { isCreator, loading } = useAuth();
  const { totalOnline, byTerritory, byInterest, loading: visitorLoading } = useVisitorStats();
  const [ghostwriterCopied, setGhostwriterCopied] = useState(false);
  const [predatorScanning, setPredatorScanning] = useState(false);
  const [predatorAlerts, setPredatorAlerts] = useState<PredatorAlert[]>(() => getPredatorSeedAlerts());
  const [predatorLastScan, setPredatorLastScan] = useState<string | null>(null);

  const conversionStats = useMemo(() => getConversionStats(30), []);
  const weeklyStats = useMemo(() => getDailyStats(7), []);
  const monthlyStats = useMemo(() => getDailyStats(30), []);

  const revenueAnalytics = useMemo(() => {
    const weeklyRevenue = weeklyStats.reduce((sum, item) => sum + item.estimatedRevenue, 0);
    const monthlyRevenue = monthlyStats.reduce((sum, item) => sum + item.estimatedRevenue, 0);
    const weeklyClicks = weeklyStats.reduce((sum, item) => sum + item.clicks, 0);
    const monthlyClicks = monthlyStats.reduce((sum, item) => sum + item.clicks, 0);
    const weeklyViews = weeklyStats.reduce((sum, item) => sum + item.views, 0);
    const monthlyViews = monthlyStats.reduce((sum, item) => sum + item.views, 0);
    return {
      weeklyRevenue, monthlyRevenue, weeklyClicks, monthlyClicks,
      revenueTrend: weeklyStats.length >= 2 ? weeklyStats[weeklyStats.length - 1].estimatedRevenue - weeklyStats[0].estimatedRevenue : 0,
      monthlyCtr: monthlyViews > 0 ? monthlyClicks / monthlyViews : 0,
    };
  }, [weeklyStats, monthlyStats]);

  const ghostwriterPost = useMemo(() => {
    return generateDailyPost({
      territory: byTerritory[0]?.name ?? 'Antilles',
      topCategory: byInterest[0]?.name ?? 'prix',
      averagePriceChangePct: revenueAnalytics.revenueTrend,
    });
  }, [byTerritory, byInterest, revenueAnalytics.revenueTrend]);

  const handlePredatorScanNow = useCallback(async () => {
    setPredatorScanning(true);
    try {
      const nextAlerts = await runPredatorMonitoring();
      setPredatorAlerts(nextAlerts);
      setPredatorLastScan(new Date().toISOString());
    } finally { setPredatorScanning(false); }
  }, []);

  useEffect(() => { void handlePredatorScanNow(); }, [handlePredatorScanNow]);

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white text-3xl font-black animate-pulse">CHARGEMENT...</div>;
  if (!isCreator) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8">
      <Helmet><title>Dashboard Ultra V3.1</title></Helmet>
      <style>{predatorRadarStyle}</style>

      {/* Radar Indicator */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-full border border-fuchsia-500/35 bg-slate-900/85 px-3 py-1.5 backdrop-blur-md">
        <div className="relative h-3 w-3">
          <div className="absolute inset-0 rounded-full bg-fuchsia-500/60" style={{ animation: 'predatorPulse 1.8s ease-in-out infinite' }} />
          <div className="absolute inset-[1px] rounded-full border border-fuchsia-200/80" style={{ animation: 'predatorSweep 2.6s linear infinite' }} />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-fuchsia-100">Predator Active</span>
      </div>

      <header className="mb-8">
        <div className="flex items-center gap-4 rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-900/20 to-slate-900 p-6">
          <Crown className="text-amber-400" size={40} />
          <h1 className="text-2xl font-black">ESPACE CRÉATEUR ULTRA</h1>
        </div>
      </header>

      {/* Ghostwriter Section */}
      <section className="mb-8 rounded-3xl border border-violet-500/30 bg-slate-900/50 p-6">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2"><BrainCircuit className="text-violet-400" /> Ghostwriter Social</h2>
            <button onClick={() => {navigator.clipboard.writeText(ghostwriterPost); setGhostwriterCopied(true); setTimeout(() => setGhostwriterCopied(false), 2000);}} className="text-xs bg-violet-600 px-3 py-1 rounded-lg">
                {ghostwriterCopied ? 'Copié !' : 'Copier Post'}
            </button>
        </div>
        <pre className="whitespace-pre-wrap bg-slate-950 p-4 rounded-xl border border-slate-800 text-sm text-slate-300">{ghostwriterPost}</pre>
      </section>

      {/* Revenue Grid (RESTAURATION) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <p className="text-xs text-slate-500 uppercase">Revenu 7j</p>
          <p className="text-2xl font-black text-emerald-400">{revenueAnalytics.weeklyRevenue.toFixed(2)} €</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <p className="text-xs text-slate-500 uppercase">Revenu 30j</p>
          <p className="text-2xl font-black text-cyan-400">{revenueAnalytics.monthlyRevenue.toFixed(2)} €</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <p className="text-xs text-slate-500 uppercase">Audience Live</p>
          <p className="text-2xl font-black text-fuchsia-400">{totalOnline}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <p className="text-xs text-slate-500 uppercase">CTR Mensuel</p>
          <p className="text-2xl font-black text-amber-400">{(revenueAnalytics.monthlyCtr * 100).toFixed(2)}%</p>
        </div>
      </div>

      {/* Admin Tools */}
      <section className="grid gap-4 sm:grid-cols-2 mb-8">
        {ADMIN_TOOLS.map(tool => (
          <Link key={tool.to} to={tool.to} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex gap-4 items-center hover:bg-slate-800">
            <tool.icon className="text-blue-400" />
            <div>
              <p className="font-bold">{tool.label}</p>
              <p className="text-xs text-slate-500">{tool.description}</p>
            </div>
          </Link>
        ))}
      </section>

      {/* Predator Alerts */}
      <section className="bg-emerald-950/20 border border-emerald-500/20 p-6 rounded-3xl">
        <h3 className="font-bold mb-4 flex items-center gap-2"><Bell className="text-emerald-400" /> Alertes Predator</h3>
        <div className="space-y-3">
          {predatorAlerts.map(alert => (
            <div key={alert.id} className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
              <p className="text-sm font-bold text-white">{alert.targetName}</p>
              <p className="text-xs text-slate-400">{alert.message}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default EspaceCreateur;
