/**
 * AuthorityDashboardPage.tsx — Backlink authority dashboard.
 * Route: /authority-dashboard (private, noIndex)
 */

import { useState } from 'react';
import { SEOHead } from '../components/ui/SEOHead';
import { analyzeAuthority, computeAuthorityScore, type LinkableAsset, type AuthorityAction } from '../utils/backlinkAuthorityEngine';
import { getBacklinkStats } from '../utils/backlinkTracker';

const RAW_ASSETS: Omit<LinkableAsset, 'authorityScore'>[] = [
  { url: '/guide-prix-alimentaire-dom', title: 'Guide Prix Alimentaire DOM', pageType: 'pillar', internalLinks: 12, pageViews: 180, backlinksCount: 3, outreachStatus: 'won' },
  { url: '/comparateur-supermarches-dom', title: 'Comparateur Supermarchés DOM', pageType: 'comparison', internalLinks: 8, pageViews: 220, backlinksCount: 6, outreachStatus: 'won' },
  { url: '/inflation-alimentaire-dom', title: 'Inflation Alimentaire DOM', pageType: 'inflation', internalLinks: 9, pageViews: 160, backlinksCount: 5, outreachStatus: 'contacted' },
  { url: '/ou-faire-courses-dom', title: 'Où Faire ses Courses DOM', pageType: 'pillar', internalLinks: 7, pageViews: 140, backlinksCount: 2, outreachStatus: 'new' },
  { url: '/prix/coca-cola-1-5l-guadeloupe', title: 'Prix Coca-Cola Guadeloupe', pageType: 'product', internalLinks: 3, pageViews: 120, backlinksCount: 1, outreachStatus: 'new' },
  { url: '/prix/huile-tournesol-martinique', title: 'Prix Huile Martinique', pageType: 'product', internalLinks: 2, pageViews: 55, backlinksCount: 0, outreachStatus: 'new' },
  { url: '/comparer/carrefour-vs-leclerc-guadeloupe', title: 'Carrefour vs Leclerc GP', pageType: 'comparison', internalLinks: 6, pageViews: 200, backlinksCount: 4, outreachStatus: 'contacted' },
  { url: '/prix/farine-ble-guyane', title: 'Prix Farine Guyane', pageType: 'product', internalLinks: 1, pageViews: 30, backlinksCount: 0, outreachStatus: 'new' },
  { url: '/categorie/produits-laitiers-reunion', title: 'Produits Laitiers Réunion', pageType: 'category', internalLinks: 4, pageViews: 78, backlinksCount: 1, outreachStatus: 'new' },
  { url: '/inflation/alimentation-guadeloupe-2024', title: 'Inflation Alimentation GP 2024', pageType: 'inflation', internalLinks: 5, pageViews: 95, backlinksCount: 2, outreachStatus: 'contacted' },
];

const assets: LinkableAsset[] = RAW_ASSETS.map((a) => ({
  ...a,
  authorityScore: computeAuthorityScore(a),
}));

const allActions: AuthorityAction[] = analyzeAuthority(assets);

const OUTREACH_COLORS: Record<string, string> = {
  won: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20',
  contacted: 'bg-amber-400/10 text-amber-300 border-amber-400/20',
  new: 'bg-zinc-400/10 text-zinc-300 border-zinc-400/20',
  lost: 'bg-rose-400/10 text-rose-300 border-rose-400/20',
};

const PAGE_TYPE_COLORS: Record<string, string> = {
  pillar: 'bg-purple-400/10 text-purple-300 border-purple-400/20',
  comparison: 'bg-blue-400/10 text-blue-300 border-blue-400/20',
  inflation: 'bg-amber-400/10 text-amber-300 border-amber-400/20',
  category: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20',
  product: 'bg-zinc-400/10 text-zinc-300 border-zinc-400/20',
};

