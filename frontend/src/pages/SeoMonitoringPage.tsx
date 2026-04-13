/**
 * SeoMonitoringPage.tsx — SEO performance monitoring dashboard.
 * Route: /seo-monitoring
 */

import { useState, useCallback } from 'react';
import { SEOHead } from '../components/ui/SEOHead';
import {
  SAMPLE_METRICS,
  analyzeMetrics,
  groupByAction,
  importMetricsFromJSON,
  exportRecommendationsToCSV,
  type IntentAction,
  type PageRecommendation,
  type SearchMetric,
} from '../utils/seoIntentAnalyzer';

// ── Action color map ──────────────────────────────────────────────────────────

const ACTION_COLOR: Record<IntentAction, string> = {
  IMPROVE_TITLE:   'bg-amber-400/20 text-amber-300 border-amber-400/30',
  DUPLICATE:       'bg-emerald-400/20 text-emerald-300 border-emerald-400/30',
  BOOST_LINKING:   'bg-blue-400/20 text-blue-300 border-blue-400/30',
  ENRICH_CONTENT:  'bg-violet-400/20 text-violet-300 border-violet-400/30',
  MONITOR:         'bg-zinc-400/20 text-zinc-400 border-zinc-400/30',
};

const ACTION_LABEL: Record<IntentAction, string> = {
  IMPROVE_TITLE:   'Améliorer titre',
  DUPLICATE:       'Dupliquer',
  BOOST_LINKING:   'Renforcer liens',
  ENRICH_CONTENT:  'Enrichir contenu',
  MONITOR:         'Surveiller',
};

const PRIORITY_COLOR: Record<PageRecommendation['priority'], string> = {
  high:   'bg-rose-400/20 text-rose-300 border-rose-400/30',
  medium: 'bg-amber-400/20 text-amber-300 border-amber-400/30',
  low:    'bg-zinc-400/20 text-zinc-400 border-zinc-400/30',
};

