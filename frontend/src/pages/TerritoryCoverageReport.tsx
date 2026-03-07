/**
 * TerritoryCoverageReport
 *
 * Shows which territories have data, which categories are covered,
 * how many stores are represented, and how fresh the data is.
 * Derived entirely from real observatoire JSON snapshots.
 */

import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { CheckCircle, AlertCircle, Clock, Store } from 'lucide-react';
import { loadObservatoireData } from '../services/observatoireDataLoader';
import { getCategories, getEnseignes } from '../services/temporalAggregationService';
import { TERRITORIES } from '../services/territoryNormalizationService';
import { HeroImage } from '../components/ui/HeroImage';
import { getTerritoryAsset, getTerritoryGradient, PAGE_HERO_IMAGES } from '../config/imageAssets';

const ALL_TERRITORIES = TERRITORIES.filter((t) =>
  ['gp', 'mq', 'gf', 're', 'yt', 'fr', 'pm', 'nc', 'pf', 'wf', 'bl', 'mf'].includes(t.code),
);

interface TerritoryReport {
  code: string;
  label: string;
  flag: string;
  snapshotCount: number;
  latestSnapshot: string | null;
  oldestSnapshot: string | null;
  categories: string[];
  enseignes: string[];
  totalObservations: number;
  freshness: 'fresh' | 'stale' | 'missing';
}

function freshnessLabel(latest: string | null): 'fresh' | 'stale' | 'missing' {
  if (!latest) return 'missing';
  const daysSince =
    (Date.now() - new Date(latest).getTime()) / (1000 * 60 * 60 * 24);
  return daysSince <= 45 ? 'fresh' : 'stale';
}

export default function TerritoryCoverageReport() {
  const [reports, setReports] = useState<TerritoryReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all(
      ALL_TERRITORIES.map(async (t) => {
        const snaps = await loadObservatoireData(t.labelFull).catch(() => []);
        const dates = snaps.map((s) => s.date_snapshot).sort();
        const totalObs = snaps.reduce((s, snap) => s + snap.donnees.length, 0);
        const cats = getCategories(snaps);
        const ens = getEnseignes(snaps);
        const latest = dates[dates.length - 1] ?? null;

        return {
          code: t.code,
          label: t.label,
          flag: t.flag,
          snapshotCount: snaps.length,
          latestSnapshot: latest,
          oldestSnapshot: dates[0] ?? null,
          categories: cats,
          enseignes: ens,
          totalObservations: totalObs,
          freshness: freshnessLabel(latest),
        } satisfies TerritoryReport;
      }),
    ).then((results) => {
      if (!cancelled) {
        setReports(results.sort((a, b) => b.totalObservations - a.totalObservations));
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, []);

  const covered = reports.filter((r) => r.snapshotCount > 0).length;
  const freshCount = reports.filter((r) => r.freshness === 'fresh').length;
  const totalObs = reports.reduce((s, r) => s + r.totalObservations, 0);

  return (
    <>
      <Helmet>
        <title>Couverture des données territoriales — A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="État de couverture des données de prix par territoire, catégorie et enseigne."
        />
      </Helmet>

      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
        <div className="container mx-auto px-4 max-w-5xl">

          <HeroImage
            src={PAGE_HERO_IMAGES.coverage}
            alt="Carte du monde et données géographiques"
            gradient="from-slate-900 to-blue-950"
            height="h-48 sm:h-60"
            className="mb-8"
          >
            <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">
              Couverture des données territoriales
            </h1>
            <p className="text-slate-200 text-sm mt-1 drop-shadow">
              État en temps réel · Fraîcheur · Enseignes couvertes · Catégories disponibles
            </p>
          </HeroImage>

          {/* Summary */}
          {!loading && (
            <div className="mb-6 grid grid-cols-3 gap-3">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 text-center shadow-sm">
                <p className="text-2xl font-bold text-blue-600">{covered}/{ALL_TERRITORIES.length}</p>
                <p className="text-xs text-slate-500 mt-1">Territoires couverts</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 text-center shadow-sm">
                <p className="text-2xl font-bold text-green-600">{freshCount}</p>
                <p className="text-xs text-slate-500 mt-1">Données fraîches (≤ 45j)</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 text-center shadow-sm">
                <p className="text-2xl font-bold text-slate-700 dark:text-white">{totalObs.toLocaleString('fr-FR')}</p>
                <p className="text-xs text-slate-500 mt-1">Observations totales</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-24 bg-white dark:bg-slate-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((r) => {
                const terrAsset = getTerritoryAsset(r.code);
                const terrGradient = getTerritoryGradient(r.code);
                return (
                <div
                  key={r.code}
                  className={`relative overflow-hidden bg-white dark:bg-slate-800 rounded-xl p-5 border shadow-sm transition-colors
                    ${r.freshness === 'fresh' ? 'border-green-200 dark:border-green-800' :
                      r.freshness === 'stale' ? 'border-amber-200 dark:border-amber-800' :
                      'border-slate-200 dark:border-slate-700 opacity-60'}`}
                >
                  {/* Territory background image strip */}
                  <img
                    src={terrAsset.url}
                    alt={terrAsset.alt}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    className="absolute inset-0 h-full w-32 object-cover opacity-10 pointer-events-none"
                  />
                  <div className={`absolute inset-0 w-32 bg-gradient-to-r ${terrGradient} opacity-10 pointer-events-none`} />
                  <div className="relative z-10">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{r.flag}</span>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">{r.label}</h3>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <FreshnessBadge status={r.freshness} latest={r.latestSnapshot} />
                          {r.snapshotCount > 0 && (
                            <span className="text-xs text-slate-500">
                              {r.snapshotCount} snapshot{r.snapshotCount > 1 ? 's' : ''}
                              {r.oldestSnapshot && r.latestSnapshot && r.oldestSnapshot !== r.latestSnapshot
                                ? ` (${r.oldestSnapshot} → ${r.latestSnapshot})`
                                : r.latestSnapshot ? ` (${r.latestSnapshot})` : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4 text-center text-sm">
                      <div>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{r.totalObservations}</p>
                        <p className="text-xs text-slate-400">observations</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{r.categories.length}</p>
                        <p className="text-xs text-slate-400">catégories</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{r.enseignes.length}</p>
                        <p className="text-xs text-slate-400">enseignes</p>
                      </div>
                    </div>
                  </div>

                  {r.snapshotCount > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex flex-wrap gap-2">
                      {r.enseignes.map((e) => (
                        <span key={e} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          <Store className="w-3 h-3" />{e}
                        </span>
                      ))}
                    </div>
                  )}

                  {r.categories.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {r.categories.map((c) => (
                        <span key={c} className="inline-flex px-2 py-0.5 rounded text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function FreshnessBadge({ status, latest }: { status: TerritoryReport['freshness']; latest: string | null }) {
  if (status === 'fresh') return (
    <span className="inline-flex items-center gap-1 text-xs text-green-700 dark:text-green-300 font-medium">
      <CheckCircle className="w-3 h-3" /> Fraîche
    </span>
  );
  if (status === 'stale') return (
    <span className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300 font-medium">
      <Clock className="w-3 h-3" /> Ancienne ({latest})
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-medium">
      <AlertCircle className="w-3 h-3" /> Aucune donnée
    </span>
  );
}
