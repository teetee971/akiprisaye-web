/**
 * GlobalDashboardPage.tsx — Global SEO & revenue metrics dashboard.
 * Route: /global-dashboard (private, noIndex)
 */

import { useState, useMemo } from 'react';
import { SEOHead } from '../components/ui/SEOHead';
import { aggregateGlobalMetrics, type GlobalPageMetric } from '../utils/globalMetricsAggregator';
import { classifyPage, getActionLabel } from '../utils/globalScore';

const allMetrics: GlobalPageMetric[] = aggregateGlobalMetrics();

type SortKey = 'globalScore' | 'ctr' | 'estimatedRevenue' | 'authorityScore';
type SortDir = 'asc' | 'desc';

const CLASSIFICATION_STYLES: Record<string, string> = {
  HIGH_VALUE: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20',
  OPPORTUNITY: 'bg-amber-400/10 text-amber-300 border-amber-400/20',
  CONVERSION_GAP: 'bg-blue-400/10 text-blue-300 border-blue-400/20',
  LOW_VALUE: 'bg-zinc-400/10 text-zinc-300 border-zinc-400/20',
};

const ROW_BG: Record<string, string> = {
  HIGH_VALUE: 'bg-emerald-400/[0.03]',
  OPPORTUNITY: 'bg-amber-400/[0.03]',
  CONVERSION_GAP: 'bg-blue-400/[0.03]',
  LOW_VALUE: '',
};

const PAGE_TYPES = ['all', 'product', 'category', 'comparison', 'inflation', 'pillar'] as const;
const TERRITORIES = ['all', 'GP', 'MQ', 'RE', 'GF', 'YT'];
const CLASSIFICATIONS = ['all', 'HIGH_VALUE', 'OPPORTUNITY', 'CONVERSION_GAP', 'LOW_VALUE'];

