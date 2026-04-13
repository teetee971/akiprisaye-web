/**
 * RevenueDashboardPage.tsx — Revenue optimization dashboard.
 * Route: /revenue-dashboard (private, noIndex)
 */

import { useState } from 'react';
import { SEOHead } from '../components/ui/SEOHead';
import { analyzeRevenueMetrics, type RevenueMetric, type RevenueAction, type RevenueActionType } from '../utils/revenueOptimizer';
import { getConversionStats } from '../utils/priceClickTracker';

const MOCK_REVENUE_METRICS: RevenueMetric[] = [
  { url: '/prix/coca-cola-guadeloupe', productName: 'Coca-Cola', retailer: 'Carrefour', pageViews: 120, affiliateClicks: 8, ctr: 0.067, estimatedRevenue: 4.0 },
  { url: '/prix/huile-tournesol-martinique', productName: 'Huile Tournesol', retailer: 'Leader Price', pageViews: 85, affiliateClicks: 3, ctr: 0.035, estimatedRevenue: 1.5 },
  { url: '/comparer/carrefour-vs-leclerc-guadeloupe', productName: 'Comparatif GP', retailer: 'Carrefour', pageViews: 200, affiliateClicks: 22, ctr: 0.11, estimatedRevenue: 11.0 },
  { url: '/guide-prix-alimentaire-dom', productName: 'Guide Prix DOM', retailer: 'multiple', pageViews: 160, affiliateClicks: 5, ctr: 0.031, estimatedRevenue: 2.5 },
  { url: '/prix/farine-ble-guyane', productName: 'Farine Blé', retailer: 'Géant Casino', pageViews: 40, affiliateClicks: 0, ctr: 0, estimatedRevenue: 0 },
];

function buildRevenueMetrics(): RevenueMetric[] {
  try {
    const stats = getConversionStats();
    if (stats.topProducts.length > 0) {
      return stats.topProducts.map((p) => ({
        url: `/prix/${p.name.toLowerCase().replace(/\s+/g, '-')}-guadeloupe`,
        productName: p.name,
        pageViews: p.views,
        affiliateClicks: p.clicks,
        ctr: p.views > 0 ? p.clicks / p.views : 0,
        estimatedRevenue: p.clicks * 0.5,
      }));
    }
  } catch {
    // fall through to mock
  }
  return MOCK_REVENUE_METRICS;
}

const revenueMetrics = buildRevenueMetrics();
const allActions: RevenueAction[] = analyzeRevenueMetrics(revenueMetrics);

const ACTION_COLORS: Record<RevenueActionType, string> = {
  BOOST_CTA: 'bg-purple-400/10 text-purple-300 border-purple-400/20',
  BOOST_RETAILER: 'bg-blue-400/10 text-blue-300 border-blue-400/20',
  TEST_VARIANT: 'bg-amber-400/10 text-amber-300 border-amber-400/20',
  PRIORITIZE_PAGE: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20',
};

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-rose-400/10 text-rose-300 border-rose-400/20',
  medium: 'bg-amber-400/10 text-amber-300 border-amber-400/20',
  low: 'bg-zinc-400/10 text-zinc-300 border-zinc-400/20',
};

export default function RevenueDashboardPage() {
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const totalRevenue = revenueMetrics.reduce((s, m) => s + m.estimatedRevenue, 0);
  const highPotential = allActions.filter((a) => a.type === 'PRIORITIZE_PAGE').length;
  const retailerBoost = allActions.filter((a) => a.type === 'BOOST_RETAILER').length;
  const needsCta = allActions.filter((a) => a.type === 'BOOST_CTA' && a.priority === 'high').length;

  const filteredActions = allActions.filter((a) =>
    typeFilter === 'all' ? true : a.type === typeFilter,
  );

  return (
    <>
      <SEOHead title="Revenue Dashboard" description="Analyse des revenus affiliés et optimisations." noIndex />
      <div className="min-h-screen bg-slate-950 px-4 py-8 text-zinc-100">
        <div className="mx-auto max-w-4xl space-y-8">

          <div>
            <h1 className="text-2xl font-extrabold text-white">💰 Revenue Dashboard</h1>
            <p className="mt-1 text-sm text-zinc-400">Revenus affiliés estimés et actions d'optimisation</p>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">Revenu estimé</p>
              <p className="mt-1 text-2xl font-extrabold text-emerald-400">{totalRevenue.toFixed(2)} €</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">Pages fort potentiel</p>
              <p className="mt-1 text-2xl font-extrabold text-white">{highPotential}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">Retailers à booster</p>
              <p className="mt-1 text-2xl font-extrabold text-blue-400">{retailerBoost}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">CTA à optimiser</p>
              <p className="mt-1 text-2xl font-extrabold text-rose-400">{needsCta}</p>
            </div>
          </div>

          {/* Filter */}
          <div className="flex flex-col gap-1">
            <label htmlFor="revenue-filter-type" className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">Type d'action</label>
            <select
              id="revenue-filter-type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-48 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-400"
            >
              <option value="all">Tous</option>
              <option value="BOOST_CTA">BOOST_CTA</option>
              <option value="BOOST_RETAILER">BOOST_RETAILER</option>
              <option value="TEST_VARIANT">TEST_VARIANT</option>
              <option value="PRIORITIZE_PAGE">PRIORITIZE_PAGE</option>
            </select>
          </div>

          {/* Actions table */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="mb-4 text-sm font-bold text-white">Actions revenue ({filteredActions.length})</h2>
            {filteredActions.length === 0 ? (
              <p className="text-sm text-zinc-500">Aucune action.</p>
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
                      <tr key={i}>
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

          {/* Top products */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="mb-4 text-sm font-bold text-white">Top produits</h2>
            <div className="space-y-2">
              {revenueMetrics
                .slice()
                .sort((a, b) => b.estimatedRevenue - a.estimatedRevenue)
                .map((m, i) => (
                  <div key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/[0.02] p-3">
                    <div>
                      <p className="text-sm font-semibold text-zinc-200">{m.productName ?? m.url}</p>
                      <p className="font-mono text-xs text-zinc-500">
                        {m.pageViews} vues · {m.affiliateClicks} clics
                      </p>
                    </div>
                    <p className="text-sm font-bold text-emerald-400">{m.estimatedRevenue.toFixed(2)} €</p>
                  </div>
                ))}
            </div>
          </div>

          {/* Retailers section */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="mb-4 text-sm font-bold text-white">Retailers</h2>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(revenueMetrics.map((m) => m.retailer).filter(Boolean))).map((r) => (
                <span key={r} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-zinc-300">
                  {r}
                </span>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
