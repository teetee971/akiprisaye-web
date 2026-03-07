/**
 * InflationRateTracker
 *
 * Innovative page: computes and visualises month-over-month (MoM) and
 * year-over-year (YoY) inflation rates per product category and territory,
 * derived entirely from real observatoire JSON snapshots.
 *
 * No mocks, no random data — every figure comes from the actual price files.
 */

import { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { TrendingUp, TrendingDown, Minus, Info, BarChart2 } from 'lucide-react';
import { loadObservatoireData } from '../services/observatoireDataLoader';
import {
  buildMonthlyAggregates,
  getCategories,
  type MonthlyAggregate,
} from '../services/temporalAggregationService';
import { TERRITORIES } from '../services/territoryNormalizationService';
import { HeroImage } from '../components/ui/HeroImage';
import { CategoryIcon } from '../components/ui/CategoryIcon';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

// ─── Config ───────────────────────────────────────────────────────────────────

const INFLATION_TERRITORIES = TERRITORIES.filter((t) =>
  ['gp', 'mq', 'gf', 're', 'yt', 'fr'].includes(t.code),
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface CategoryInflation {
  category: string;
  territory: string;
  territoryFlag: string;
  /** Sorted monthly average prices */
  months: { month: string; avgPrice: number }[];
  /** Month-over-month change from second-to-last to last month */
  momPct: number | null;
  /** Year-over-year: same month last year vs latest */
  yoyPct: number | null;
  trend: 'up' | 'down' | 'stable';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function r2(n: number) { return Math.round(n * 100) / 100; }

function pctChange(oldVal: number, newVal: number): number {
  if (oldVal <= 0) return 0;
  return r2(((newVal - oldVal) / oldVal) * 100);
}

function trend(pct: number | null): 'up' | 'down' | 'stable' {
  if (pct == null) return 'stable';
  if (pct > 0.5) return 'up';
  if (pct < -0.5) return 'down';
  return 'stable';
}

function trendIcon(t: 'up' | 'down' | 'stable', pct: number | null) {
  const label = pct != null ? `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%` : '—';
  if (t === 'up') return (
    <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold text-sm">
      <TrendingUp className="w-4 h-4" />{label}
    </span>
  );
  if (t === 'down') return (
    <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold text-sm">
      <TrendingDown className="w-4 h-4" />{label}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 text-sm">
      <Minus className="w-4 h-4" />{label}
    </span>
  );
}

// ─── Build category-level inflation from monthly aggregates ───────────────────

function buildCategoryInflation(
  monthly: MonthlyAggregate[],
  territoryFlag: string,
): CategoryInflation[] {
  // Group by (territory, category)
  const map = new Map<string, { prices: Map<string, number[]>; territory: string }>();
  for (const m of monthly) {
    const key = `${m.territory}||${m.category}`;
    if (!map.has(key)) map.set(key, { prices: new Map(), territory: m.territory });
    const entry = map.get(key)!;
    const existing = entry.prices.get(m.month) ?? [];
    // Each monthly entry already has an averaged price; collect for category-level avg
    existing.push(m.avgPrice);
    entry.prices.set(m.month, existing);
  }

  return Array.from(map.entries()).map(([key, val]) => {
    const [, category] = key.split('||');
    const sortedMonths = Array.from(val.prices.entries())
      .map(([month, prices]) => ({
        month,
        avgPrice: r2(prices.reduce((s, p) => s + p, 0) / prices.length),
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const last = sortedMonths[sortedMonths.length - 1];
    const secondLast = sortedMonths[sortedMonths.length - 2];
    const sameMonthLastYear = last
      ? sortedMonths.find((m) => {
          const lastYear = `${parseInt(last.month.slice(0, 4)) - 1}-${last.month.slice(5, 7)}`;
          return m.month === lastYear;
        })
      : undefined;

    const momPct =
      last && secondLast ? pctChange(secondLast.avgPrice, last.avgPrice) : null;
    const yoyPct =
      last && sameMonthLastYear
        ? pctChange(sameMonthLastYear.avgPrice, last.avgPrice)
        : null;

    return {
      category,
      territory: val.territory,
      territoryFlag,
      months: sortedMonths,
      momPct,
      yoyPct,
      trend: trend(momPct),
    };
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function InflationRateTracker() {
  const [allData, setAllData] = useState<CategoryInflation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedTerritory, setSelectedTerritory] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState<'mom' | 'yoy' | 'territory' | 'category'>('mom');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all(
      INFLATION_TERRITORIES.map(async (t) => {
        const snaps = await loadObservatoireData(t.labelFull).catch(() => []);
        if (snaps.length === 0) return [];
        const monthly = buildMonthlyAggregates(snaps);
        return buildCategoryInflation(monthly, t.flag);
      }),
    )
      .then((results) => {
        if (cancelled) return;
        setAllData(results.flat());
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) { setError(true); setLoading(false); }
      });

    return () => { cancelled = true; };
  }, []);

  const territories = useMemo(
    () => [...new Set(allData.map((d) => d.territory))].sort(),
    [allData],
  );
  const categories = useMemo(
    () => [...new Set(allData.map((d) => d.category))].sort(),
    [allData],
  );

  const filtered = useMemo(() => {
    let rows = allData;
    if (selectedTerritory) rows = rows.filter((d) => d.territory === selectedTerritory);
    if (selectedCategory) rows = rows.filter((d) => d.category === selectedCategory);

    return [...rows].sort((a, b) => {
      if (sortBy === 'mom') return (b.momPct ?? -999) - (a.momPct ?? -999);
      if (sortBy === 'yoy') return (b.yoyPct ?? -999) - (a.yoyPct ?? -999);
      if (sortBy === 'territory') return a.territory.localeCompare(b.territory, 'fr');
      return a.category.localeCompare(b.category, 'fr');
    });
  }, [allData, selectedTerritory, selectedCategory, sortBy]);

  // Summary stats
  const avgMoM = useMemo(() => {
    const valid = filtered.filter((d) => d.momPct != null);
    if (!valid.length) return null;
    return r2(valid.reduce((s, d) => s + d.momPct!, 0) / valid.length);
  }, [filtered]);

  const hottest = useMemo(
    () => filtered.filter((d) => d.momPct != null).sort((a, b) => b.momPct! - a.momPct!).slice(0, 3),
    [filtered],
  );

  return (
    <>
      <Helmet>
        <title>Suivi inflation par catégorie — A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Taux d'inflation mensuel et annuel par catégorie de produit et par territoire DROM-COM, calculé sur les relevés de prix réels."
        />
      </Helmet>

      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
        <div className="container mx-auto px-4 max-w-5xl">

          {/* Hero */}
          <HeroImage
            src={PAGE_HERO_IMAGES.inflation}
            alt="Graphiques financiers et évolution des prix"
            gradient="from-red-900 to-slate-950"
            height="h-48 sm:h-60"
            className="mb-8"
          >
            <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-red-300" />
              Suivi de l'inflation par catégorie
            </h1>
            <p className="text-red-100 text-sm mt-1 drop-shadow">
              Taux MoM &amp; YoY calculés sur les relevés citoyens réels · Aucune donnée fictive
            </p>
          </HeroImage>

          <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>MoM</strong> = variation mensuelle (mois précédent → dernier mois disponible).{' '}
                <strong>YoY</strong> = variation annuelle (même mois l'an dernier → dernier mois).
                Le YoY n'est affiché que lorsque les deux périodes sont couvertes par les données.
              </p>
            </div>
          </div>

          {/* Summary cards */}
          {!loading && !error && filtered.length > 0 && (
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
                <p className="text-xs text-slate-500 mb-1">Inflation MoM moyenne</p>
                <p className={`text-2xl font-bold ${avgMoM != null && avgMoM > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                  {avgMoM != null ? `${avgMoM > 0 ? '+' : ''}${avgMoM.toFixed(2)}%` : '—'}
                </p>
              </div>
              {hottest.slice(0, 2).map((d) => (
                <div key={`${d.territory}-${d.category}`} className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800 shadow-sm">
                  <p className="text-xs text-red-700 dark:text-red-300 mb-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Hausse notable
                  </p>
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">{d.category}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{d.territoryFlag} {d.territory}</p>
                  <p className="text-red-600 dark:text-red-400 font-bold text-sm mt-1">
                    +{d.momPct?.toFixed(1)}% MoM
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Filters + sort */}
          <div className="mb-4 flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Territoire</label>
              <select
                value={selectedTerritory}
                onChange={(e) => setSelectedTerritory(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200"
              >
                <option value="">Tous</option>
                {territories.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Catégorie</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200"
              >
                <option value="">Toutes</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Trier par</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200"
              >
                <option value="mom">Inflation MoM ↓</option>
                <option value="yoy">Inflation YoY ↓</option>
                <option value="territory">Territoire A→Z</option>
                <option value="category">Catégorie A→Z</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow animate-pulse">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-10 bg-slate-100 dark:bg-slate-700 rounded mb-2" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12 text-slate-500">Données indisponibles</div>
          ) : filtered.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-700">
              <BarChart2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Aucune donnée pour ces filtres</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900/50">
                    <tr className="text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left px-4 py-3">Territoire</th>
                      <th className="text-left px-4 py-3">Catégorie</th>
                      <th className="text-right px-4 py-3">Dernier prix moy.</th>
                      <th className="text-right px-4 py-3">MoM</th>
                      <th className="text-right px-4 py-3">YoY</th>
                      <th className="text-left px-4 py-3 hidden sm:table-cell">Historique</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((row) => {
                      const latest = row.months[row.months.length - 1];
                      return (
                        <tr
                          key={`${row.territory}-${row.category}`}
                          className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="mr-1">{row.territoryFlag}</span>
                            <span className="text-slate-700 dark:text-slate-300">{row.territory}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                            <CategoryIcon category={row.category} size="sm" className="mr-2 inline-block align-middle" />
                            {row.category}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-white">
                            {latest ? `${latest.avgPrice.toFixed(2)} €` : '—'}
                            {latest && <span className="block text-xs font-normal text-slate-400">{latest.month}</span>}
                          </td>
                          <td className="px-4 py-3 text-right">{trendIcon(row.trend, row.momPct)}</td>
                          <td className="px-4 py-3 text-right">
                            {row.yoyPct != null
                              ? trendIcon(trend(row.yoyPct), row.yoyPct)
                              : <span className="text-slate-300 dark:text-slate-600 text-xs">Données insuffisantes</span>}
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <MiniSparkline months={row.months} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-400">
                Source : relevés citoyens · {filtered.length} lignes · Calculs sur prix moyens par catégorie/mois
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Mini sparkline (SVG, no library) ────────────────────────────────────────

function MiniSparkline({ months }: { months: { month: string; avgPrice: number }[] }) {
  if (months.length < 2) return <span className="text-xs text-slate-300">—</span>;

  const W = 80;
  const H = 24;
  const prices = months.map((m) => m.avgPrice);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const points = prices.map((p, i) => {
    const x = (i / (prices.length - 1)) * W;
    const y = H - ((p - min) / range) * (H - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const lastUp = prices[prices.length - 1] >= prices[prices.length - 2];
  const color = lastUp ? '#ef4444' : '#22c55e';

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
