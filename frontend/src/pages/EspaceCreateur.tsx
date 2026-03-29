import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, Navigate } from 'react-router-dom';
import {
  Activity, BarChart3, Bell, BrainCircuit, Building2, Copy, Crown,
  ExternalLink, Eye, Globe, Key, MapPinned, RefreshCw, Settings,
  Smartphone, Sparkles, Terminal, TrendingUp, Users, Wrench, CheckCircle, TrendingDown, Clock3
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getDailyStats } from '../utils/priceClickTracker';
import { generateDailyPost } from '../services/ghostwriterService';
import { getPredatorSeedAlerts, runPredatorMonitoring } from '../services/predatorService';
import { useVisitorStats } from '../hooks/useVisitorStats';
import type { InterestStats, TerritoryInterestStat, TerritoryStats } from '../hooks/useVisitorStats';

const radarStyle = `
@keyframes radarPulse { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 1; transform: scale(1.1); } }
`;

const EspaceCreateur: React.FC = () => {
  const { isCreator, loading } = useAuth();
  const { totalOnline, byTerritory, byInterest } = useVisitorStats();
  const [ghostwriterCopied, setGhostwriterCopied] = useState(false);
  const [predatorScanning, setPredatorScanning] = useState(false);
  const [predatorAlerts, setPredatorAlerts] = useState(() => getPredatorSeedAlerts());
  const [predatorLastScan, setPredatorLastScan] = useState<string | null>(null);

  const weeklyStats = useMemo(() => getDailyStats(7), []);
  const monthlyStats = useMemo(() => getDailyStats(30), []);
  const conversionStats = useMemo(() => getConversionStats(30), []);

  const revenueAnalytics = useMemo(() => {
    const weeklyRevenue = weeklyStats.reduce((sum, item) => sum + item.estimatedRevenue, 0);
    const monthlyRevenue = monthlyStats.reduce((sum, item) => sum + item.estimatedRevenue, 0);
    const weeklyClicks = weeklyStats.reduce((sum, item) => sum + item.clicks, 0);
    const monthlyClicks = monthlyStats.reduce((sum, item) => sum + item.clicks, 0);
    const weeklyViews = weeklyStats.reduce((sum, item) => sum + item.views, 0);
    const monthlyViews = monthlyStats.reduce((sum, item) => sum + item.views, 0);

    const lastWeekViews = getDailyStats(14).slice(0, 7).reduce((sum, item) => sum + item.views, 0);
    const viewsTrend = lastWeekViews > 0 ? ((weeklyViews - lastWeekViews) / lastWeekViews) * 100 : 0;

    return {
      weeklyRevenue, monthlyRevenue, weeklyClicks, monthlyClicks, weeklyViews,
      revenueTrend: weeklyStats.length >= 2 ? weeklyStats[weeklyStats.length - 1].estimatedRevenue - weeklyStats[0].estimatedRevenue : 0,
      monthlyCtr: monthlyViews > 0 ? (monthlyClicks / monthlyViews) : 0,
      viewsTrend,
      payoutProgress: (monthlyRevenue / 100) * 100, // Seuil 100€
    };
  }, [weeklyStats, monthlyStats]);

  const ghostwriterPost = useMemo(() => {
    return generateDailyPost({
      territory: byTerritory[0]?.name ?? 'Guadeloupe',
      topCategory: byInterest[0]?.name ?? 'produits frais',
      averagePriceChangePct: revenueAnalytics.revenueTrend,
    });
  }, [byTerritory, byInterest, revenueAnalytics.revenueTrend]);

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

  useEffect(() => { void handleScan(); }, [handleScan]);

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Initialisation...</div>;
  if (!isCreator) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8">
      <Helmet><title>Dashboard Ultra V3.1 — NASA Station</title></Helmet>
      <style>{predatorRadarStyle}</style>

      {/* Radar */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-full border border-fuchsia-500/35 bg-slate-900/85 px-3 py-1.5 backdrop-blur-md">
        <span className="relative inline-flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-fuchsia-500" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-fuchsia-400" />
        </span>
        <span className="text-[9px] font-bold uppercase text-fuchsia-100">Predator Active</span>
      </div>

      <header className="mb-8">
        <div className="flex items-center gap-4 rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-900/20 to-slate-900 p-6">
          <Crown className="text-amber-400" size={32} />
          <div>
            <h1 className="text-2xl font-black">STATION SPATIALE ULTRA</h1>
            <p className="text-xs text-amber-200/60 flex items-center gap-1"><Clock3 size={12}/> Dernière synchro: {new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      </header>

      {/* Ghostwriter */}
      <section className="mb-8 rounded-3xl border border-violet-500/30 bg-slate-900/50 p-6">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2"><BrainCircuit className="text-violet-400" /> Ghostwriter Social</h2>
            <button onClick={() => {navigator.clipboard.writeText(ghostwriterPost); setGhostwriterCopied(true); setTimeout(() => setGhostwriterCopied(false), 2000);}} className="text-xs bg-violet-600 px-3 py-1 rounded-lg">
                {ghostwriterCopied ? 'Copié !' : 'Copier'}
            </button>
        </div>
        <pre className="whitespace-pre-wrap text-sm text-slate-300 bg-slate-950 p-5 rounded-xl border border-slate-800">
          {ghostwriterPost}
        </pre>
      </section>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <p className="text-xs text-slate-500 uppercase">Revenu 7j</p>
          <p className="text-3xl font-black text-emerald-400">{revenueAnalytics.weeklyRevenue.toFixed(2)} €</p>
          <p className={`text-xs flex items-center gap-1 ${revenueAnalytics.revenueTrend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {revenueAnalytics.revenueTrend >= 0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
            {revenueAnalytics.revenueTrend.toFixed(2)}€ vs 7j préc.
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <p className="text-xs text-slate-500 uppercase">CTR Mensuel</p>
          <p className="text-3xl font-black text-amber-400">{(revenueAnalytics.monthlyCtr * 100).toFixed(2)}%</p>
          <p className="text-xs text-slate-400">{revenueAnalytics.monthlyClicks} clics sur 30j</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <p className="text-xs text-slate-500 uppercase">Audience Live</p>
          <p className="text-3xl font-black text-fuchsia-400">{totalOnline}</p>
          <p className={`text-xs flex items-center gap-1 ${revenueAnalytics.viewsTrend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {revenueAnalytics.viewsTrend >= 0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
            {revenueAnalytics.viewsTrend.toFixed(1)}% vues (7j)
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <p className="text-xs text-slate-500 uppercase">Prochain Paiement</p>
          <p className="text-3xl font-black text-slate-100">{revenueAnalytics.monthlyRevenue.toFixed(2)} €</p>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2"><div className="bg-emerald-500 h-1.5 rounded-full" style={{width: `${Math.min(100, revenueAnalytics.payoutProgress)}%`}}></div></div>
          <p className="text-xs text-slate-500">Seuil: 100.00 €</p>
        </div>
      </div>

      {/* Trackers Détaillés */}
      <section className="mb-8 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <h2 className="text-xl font-bold mb-5 flex items-center gap-2"><BarChart3 className="text-emerald-400" /> Trackers d'Engagement CPC</h2>
        <div className="space-y-4">
            {weeklyStats.slice().reverse().map(stat => (
                <div key={stat.date} className="grid grid-cols-4 gap-2 items-center bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <p className="text-sm font-bold text-slate-300">{new Date(stat.date).toLocaleDateString('fr-FR', {weekday: 'short', day: 'numeric'})}</p>
                    <p className="text-xs text-slate-500 text-center"><Eye size={12} className="inline"/> {stat.views} vues</p>
                    <p className="text-xs text-slate-500 text-center"><Activity size={12} className="inline"/> {stat.clicks} clics</p>
                    <p className="text-lg font-black text-emerald-400 text-right">{stat.estimatedRevenue.toFixed(2)} €</p>
                </div>
            ))}
        </div>
      </section>

      {/* Admin Tools */}
      <section className="grid gap-4 sm:grid-cols-2 mb-8">
        {[
          { to: '/admin', label: 'Dashboard Admin', icon: BarChart3, description: 'Vue globale.' },
          { to: '/admin/stores', label: 'Enseignes', icon: Building2, description: 'Base magasins.' },
          { to: '/admin/calculs-batiment', label: 'Calculs BTP', icon: Wrench, description: 'Simulateurs.' },
          { to: '/admin/users', label: 'Utilisateurs', icon: Users, description: 'Permissions.' },
        ].map(tool => (
          <Link key={tool.to} to={tool.to} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex gap-4 items-center hover:bg-slate-800 transition">
            <tool.icon className="text-blue-400" size={24} />
            <div><p className="font-bold text-slate-100">{tool.label}</p><p className="text-xs text-slate-500">{tool.description}</p></div>
          </Link>
        ))}
      </section>

      {/* Predator */}
      <section className="bg-emerald-950/20 border border-emerald-500/20 p-6 rounded-3xl">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-emerald-400"><Bell size={18} /> Alertes Predator</h3>
            <button onClick={void handleScan} disabled={predatorScanning} className="text-xs bg-emerald-700 px-3 py-1 rounded-lg flex items-center gap-1 disabled:opacity-50">
                <RefreshCw size={12} className={predatorScanning ? 'animate-spin' : ''} /> {predatorScanning ? 'Scan...' : 'Scanner'}
            </button>
        </div>
        <div className="space-y-3">
          {predatorAlerts.length === 0 && <p className="text-sm text-slate-500 text-center py-4">Aucune alerte critique détectée.</p>}
          {predatorAlerts.map(alert => (
            <div key={alert.id} className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 flex gap-3 items-center">
              <Sparkles className="text-fuchsia-400 flex-shrink-0" size={20}/>
              <div>
                <p className="text-sm font-bold text-white">{alert.targetName}</p>
                <p className="text-xs text-slate-400">{alert.message}</p>
              </div>
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
