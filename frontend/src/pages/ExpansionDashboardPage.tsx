/**
 * ExpansionDashboardPage.tsx — Territory expansion dashboard.
 * Route: /expansion-dashboard (private, noIndex)
 */

import { useState } from 'react';
import { SEOHead } from '../components/ui/SEOHead';
import {
  generateExpansionSuggestions,
  type ExpansionCandidate,
  type ExpansionSuggestion,
} from '../utils/expansionPlanner';
import {
  generateDuplicationSuggestions,
  type DuplicationSuggestion,
} from '../utils/seoDuplicationSuggestions';
import { type SeoLoopMetric } from '../utils/seoLoopAnalyzer';
import { SAMPLE_METRICS } from '../utils/seoIntentAnalyzer';

// Convert SearchMetric[] → ExpansionCandidate[]
const expansionCandidates: ExpansionCandidate[] = SAMPLE_METRICS.map((m) => ({
  sourceUrl: m.url,
  pageType: m.pageType === 'other' ? 'product' : m.pageType,
  territory: 'GP',
  productName: m.title,
  performanceScore: Math.min(Math.round(m.ctr * 1500 + m.clicks * 2), 100),
}));

// Convert SearchMetric[] → SeoLoopMetric[] for duplication suggestions
const seoLoopMetrics: SeoLoopMetric[] = SAMPLE_METRICS.filter((m) => m.pageType !== 'other').map(
  (m) => ({
    url: m.url,
    title: m.title,
    pageType: m.pageType as SeoLoopMetric['pageType'],
    impressions: m.impressions,
    clicks: m.clicks,
    ctr: m.ctr,
    pageViews: m.clicks * 5,
    affiliateClicks: Math.floor(m.clicks * 0.1),
    estimatedRevenue: 0,
    territory: 'GP',
  })
);

const allSuggestions: ExpansionSuggestion[] = generateExpansionSuggestions(expansionCandidates);
const dupSuggestions: DuplicationSuggestion[] = generateDuplicationSuggestions(seoLoopMetrics);

const TERRITORIES = ['all', 'GP', 'MQ', 'RE', 'GF', 'YT'];

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-rose-400/10 text-rose-300 border-rose-400/20',
  medium: 'bg-amber-400/10 text-amber-300 border-amber-400/20',
  low: 'bg-zinc-400/10 text-zinc-300 border-zinc-400/20',
};

export default function ExpansionDashboardPage() {
  const [territoryFilter, setTerritoryFilter] = useState<string>('all');

  const filtered = allSuggestions.filter((s) =>
    territoryFilter === 'all' ? true : s.targetTerritory === territoryFilter
  );

  const highCount = allSuggestions.filter((s) => s.priority === 'high').length;

  return (
    <>
      <SEOHead
        title="Expansion Dashboard"
        description="Suggestions d'expansion territoriale SEO."
        noIndex
      />
      <div className="min-h-screen bg-slate-950 px-4 py-8 text-zinc-100">
        <div className="mx-auto max-w-4xl space-y-8">
          <div>
            <h1 className="text-2xl font-extrabold text-white">🗺️ Expansion Dashboard</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Opportunités d'expansion territoriale et duplication
            </p>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                Candidats analysés
              </p>
              <p className="mt-1 text-2xl font-extrabold text-white">
                {expansionCandidates.length}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                Suggestions expansion
              </p>
              <p className="mt-1 text-2xl font-extrabold text-emerald-400">
                {allSuggestions.length}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                Haute priorité
              </p>
              <p className="mt-1 text-2xl font-extrabold text-rose-400">{highCount}</p>
            </div>
          </div>

          {/* Territory filter */}
          <div className="flex flex-wrap gap-2">
            {TERRITORIES.map((t) => (
              <button
                key={t}
                onClick={() => setTerritoryFilter(t)}
                className={`rounded-full border px-3 py-1 text-xs font-bold transition ${
                  territoryFilter === t
                    ? 'border-emerald-400 bg-emerald-400/10 text-emerald-300'
                    : 'border-white/10 bg-white/[0.03] text-zinc-400 hover:border-emerald-400/40 hover:text-emerald-300'
                }`}
              >
                {t === 'all' ? 'Tous' : t}
              </button>
            ))}
          </div>

          {/* Expansion suggestions table */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="mb-4 text-sm font-bold text-white">
              Suggestions d'expansion ({filtered.length})
            </h2>
            {filtered.length === 0 ? (
              <p className="text-sm text-zinc-500">Aucune suggestion pour ce territoire.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                      <th className="pb-2 pr-4">Source</th>
                      <th className="pb-2 pr-4">Suggestion</th>
                      <th className="pb-2 pr-4">Territoire</th>
                      <th className="pb-2 pr-4">Priorité</th>
                      <th className="pb-2">Raison</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filtered.map((s, i) => (
                      <tr key={i}>
                        <td className="py-2 pr-4 font-mono text-zinc-400">
                          {s.sourceUrl.length > 30 ? `${s.sourceUrl.slice(0, 30)}…` : s.sourceUrl}
                        </td>
                        <td className="py-2 pr-4 font-mono text-emerald-400">
                          {s.suggestedUrl.length > 30
                            ? `${s.suggestedUrl.slice(0, 30)}…`
                            : s.suggestedUrl}
                        </td>
                        <td className="py-2 pr-4">
                          <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] font-bold text-zinc-300">
                            {s.targetTerritory ?? '—'}
                          </span>
                        </td>
                        <td className="py-2 pr-4">
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${PRIORITY_COLORS[s.priority]}`}
                          >
                            {s.priority}
                          </span>
                        </td>
                        <td className="py-2 text-zinc-500">{s.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Duplication suggestions */}
          {dupSuggestions.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="mb-4 text-sm font-bold text-white">
                Suggestions de duplication ({dupSuggestions.length})
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                      <th className="pb-2 pr-4">Source</th>
                      <th className="pb-2 pr-4">URL suggérée</th>
                      <th className="pb-2 pr-4">Priorité</th>
                      <th className="pb-2">Raison</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {dupSuggestions.map((s, i) => (
                      <tr key={i}>
                        <td className="py-2 pr-4 font-mono text-zinc-400">
                          {s.sourceUrl.length > 30 ? `${s.sourceUrl.slice(0, 30)}…` : s.sourceUrl}
                        </td>
                        <td className="py-2 pr-4 font-mono text-emerald-400">
                          {s.suggestedUrl.length > 30
                            ? `${s.suggestedUrl.slice(0, 30)}…`
                            : s.suggestedUrl}
                        </td>
                        <td className="py-2 pr-4">
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${PRIORITY_COLORS[s.priority]}`}
                          >
                            {s.priority}
                          </span>
                        </td>
                        <td className="py-2 text-zinc-500">{s.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
