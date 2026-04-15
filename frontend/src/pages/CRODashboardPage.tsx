/**
 * CRODashboardPage.tsx — CRO tracking + scoring dashboard.
 * Route: /cro-dashboard (private admin, noIndex)
 *
 * Displays:
 *   - Summary cards (pages tracked, high-priority actions, weak CTA, best converters)
 *   - Action table (url, globalScore, recommendation type, priority, reason)
 *   - Filters (priority)
 */

import { useState, useMemo } from 'react';
import { SEOHead } from '../components/ui/SEOHead';
import { getCROStats, clearConversionData, getStoredBehaviorMetrics } from '../utils/conversionTracker';
import { analyzeCro } from '../utils/croAnalyzer';
import { computeAllCroScores } from '../utils/croScore';
import type { CroRecommendation } from '../../../shared/src/cro';

// ── Priority badge ────────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: CroRecommendation['priority'] }) {
  const styles: Record<CroRecommendation['priority'], string> = {
    high:   'border-rose-400/30 bg-rose-400/10 text-rose-300',
    medium: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
    low:    'border-zinc-400/20 bg-zinc-400/5 text-zinc-400',
  };
  const labels = { high: '🔴 haute', medium: '🟡 moyenne', low: '⚪ basse' };
  return (
    <span className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${styles[priority]}`}>
      {labels[priority]}
    </span>
  );
}

// ── Recommendation type label ─────────────────────────────────────────────────

function TypeLabel({ type }: { type: CroRecommendation['type'] }) {
  const map: Record<CroRecommendation['type'], string> = {
    BOOST_CTA:          '🎯 Booster CTA',
    SIMPLIFY_HERO:      '🔆 Simplifier Hero',
    BOOST_PRICE_SIGNAL: '💶 Signal Prix',
    REORDER_BLOCKS:     '↕️ Réordonner',
    DEPRIORITIZE_PAGE:  '📉 Déprioritiser',
  };
  return <span className="font-mono text-xs text-zinc-300">{map[type]}</span>;
}

// ── Score pill ────────────────────────────────────────────────────────────────

function ScorePill({ score }: { score: number }) {
  const color =
    score >= 70 ? 'text-emerald-400' :
    score >= 40 ? 'text-amber-400'   :
                  'text-rose-400';
  return <span className={`font-bold tabular-nums ${color}`}>{score}</span>;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function CRODashboardPage() {
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [stats, setStats] = useState(() => getCROStats());

  const behaviorMetrics = useMemo(() => getStoredBehaviorMetrics(), []);
  const recommendations = useMemo(() => analyzeCro(behaviorMetrics), [behaviorMetrics]);
  const scores          = useMemo(() => computeAllCroScores(behaviorMetrics), [behaviorMetrics]);

  const filtered = useMemo(
    () => priorityFilter === 'all'
      ? recommendations
      : recommendations.filter((r) => r.priority === priorityFilter),
    [recommendations, priorityFilter],
  );

  const highCount    = recommendations.filter((r) => r.priority === 'high').length;
  const weakCtaCount = recommendations.filter((r) => r.type === 'BOOST_CTA').length;
  const bestPages    = scores.slice(0, 3).map((s) => s.url);

  const topVariant = Object.entries(stats.byVariant).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
  const maxClicks  = Math.max(...Object.values(stats.byVariant), 1);

  const handleClear = () => {
    clearConversionData();
    setStats(getCROStats());
  };

  return (
    <>
      <SEOHead title="CRO Dashboard" description="Suivi des conversions et scores CRO." noIndex />
      <div className="min-h-screen bg-slate-950 px-4 py-8 text-zinc-100">
        <div className="mx-auto max-w-5xl space-y-8">

          {/* Header */}
          <div>
            <h1 className="text-2xl font-extrabold text-white">🎯 CRO Dashboard</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Analyse comportementale · Scoring SEO+CRO · Recommandations prioritaires
            </p>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">Pages suivies</p>
              <p className="mt-1 text-2xl font-extrabold text-white">{behaviorMetrics.length}</p>
            </div>
            <div className="rounded-xl border border-rose-400/20 bg-rose-400/[0.04] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">Actions haute priorité</p>
              <p className="mt-1 text-2xl font-extrabold text-rose-400">{highCount}</p>
            </div>
            <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.04] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">CTA faibles</p>
              <p className="mt-1 text-2xl font-extrabold text-amber-400">{weakCtaCount}</p>
            </div>
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.04] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">Meilleur score</p>
              <p className="mt-1 text-2xl font-extrabold text-emerald-400">
                {scores[0]?.globalScore ?? '—'}
              </p>
            </div>
          </div>

          {/* Best converting pages */}
          {bestPages.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="mb-3 text-sm font-bold text-white">🏆 Meilleures pages (score global)</h2>
              <div className="space-y-2">
                {scores.slice(0, 5).map((s) => (
                  <div key={s.url} className="flex items-center justify-between gap-3 text-xs">
                    <span className="truncate font-mono text-zinc-400">{s.url}</span>
                    <div className="flex shrink-0 items-center gap-3 text-right tabular-nums">
                      <span className="text-zinc-500">SEO <ScorePill score={s.seoScore} /></span>
                      <span className="text-zinc-500">Conv <ScorePill score={s.conversionScore} /></span>
                      <span className="font-bold text-white">∑ <ScorePill score={s.globalScore} /></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA variant bars (existing tracker) */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="mb-4 text-sm font-bold text-white">Variantes CTA (A/B/C)</h2>
            <div className="mb-2 flex gap-4 text-xs text-zinc-400">
              <span>Total clics : <strong className="text-white">{stats.totalClicks}</strong></span>
              <span>Meilleure variante : <strong className="text-emerald-400">{topVariant}</strong></span>
              <span>Taux : <strong className="text-white">{(stats.conversionRate * 100).toFixed(1)}%</strong></span>
            </div>
            <div className="space-y-3">
              {(['A', 'B', 'C'] as const).map((v) => {
                const count = stats.byVariant[v] ?? 0;
                const pct   = maxClicks > 0 ? (count / maxClicks) * 100 : 0;
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

          {/* Recommendations table */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-white">📋 Recommandations CRO ({recommendations.length})</h2>
              {/* Priority filter */}
              <div className="flex gap-2">
                {(['all', 'high', 'medium', 'low'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriorityFilter(p)}
                    className={`rounded-lg border px-3 py-1 text-[11px] font-bold transition ${
                      priorityFilter === p
                        ? 'border-white/20 bg-white/10 text-white'
                        : 'border-white/5 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {p === 'all' ? 'Toutes' : p}
                  </button>
                ))}
              </div>
            </div>

            {filtered.length === 0 ? (
              <p className="text-sm text-zinc-500">
                {behaviorMetrics.length === 0
                  ? 'Aucune donnée comportementale. Naviguez sur des pages produit pour collecter des signaux.'
                  : 'Aucune recommandation pour ce filtre.'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/5 text-[10px] uppercase tracking-wide text-zinc-500">
                      <th className="pb-2 pr-4">URL</th>
                      <th className="pb-2 pr-4">Score ∑</th>
                      <th className="pb-2 pr-4">Type</th>
                      <th className="pb-2 pr-4">Priorité</th>
                      <th className="pb-2">Raison</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {(() => {
                      const scoreByUrl = new Map<string, any>();
                      scores.forEach((s) => {
                        scoreByUrl.set(s.url, s);
                      });

                      return filtered.map((r, i) => {
                        const score = scoreByUrl.get(r.url);
                        return (
                          <tr key={i} className="align-top">
                            <td className="py-2 pr-4 font-mono text-zinc-400 max-w-[160px] truncate">{r.url}</td>
                            <td className="py-2 pr-4">
                              {score ? <ScorePill score={score.globalScore} /> : <span className="text-zinc-600">—</span>}
                            </td>
                            <td className="py-2 pr-4"><TypeLabel type={r.type} /></td>
                            <td className="py-2 pr-4"><PriorityBadge priority={r.priority} /></td>
                            <td className="py-2 text-zinc-400 max-w-[260px]">{r.reason}</td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Danger zone */}
          <button
            onClick={handleClear}
            className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-4 py-2 text-sm font-bold text-rose-300 transition hover:bg-rose-400/20"
          >
            🗑 Effacer les données CRO
          </button>

        </div>
      </div>
    </>
  );
}

