/**
 * CRODashboardPage.tsx — CRO tracking dashboard.
 * Route: /cro-dashboard (private, noIndex)
 */

import { useState } from 'react';
import { SEOHead } from '../components/ui/SEOHead';
import { getCROStats, clearConversionData } from '../utils/conversionTracker';

export default function CRODashboardPage() {
  const [stats, setStats] = useState(() => getCROStats());

  const topVariant = Object.entries(stats.byVariant).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
  const maxClicks = Math.max(...Object.values(stats.byVariant), 1);

  const handleClear = () => {
    clearConversionData();
    setStats(getCROStats());
  };

  return (
    <>
      <SEOHead title="CRO Dashboard" description="Suivi des conversions CTA." noIndex />
      <div className="min-h-screen bg-[#0a0a0f] px-4 py-8 text-zinc-100">
        <div className="mx-auto max-w-3xl space-y-8">
          <div>
            <h1 className="text-2xl font-extrabold text-white">🎯 CRO Dashboard</h1>
            <p className="mt-1 text-sm text-zinc-400">Analyse des variantes CTA et conversions</p>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">Total clics</p>
              <p className="mt-1 text-2xl font-extrabold text-white">{stats.totalClicks}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">Meilleure variante</p>
              <p className="mt-1 text-2xl font-extrabold text-emerald-400">{topVariant}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">Taux conversion</p>
              <p className="mt-1 text-2xl font-extrabold text-white">{(stats.conversionRate * 100).toFixed(1)}%</p>
            </div>
          </div>

          {/* Variant bars */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="mb-4 text-sm font-bold text-white">Variantes CTA</h2>
            <div className="space-y-3">
              {(['A', 'B', 'C'] as const).map((v) => {
                const count = stats.byVariant[v] ?? 0;
                const pct = maxClicks > 0 ? (count / maxClicks) * 100 : 0;
                const labels = { A: "VOIR L'OFFRE →", B: 'ÉCONOMISEZ X →', C: 'ACHETER AU MEILLEUR PRIX →' };
                return (
                  <div key={v}>
                    <div className="mb-1 flex justify-between text-xs text-zinc-400">
                      <span><span className="font-bold text-white">{v}</span> — {labels[v]}</span>
                      <span className="font-bold text-zinc-200">{count} clics</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-white/5">
                      <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top pages */}
          {stats.topPages.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="mb-3 text-sm font-bold text-white">Top 5 pages</h2>
              <div className="space-y-2">
                {stats.topPages.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="truncate font-mono text-xs text-zinc-400">{p.url}</span>
                    <span className="ml-3 shrink-0 font-bold text-zinc-200">{p.clicks}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={handleClear} className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-4 py-2 text-sm font-bold text-rose-300 transition hover:bg-rose-400/20">
            🗑 Effacer les données
          </button>
        </div>
      </div>
    </>
  );
}
