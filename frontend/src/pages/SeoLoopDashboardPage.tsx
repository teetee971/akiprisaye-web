/**
 * SeoLoopDashboardPage.tsx — SEO loop analysis dashboard.
 * Route: /seo-loop-dashboard (private, noIndex)
 */

import { useState } from 'react';
import { SEOHead } from '../components/ui/SEOHead';
import { analyzeSeoLoop, type SeoLoopMetric, type SeoLoopAction, type SeoLoopActionType } from '../utils/seoLoopAnalyzer';
import { generateDuplicationSuggestions, type DuplicationSuggestion } from '../utils/seoDuplicationSuggestions';
import { SAMPLE_METRICS } from '../utils/seoIntentAnalyzer';

// Convert SearchMetric[] → SeoLoopMetric[] (filter 'other' pageType)
const seoLoopMetrics: SeoLoopMetric[] = SAMPLE_METRICS
  .filter((m) => m.pageType !== 'other')
  .map((m) => {
    const affiliateClicks = Math.floor(m.clicks * 0.1);
    return {
      url: m.url,
      title: m.title,
      pageType: m.pageType as SeoLoopMetric['pageType'],
      impressions: m.impressions,
      clicks: m.clicks,
      ctr: m.ctr,
      pageViews: m.clicks * 5,
      affiliateClicks,
      estimatedRevenue: affiliateClicks * 0.5,
      territory: 'GP',
    };
  });

const allActions: SeoLoopAction[] = analyzeSeoLoop(seoLoopMetrics);
const allSuggestions: DuplicationSuggestion[] = generateDuplicationSuggestions(seoLoopMetrics);

const ACTION_COLORS: Record<SeoLoopActionType, string> = {
  IMPROVE_TITLE: 'bg-amber-400/10 text-amber-300 border-amber-400/20',
  ENRICH_CONTENT: 'bg-blue-400/10 text-blue-300 border-blue-400/20',
  DUPLICATE_PAGE: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20',
  BOOST_CTA: 'bg-purple-400/10 text-purple-300 border-purple-400/20',
  BOOST_LINKING: 'bg-zinc-400/10 text-zinc-300 border-zinc-400/20',
  DEPRIORITIZE: 'bg-rose-400/10 text-rose-300 border-rose-400/20',
};

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-rose-400/10 text-rose-300 border-rose-400/20',
  medium: 'bg-amber-400/10 text-amber-300 border-amber-400/20',
  low: 'bg-zinc-400/10 text-zinc-300 border-zinc-400/20',
};

export default function SeoLoopDashboardPage() {
  const [pageTypeFilter, setPageTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const filteredActions = allActions.filter((a) => {
    const metric = seoLoopMetrics.find((m) => m.url === a.url);
    if (pageTypeFilter !== 'all' && metric?.pageType !== pageTypeFilter) return false;
    if (priorityFilter !== 'all' && a.priority !== priorityFilter) return false;
    return true;
  });

  const highPriority = allActions.filter((a) => a.priority === 'high').length;
  const duplicateCandidates = allSuggestions.length;
  const titlesToImprove = allActions.filter((a) => a.type === 'IMPROVE_TITLE').length;
  const revenueLinked = seoLoopMetrics.filter((m) => m.affiliateClicks > 0).length;

  return (
    <>
      <SEOHead title="SEO Loop Dashboard" description="Analyse du loop SEO et actions prioritaires." noIndex />
      <div className="min-h-screen bg-slate-950 px-4 py-8 text-zinc-100">
        <div className="mx-auto max-w-4xl space-y-8">

          <div>
            <h1 className="text-2xl font-extrabold text-white">🔄 SEO Loop Dashboard</h1>
            <p className="mt-1 text-sm text-zinc-400">Analyse des actions SEO et suggestions de duplication</p>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { label: 'Pages analysées', value: SAMPLE_METRICS.length, color: 'text-white' },
              { label: 'Actions haute priorité', value: highPriority, color: 'text-rose-400' },
              { label: 'Candidats duplication', value: duplicateCandidates, color: 'text-emerald-400' },
              { label: 'Titres à améliorer', value: titlesToImprove, color: 'text-amber-400' },
              { label: 'Liées au revenu', value: revenueLinked, color: 'text-purple-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">{label}</p>
                <p className={`mt-1 text-2xl font-extrabold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="seoloop-filter-pagetype" className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">Type de page</label>
              <select
                id="seoloop-filter-pagetype"
                value={pageTypeFilter}
                onChange={(e) => setPageTypeFilter(e.target.value)}
                className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              >
                <option value="all">Tous</option>
                {(['product', 'category', 'comparison', 'inflation', 'pillar'] as const).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="seoloop-filter-priority" className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">Priorité</label>
              <select
                id="seoloop-filter-priority"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              >
                <option value="all">Toutes</option>
                <option value="high">Haute</option>
                <option value="medium">Moyenne</option>
                <option value="low">Basse</option>
              </select>
            </div>
          </div>

          {/* Actions table */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="mb-4 text-sm font-bold text-white">Actions SEO ({filteredActions.length})</h2>
            {filteredActions.length === 0 ? (
              <p className="text-sm text-zinc-500">Aucune action correspondant aux filtres.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                      <th className="pb-2 pr-4">Type</th>
                      <th className="pb-2 pr-4">Priorité</th>
                      <th className="pb-2 pr-4">URL</th>
                      <th className="pb-2">Raison</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredActions.map((action, i) => (
                      <tr key={i} className="py-2">
                        <td className="py-2 pr-4">
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${ACTION_COLORS[action.type]}`}>
                            {action.type}
                          </span>
                        </td>
                        <td className="py-2 pr-4">
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${PRIORITY_COLORS[action.priority]}`}>
                            {action.priority}
                          </span>
                        </td>
                        <td className="py-2 pr-4 font-mono text-zinc-400">
                          {action.url.length > 40 ? `${action.url.slice(0, 40)}…` : action.url}
                        </td>
                        <td className="py-2 text-zinc-400">{action.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Duplication suggestions */}
          {allSuggestions.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="mb-4 text-sm font-bold text-white">Suggestions de duplication ({allSuggestions.length})</h2>
              <div className="space-y-2">
                {allSuggestions.map((s, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg bg-white/[0.02] p-3">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${PRIORITY_COLORS[s.priority]}`}>
                      {s.priority}
                    </span>
                    <span className="font-mono text-xs text-zinc-400">
                      {s.sourceUrl.length > 35 ? `${s.sourceUrl.slice(0, 35)}…` : s.sourceUrl}
                    </span>
                    <span className="text-xs text-zinc-600">→</span>
                    <span className="font-mono text-xs text-emerald-400">
                      {s.suggestedUrl.length > 35 ? `${s.suggestedUrl.slice(0, 35)}…` : s.suggestedUrl}
                    </span>
                    <span className="ml-auto text-xs text-zinc-500">{s.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