export default function GlobalDashboardPage() {
  const [pageTypeFilter, setPageTypeFilter] = useState<string>('all');
  const [territoryFilter, setTerritoryFilter] = useState<string>('all');
  const [classificationFilter, setClassificationFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('globalScore');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const filteredAndSorted = useMemo(() => {
    const filtered = allMetrics.filter((m) => {
      if (pageTypeFilter !== 'all' && m.pageType !== pageTypeFilter) return false;
      if (territoryFilter !== 'all' && m.territory !== territoryFilter) return false;
      if (classificationFilter !== 'all' && classifyPage(m.globalScore) !== classificationFilter)
        return false;
      return true;
    });
    return filtered.slice().sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      return sortDir === 'desc' ? bv - av : av - bv;
    });
  }, [pageTypeFilter, territoryFilter, classificationFilter, sortKey, sortDir]);

  const totalRevenue = allMetrics.reduce((s, m) => s + m.estimatedRevenue, 0);
  const highValueCount = allMetrics.filter(
    (m) => classifyPage(m.globalScore) === 'HIGH_VALUE'
  ).length;
  const needsAttention = allMetrics.filter((m) => {
    const c = classifyPage(m.globalScore);
    return c === 'LOW_VALUE' || c === 'CONVERSION_GAP';
  }).length;

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <span className="text-zinc-600"> ↕</span>;
    return <span className="text-emerald-400">{sortDir === 'desc' ? ' ↓' : ' ↑'}</span>;
  }

  return (
    <>
      <SEOHead
        title="Global Dashboard"
        description="Vue globale des métriques SEO, revenus et autorité."
        noIndex
      />
      <div className="min-h-screen bg-slate-950 px-4 py-8 text-zinc-100">
        <div className="mx-auto max-w-5xl space-y-8">
          <div>
            <h1 className="text-2xl font-extrabold text-white">🌐 Global Dashboard</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Vue agrégée : SEO, revenus, autorité et potentiel d'expansion
            </p>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                Pages totales
              </p>
              <p className="mt-1 text-2xl font-extrabold text-white">{allMetrics.length}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                HIGH_VALUE
              </p>
              <p className="mt-1 text-2xl font-extrabold text-emerald-400">{highValueCount}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                Revenu estimé
              </p>
              <p className="mt-1 text-2xl font-extrabold text-emerald-400">
                {totalRevenue.toFixed(2)} €
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                À traiter
              </p>
              <p className="mt-1 text-2xl font-extrabold text-rose-400">{needsAttention}</p>
            </div>
          </div>

          {/* Filter bar */}
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="global-filter-type"
                className="text-[10px] font-bold uppercase tracking-wide text-zinc-500"
              >
                Type
              </label>
              <select
                id="global-filter-type"
                value={pageTypeFilter}
                onChange={(e) => setPageTypeFilter(e.target.value)}
                className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              >
                {PAGE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t === 'all' ? 'Tous types' : t}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="global-filter-territory"
                className="text-[10px] font-bold uppercase tracking-wide text-zinc-500"
              >
                Territoire
              </label>
              <select
                id="global-filter-territory"
                value={territoryFilter}
                onChange={(e) => setTerritoryFilter(e.target.value)}
                className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              >
                {TERRITORIES.map((t) => (
                  <option key={t} value={t}>
                    {t === 'all' ? 'Tous territoires' : t}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="global-filter-classification"
                className="text-[10px] font-bold uppercase tracking-wide text-zinc-500"
              >
                Classification
              </label>
              <select
                id="global-filter-classification"
                value={classificationFilter}
                onChange={(e) => setClassificationFilter(e.target.value)}
                className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              >
                {CLASSIFICATIONS.map((c) => (
                  <option key={c} value={c}>
                    {c === 'all' ? 'Toutes' : c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sortable table */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="mb-4 text-sm font-bold text-white">
              Pages ({filteredAndSorted.length})
            </h2>
            {filteredAndSorted.length === 0 ? (
              <p className="text-sm text-zinc-500">Aucune page pour ces filtres.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                      <th className="pb-2 pr-3">URL</th>
                      <th
                        className="cursor-pointer pb-2 pr-3 hover:text-zinc-300"
                        onClick={() => toggleSort('globalScore')}
                      >
                        Score
                        <SortIcon k="globalScore" />
                      </th>
                      <th
                        className="cursor-pointer pb-2 pr-3 hover:text-zinc-300"
                        onClick={() => toggleSort('ctr')}
                      >
                        CTR
                        <SortIcon k="ctr" />
                      </th>
                      <th
                        className="cursor-pointer pb-2 pr-3 hover:text-zinc-300"
                        onClick={() => toggleSort('estimatedRevenue')}
                      >
                        Revenu
                        <SortIcon k="estimatedRevenue" />
                      </th>
                      <th
                        className="cursor-pointer pb-2 pr-3 hover:text-zinc-300"
                        onClick={() => toggleSort('authorityScore')}
                      >
                        Autorité
                        <SortIcon k="authorityScore" />
                      </th>
                      <th className="pb-2 pr-3">Classification</th>
                      <th className="pb-2">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredAndSorted.map((m) => {
                      const classification = classifyPage(m.globalScore);
                      const scoreColor =
                        m.globalScore > 70
                          ? 'text-emerald-400'
                          : m.globalScore > 50
                            ? 'text-amber-400'
                            : m.globalScore > 30
                              ? 'text-blue-400'
                              : 'text-zinc-400';
                      return (
                        <tr key={m.url} className={ROW_BG[classification]}>
                          <td className="py-2 pr-3 font-mono text-zinc-400">
                            {m.url.length > 35 ? `${m.url.slice(0, 35)}…` : m.url}
                          </td>
                          <td className="py-2 pr-3">
                            <div className="flex items-center gap-1.5">
                              <span className={`font-bold ${scoreColor}`}>{m.globalScore}</span>
                              <div className="h-1.5 w-10 overflow-hidden rounded-full bg-white/5">
                                <div
                                  className="h-full rounded-full bg-emerald-400"
                                  style={{ width: `${m.globalScore}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-2 pr-3 text-zinc-300">{(m.ctr * 100).toFixed(1)}%</td>
                          <td className="py-2 pr-3 text-zinc-300">
                            {m.estimatedRevenue.toFixed(2)} €
                          </td>
                          <td className="py-2 pr-3 text-zinc-300">{m.authorityScore}</td>
                          <td className="py-2 pr-3">
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${CLASSIFICATION_STYLES[classification]}`}
                            >
                              {classification}
                            </span>
                          </td>
                          <td className="py-2 text-zinc-500">{getActionLabel(classification)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