const ACTION_COLORS: Record<string, string> = {
  PROMOTE_PAGE: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20',
  OUTREACH_NOW: 'bg-rose-400/10 text-rose-300 border-rose-400/20',
  BOOST_INTERNAL_LINKING: 'bg-blue-400/10 text-blue-300 border-blue-400/20',
  STRENGTHEN_CONTENT: 'bg-zinc-400/10 text-zinc-300 border-zinc-400/20',
};

export default function AuthorityDashboardPage() {
  const [backlinkStats] = useState(() => {
    try { return getBacklinkStats(); } catch { return null; }
  });

  const topLinkable = assets.filter((a) => a.authorityScore > 60).length;
  const outreachNow = allActions.filter((a) => a.type === 'OUTREACH_NOW').length;
  const needStrengthening = allActions.filter((a) => a.type === 'STRENGTHEN_CONTENT').length;

  const actionByUrl = new Map(allActions.map((a) => [a.url, a]));

  return (
    <>
      <SEOHead title="Authority Dashboard" description="Analyse de l'autorité des pages et backlinks." noIndex />
      <div className="min-h-screen bg-slate-950 px-4 py-8 text-zinc-100">
        <div className="mx-auto max-w-4xl space-y-8">

          <div>
            <h1 className="text-2xl font-extrabold text-white">🔗 Authority Dashboard</h1>
            <p className="mt-1 text-sm text-zinc-400">Score d'autorité des pages et opportunités backlinks</p>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">Pages linkables top</p>
              <p className="mt-1 text-2xl font-extrabold text-emerald-400">{topLinkable}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">Outreach urgent</p>
              <p className="mt-1 text-2xl font-extrabold text-rose-400">{outreachNow}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">À renforcer</p>
              <p className="mt-1 text-2xl font-extrabold text-white">{needStrengthening}</p>
            </div>
          </div>

          {/* Asset cards grid */}
          <div className="grid gap-3 sm:grid-cols-2">
            {assets
              .slice()
              .sort((a, b) => b.authorityScore - a.authorityScore)
              .map((asset) => {
                const action = actionByUrl.get(asset.url);
                return (
                  <div key={asset.url} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-zinc-100">{asset.title}</p>
                        <p className="mt-0.5 font-mono text-[10px] text-zinc-500">
                          {asset.url.length > 40 ? `${asset.url.slice(0, 40)}…` : asset.url}
                        </p>
                      </div>
                      <span className="text-lg font-extrabold text-emerald-400">{asset.authorityScore}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${PAGE_TYPE_COLORS[asset.pageType] ?? ''}`}>
                        {asset.pageType}
                      </span>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${OUTREACH_COLORS[asset.outreachStatus ?? 'new'] ?? ''}`}>
                        {asset.outreachStatus ?? 'new'}
                      </span>
                      {action && (
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${ACTION_COLORS[action.type] ?? ''}`}>
                          {action.type}
                        </span>
                      )}
                    </div>
                    {/* Authority progress bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-zinc-500">
                        <span>Score autorité</span>
                        <span>{asset.authorityScore}/100</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-emerald-400 transition-all"
                          style={{ width: `${asset.authorityScore}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Backlink stats */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="mb-4 text-sm font-bold text-white">Statistiques backlinks</h2>
            {backlinkStats && backlinkStats.total > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Total', value: backlinkStats.total, color: 'text-white' },
                    { label: 'Live', value: backlinkStats.live, color: 'text-emerald-400' },
                    { label: 'En attente', value: backlinkStats.pending, color: 'text-amber-400' },
                    { label: 'Perdus', value: backlinkStats.lost, color: 'text-rose-400' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">{label}</p>
                      <p className={`text-xl font-extrabold ${color}`}>{value}</p>
                    </div>
                  ))}
                </div>
                {backlinkStats.topPages.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-bold text-zinc-400">Top pages</p>
                    <div className="space-y-1">
                      {backlinkStats.topPages.map((p, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="font-mono text-zinc-400">{p.url}</span>
                          <span className="font-bold text-zinc-200">{p.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">Aucun backlink enregistré.</p>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
