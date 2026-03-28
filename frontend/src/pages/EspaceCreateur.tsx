import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Navigate } from 'react-router-dom';
import { BrainCircuit, Activity, Crown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const pulseStyle = `@keyframes predatorPulse { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 1; transform: scale(1.08); } }`;
const CREATOR_DEBUG_SESSION_KEY = 'akp_creator_debug_session';

type RevenueAnalytics = {
  monthLabel: string;
  value: number;
};

type TerritoryAudience = {
  territory: string;
  activeUsers: number;
  growthPercent: number;
};

const REVENUE_ANALYTICS_SEED: RevenueAnalytics[] = [
  { monthLabel: 'Jan', value: 1280 },
  { monthLabel: 'Fév', value: 1640 },
  { monthLabel: 'Mars', value: 2120 },
];

const TERRITORY_AUDIENCE_SEED: TerritoryAudience[] = [
  { territory: 'Guadeloupe', activeUsers: 2480, growthPercent: 12 },
  { territory: 'Martinique', activeUsers: 1720, growthPercent: 8 },
  { territory: 'Guyane', activeUsers: 940, growthPercent: 5 },
];

const EspaceCreateur: React.FC = () => {
  const { isCreator, loading } = useAuth();
  const [reloadRequestedAt, setReloadRequestedAt] = useState<number | null>(null);

  const { revenueAnalytics, territoryAudience, usingSeedData } = useMemo(() => {
    const parseArrayFromStorage = <T,>(key: string): T[] | null => {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw) as T[];
        return Array.isArray(parsed) ? parsed : null;
      } catch {
        return null;
      }
    };

    const revenueParsed = parseArrayFromStorage<RevenueAnalytics>('creator_revenue_analytics');
    const territoryParsed = parseArrayFromStorage<TerritoryAudience>('creator_territory_audience');

    const safeRevenue = Array.isArray(revenueParsed) && revenueParsed.length > 0
      ? revenueParsed
      : REVENUE_ANALYTICS_SEED;
    const safeTerritory = Array.isArray(territoryParsed) && territoryParsed.length > 0
      ? territoryParsed
      : TERRITORY_AUDIENCE_SEED;

    return {
      revenueAnalytics: safeRevenue,
      territoryAudience: safeTerritory,
      usingSeedData:
        safeRevenue === REVENUE_ANALYTICS_SEED || safeTerritory === TERRITORY_AUDIENCE_SEED,
    };
  }, [reloadRequestedAt]);

const forceReloadCreatorData = async () => {
    try {
      localStorage.removeItem('creator_revenue_analytics');
      localStorage.removeItem('creator_territory_audience');
      sessionStorage.clear();
      localStorage.removeItem(CREATOR_DEBUG_SESSION_KEY);
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
    } finally {
      setReloadRequestedAt(Date.now());
      window.location.reload();
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Chargement...</div>;
  if (!isCreator) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8">
      <style>{pulseStyle}</style>
      <Helmet><title>Espace Créateur | Ultra V3.1</title></Helmet>

      {/* Radar Predator Indicator */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-slate-900/80 border border-fuchsia-500/30 px-3 py-1.5 rounded-full backdrop-blur-md">
        <div className="relative h-3 w-3">
          <div className="absolute inset-0 bg-fuchsia-500 rounded-full animate-ping opacity-75" />
          <div className="relative h-3 w-3 bg-fuchsia-400 rounded-full" />
        </div>
        <span className="text-[10px] font-bold text-fuchsia-100 tracking-widest uppercase">Predator Active</span>
      </div>

      <header className="mb-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-500/20 rounded-2xl border border-amber-500/40">
            <Crown className="text-amber-400" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white">Tableau de Bord Ultra</h1>
            <p className="text-slate-400">Système Ghostwriter & Predator OS activés.</p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="p-6 bg-slate-900/50 rounded-3xl border border-slate-800 backdrop-blur-sm">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-fuchsia-400">
            <BrainCircuit size={20} /> Ghostwriter OS
          </h2>
          <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 text-sm italic text-slate-300">
             "Génération du post en cours... Les données sont fraîches." 🪷
          </div>
        </section>

        <section className="p-6 bg-slate-900/50 rounded-3xl border border-slate-800 backdrop-blur-sm">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-emerald-400">
            <Activity size={20} /> Predator Radar
          </h2>
          <p className="text-sm text-slate-400">Scan du marché en cours. Aucune anomalie critique détectée sur les carburants ou les produits frais.</p>
        </section>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className="p-6 bg-slate-900/50 rounded-3xl border border-slate-800 backdrop-blur-sm">
          <h2 className="text-xl font-bold mb-4 text-emerald-300">Revenus enrichis</h2>
          <div className="space-y-3">
            {revenueAnalytics.map((item) => (
              <div key={item.monthLabel} className="flex items-center justify-between rounded-xl border border-slate-700/70 bg-slate-950/70 p-3">
                <span className="text-sm text-slate-300">{item.monthLabel}</span>
                <span className="text-sm font-bold text-emerald-300">{item.value.toLocaleString('fr-FR')} €</span>
              </div>
            ))}
          </div>
        </section>

        <section className="p-6 bg-slate-900/50 rounded-3xl border border-slate-800 backdrop-blur-sm">
          <h2 className="text-xl font-bold mb-4 text-cyan-300">Audience territoire</h2>
          <div className="space-y-3">
            {territoryAudience.map((item) => (
              <div key={item.territory} className="rounded-xl border border-slate-700/70 bg-slate-950/70 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-200">{item.territory}</span>
                  <span className="text-xs text-cyan-300">+{item.growthPercent}%</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{item.activeUsers.toLocaleString('fr-FR')} actifs</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {usingSeedData && (
        <p className="mt-4 text-xs text-amber-300">
          Base vide détectée : affichage de données de secours (seed) réservé au créateur.
        </p>
      )}

      {isCreator && (
        <button
          type="button"
          onClick={forceReloadCreatorData}
          className="mt-6 rounded-xl border border-rose-400/40 bg-rose-500/20 px-5 py-3 text-xs font-black tracking-wide text-rose-100 hover:bg-rose-500/30"
        >
          FORCER LE RECHARGEMENT DES DONNÉES
        </button>
      )}
    </div>
  );
};

export default EspaceCreateur;