const ALL_ACTIONS: Array<IntentAction | 'ALL'> = [
  'ALL',
  'IMPROVE_TITLE',
  'DUPLICATE',
  'BOOST_LINKING',
  'ENRICH_CONTENT',
  'MONITOR',
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function SeoMonitoringPage() {
  const [metrics, setMetrics] = useState<SearchMetric[] | null>(null);
  const [activeTab, setActiveTab] = useState<IntentAction | 'ALL'>('ALL');
  const [error, setError] = useState<string | null>(null);

  const recommendations = metrics ? analyzeMetrics(metrics) : [];
  const grouped = groupByAction(recommendations);

  const filtered: PageRecommendation[] =
    activeTab === 'ALL' ? recommendations : grouped[activeTab];

  const totalImpressions = metrics
    ? metrics.reduce((s, m) => s + m.impressions, 0)
    : 0;
  const avgCtr = metrics && metrics.length > 0
    ? metrics.reduce((s, m) => s + m.ctr, 0) / metrics.length
    : 0;
  const opportunities = recommendations.filter((r) => r.priority === 'high').length;

  const handleFileImport = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const raw = JSON.parse(ev.target?.result as string);
          const imported = importMetricsFromJSON(raw);
          if (imported.length === 0) {
            setError('Aucune donnée valide trouvée dans le fichier.');
          } else {
            setMetrics(imported);
            setError(null);
          }
        } catch {
          setError('Fichier JSON invalide.');
        }
      };
      reader.readAsText(file);
    },
    []
  );

  const handleDemo = useCallback(() => {
    setMetrics(SAMPLE_METRICS);
    setError(null);
  }, []);

  const handleExport = useCallback(() => {
    if (!recommendations.length) return;
    const csv = exportRecommendationsToCSV(recommendations);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'seo-recommendations.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [recommendations]);

  return (
    <>
      <SEOHead
        title="SEO Monitoring — Pilotage des performances"
        description="Analysez vos métriques SEO par intention de recherche."
        noIndex
      />

      <div className="min-h-screen bg-slate-950 px-4 py-8 text-zinc-100">
        <div className="mx-auto max-w-5xl space-y-8">

          {/* Header */}
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              📊 SEO Monitoring
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Pilotage des performances par intention de recherche
            </p>
          </div>

          {/* Import section */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-zinc-400">
              Charger des données
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <label className="cursor-pointer rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 transition hover:border-emerald-400/30 hover:text-emerald-300">
                📂 Importer JSON
                <input
                  type="file"
                  accept=".json"
                  className="sr-only"
                  onChange={handleFileImport}
                />
              </label>
              <button
                onClick={handleDemo}
                className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-400/20"
              >
                ✨ Utiliser les données de démonstration
              </button>
              {metrics && recommendations.length > 0 && (
                <button
                  onClick={handleExport}
                  className="ml-auto rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-400 transition hover:border-white/20 hover:text-zinc-200"
                >
                  ⬇ Exporter CSV
                </button>
              )}
            </div>
            {error && (
              <p className="mt-2 text-xs text-rose-400">{error}</p>
            )}
          </div>

          {/* Empty state */}
          {!metrics && (
            <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-white/10 py-16 text-center">
              <span className="text-4xl">📈</span>
              <p className="text-zinc-400">
                Importez un fichier JSON ou chargez les données de démo pour commencer.
              </p>
              <button
                onClick={handleDemo}
                className="rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-5 py-2.5 text-sm font-bold text-emerald-300 transition hover:bg-emerald-400/20"
              >
                Charger la démo →
              </button>
            </div>
          )}

          {/* Summary cards */}
          {metrics && (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="URLs analysées" value={metrics.length} />
                <StatCard label="Total impressions" value={totalImpressions.toLocaleString('fr-FR')} />
                <StatCard label="CTR moyen" value={(avgCtr * 100).toFixed(2) + '%'} />
                <StatCard label="Opportunités HIGH" value={opportunities} accent />
              </div>

              {/* Action tabs */}
              <div className="flex flex-wrap gap-2">
                {ALL_ACTIONS.map((tab) => {
                  const count = tab === 'ALL' ? recommendations.length : grouped[tab].length;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                        activeTab === tab
                          ? tab === 'ALL'
                            ? 'border-white/20 bg-white/10 text-white'
                            : ACTION_COLOR[tab as IntentAction]
                          : 'border-white/10 bg-transparent text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {tab === 'ALL' ? `Toutes (${count})` : `${ACTION_LABEL[tab as IntentAction]} (${count})`}
                    </button>
                  );
                })}
              </div>

              {/* Recommendations table */}
              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-xs font-bold uppercase tracking-wide text-zinc-500">
                      <th className="px-4 py-3">URL</th>
                      <th className="px-4 py-3">Action</th>
                      <th className="px-4 py-3">Priorité</th>
                      <th className="px-4 py-3 text-right">Impr.</th>
                      <th className="px-4 py-3 text-right">Clics</th>
                      <th className="px-4 py-3 text-right">CTR</th>
                      <th className="px-4 py-3">Raison</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-zinc-500">
                          Aucune recommandation dans cette catégorie.
                        </td>
                      </tr>
                    )}
                    {filtered.map((rec, i) => (
                      <tr
                        key={i}
                        className="border-b border-white/5 transition hover:bg-white/[0.02]"
                      >
                        <td className="max-w-[160px] truncate px-4 py-3 font-mono text-xs text-zinc-300">
                          {rec.url}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-bold ${ACTION_COLOR[rec.action]}`}>
                            {ACTION_LABEL[rec.action]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-bold ${PRIORITY_COLOR[rec.priority]}`}>
                            {rec.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-zinc-300">
                          {rec.impressions.toLocaleString('fr-FR')}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-zinc-300">
                          {rec.clicks}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-zinc-300">
                          {(rec.ctr * 100).toFixed(1)}%
                        </td>
                        <td className="max-w-[220px] px-4 py-3 text-xs text-zinc-500">
                          {rec.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold tabular-nums ${accent ? 'text-rose-400' : 'text-white'}`}>
        {value}
      </p>
    </div>
  );
}
