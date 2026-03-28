import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, Navigate } from 'react-router-dom';
import {
  Activity, BarChart3, Bell, BrainCircuit, Building2, Copy, Crown,
  ExternalLink, Eye, Key, RefreshCw, Sparkles, Users, Wrench
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getConversionStats, getDailyStats } from '../utils/priceClickTracker';
import { generateDailyPost } from '../services/ghostwriterService';
import { getPredatorSeedAlerts, runPredatorMonitoring } from '../services/predatorService';
import { useVisitorStats } from '../hooks/useVisitorStats';

const predatorRadarStyle = \`
@keyframes predatorSweep { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
@keyframes predatorPulse { 0%, 100% { opacity: 0.55; transform: scale(1); } 50% { opacity: 1; transform: scale(1.12); } }
@keyframes predatorScanFlash { 0% { box-shadow: 0 0 0 0 rgba(236,72,153,0.4); } 50% { box-shadow: 0 0 0 10px rgba(236,72,153,0); } 100% { box-shadow: 0 0 0 0 rgba(236,72,153,0); } }\`;

const EspaceCreateur: React.FC = () => {
  const { isCreator, loading } = useAuth();
  const { totalOnline, byTerritory, byInterest } = useVisitorStats();
  const [ghostwriterCopied, setGhostwriterCopied] = useState(false);
  const [predatorAlerts, setPredatorAlerts] = useState(() => getPredatorSeedAlerts());

  const conversionStats = useMemo(() => getConversionStats(30), []);
  const weeklyStats = useMemo(() => getDailyStats(7), []);
  const monthlyStats = useMemo(() => getDailyStats(30), []);

  const revenueAnalytics = useMemo(() => {
    const weeklyRevenue = weeklyStats.reduce((sum, item) => sum + item.estimatedRevenue, 0);
    const monthlyRevenue = monthlyStats.reduce((sum, item) => sum + item.estimatedRevenue, 0);
    const monthlyClicks = monthlyStats.reduce((sum, item) => sum + item.clicks, 0);
    const monthlyViews = monthlyStats.reduce((sum, item) => sum + item.views, 0);
    return {
      weeklyRevenue, monthlyRevenue, 
      revenueTrend: weeklyStats.length >= 2 ? weeklyStats[weeklyStats.length - 1].estimatedRevenue - weeklyStats[0].estimatedRevenue : 0,
      monthlyCtr: monthlyViews > 0 ? monthlyClicks / monthlyViews : 0,
    };
  }, [weeklyStats, monthlyStats]);

  const ghostwriterPost = useMemo(() => {
    return generateDailyPost({
      territory: byTerritory[0]?.name ?? 'Antilles',
      topCategory: byInterest[0]?.name ?? 'consommation',
      averagePriceChangePct: revenueAnalytics.revenueTrend,
    });
  }, [byTerritory, byInterest, revenueAnalytics.revenueTrend]);

  useEffect(() => {
    runPredatorMonitoring().then(setPredatorAlerts).catch(console.error);
  }, []);

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Authentification...</div>;
  if (!isCreator) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4">
      <Helmet><title>Dashboard Ultra</title></Helmet>
      <style>{predatorRadarStyle}</style>

      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-full border border-fuchsia-500/35 bg-slate-900/85 px-3 py-1.5 backdrop-blur-md">
        <div className="relative h-2 w-2">
          <div className="absolute inset-0 rounded-full bg-fuchsia-500 animate-ping" />
          <div className="relative h-2 w-2 bg-fuchsia-400 rounded-full" />
        </div>
        <span className="text-[9px] font-bold uppercase tracking-widest text-fuchsia-100">Predator Active</span>
      </div>

      <header className="mb-6 flex items-center gap-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
        <Crown className="text-amber-400" />
        <h1 className="text-xl font-black">ULTRA V3.1</h1>
      </header>

      <section className="mb-6 rounded-2xl border border-violet-500/30 bg-slate-900/50 p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-bold flex items-center gap-2"><BrainCircuit size={16} /> Ghostwriter</h2>
          <button onClick={() => {navigator.clipboard.writeText(ghostwriterPost); setGhostwriterCopied(true); setTimeout(() => setGhostwriterCopied(false), 2000);}} className="text-[10px] bg-violet-600 px-2 py-1 rounded">
            {ghostwriterCopied ? 'Copié' : 'Copier'}
          </button>
        </div>
        <pre className="whitespace-pre-wrap text-xs text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800">{ghostwriterPost}</pre>
      </section>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
          <p className="text-[10px] text-slate-500 uppercase">Revenu 7j</p>
          <p className="text-lg font-bold text-emerald-400">{revenueAnalytics.weeklyRevenue.toFixed(2)}€</p>
        </div>
        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
          <p className="text-[10px] text-slate-500 uppercase">Audience Live</p>
          <p className="text-lg font-bold text-fuchsia-400">{totalOnline}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link to="/admin" className="flex items-center gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800">
          <BarChart3 size={18} className="text-blue-400" />
          <span className="text-sm font-bold">Admin</span>
        </Link>
        <Link to="/admin/users" className="flex items-center gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800">
          <Users size={18} className="text-purple-400" />
          <span className="text-sm font-bold">Users</span>
        </Link>
      </div>

      <section className="bg-emerald-950/20 border border-emerald-500/20 p-4 rounded-2xl">
        <h3 className="text-xs font-bold mb-3 flex items-center gap-2"><Bell size={14} className="text-emerald-400" /> Predator Radar</h3>
        <div className="space-y-2">
          {predatorAlerts.slice(0, 3).map(alert => (
            <div key={alert.id} className="bg-slate-950/40 p-2 rounded-lg text-[11px] border border-slate-800">
              <span className="font-bold text-white">{alert.targetName}</span>: {alert.message}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
export default EspaceCreateur;
