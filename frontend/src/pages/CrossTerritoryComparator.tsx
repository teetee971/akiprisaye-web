/**
 * CrossTerritoryComparator
 *
 * Innovative page: compares the same product across all territories side by side.
 * Shows:
 *  - Price per territory in Jan/Feb 2026
 *  - Surplus % vs Hexagone baseline
 *  - Price-fairness score (0–100, 100 = same as mainland)
 *  - Best & worst store per territory
 *  - Cheapest territory badge
 */

import { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  TrendingUp, TrendingDown, Award, AlertCircle, Filter,
  BarChart2, Info,
} from 'lucide-react';
import { loadObservatoireData } from '../services/observatoireDataLoader';
import { buildMonthlyAggregates } from '../services/temporalAggregationService';
import { TERRITORIES } from '../services/territoryNormalizationService';
import type { MonthlyAggregate } from '../services/temporalAggregationService';

// ─── Config ───────────────────────────────────────────────────────────────────

const COMPARE_TERRITORIES = TERRITORIES.filter((t) =>
  ['gp', 'mq', 'gf', 're', 'yt', 'fr'].includes(t.code),
);

const HEXAGONE_CODE = 'fr';
const LATEST_MONTH = '2026-02';
const FALLBACK_MONTH = '2026-01';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Fairness score: 100 = same price as hexagone, 0 = 2× the price */
function fairnessScore(price: number, hexPrice: number): number {
  if (hexPrice <= 0) return 50;
  const ratio = price / hexPrice;
  // Linear: score = 100 at ratio=1, score = 0 at ratio=2
  return Math.max(0, Math.min(100, Math.round((2 - ratio) * 100)));
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-green-600 dark:text-green-400';
  if (score >= 50) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function surplusLabel(pct: number): { text: string; cls: string } {
  if (pct > 0)
    return {
      text: `+${pct.toFixed(1)}%`,
      cls: 'text-red-600 dark:text-red-400 font-semibold',
    };
  if (pct < 0)
    return {
      text: `${pct.toFixed(1)}%`,
      cls: 'text-green-600 dark:text-green-400 font-semibold',
    };
  return { text: '—', cls: 'text-slate-400' };
}

// ─── Component ────────────────────────────────────────────────────────────────

interface TerritoryRow {
  code: string;
  label: string;
  flag: string;
  avgPrice: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  bestStore: string;
  observationCount: number;
  surplusPct: number | null;
  fairness: number | null;
  month: string;
}

export default function CrossTerritoryComparator() {
  const [allMonthly, setAllMonthly] = useState<MonthlyAggregate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Load data from all territories in parallel
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    Promise.all(
      COMPARE_TERRITORIES.map((t) =>
        loadObservatoireData(t.labelFull).catch(() => []),
      ),
    )
      .then((allSnaps) => {
        if (cancelled) return;
        const flat = allSnaps.flat();
        const monthly = buildMonthlyAggregates(flat);
        setAllMonthly(monthly);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) { setError(true); setLoading(false); }
      });

    return () => { cancelled = true; };
  }, []);

  // Distinct product keys available across all territories
  const products = useMemo(() => {
    const map = new Map<string, { key: string; name: string; category: string }>();
    for (const m of allMonthly) {
      if (!map.has(m.productKey)) {
        map.set(m.productKey, {
          key: m.productKey,
          name: m.productName,
          category: m.category,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name, 'fr'),
    );
  }, [allMonthly]);

  const categories = useMemo(() => {
    return [...new Set(products.map((p) => p.category))].sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!selectedCategory) return products;
    return products.filter((p) => p.category === selectedCategory);
  }, [products, selectedCategory]);

  // Auto-select first product when list loads
  useEffect(() => {
    if (filteredProducts.length > 0 && !selectedProduct) {
      setSelectedProduct(filteredProducts[0].key);
    }
  }, [filteredProducts, selectedProduct]);

  // Build rows: one per territory for selected product
  const rows = useMemo<TerritoryRow[]>(() => {
    if (!selectedProduct) return [];

    const hexEntry = allMonthly.find(
      (m) =>
        m.productKey === selectedProduct &&
        m.territory === 'Hexagone' &&
        (m.month === LATEST_MONTH || m.month === FALLBACK_MONTH),
    );
    const hexPrice = hexEntry?.avgPrice ?? null;

    return COMPARE_TERRITORIES.map((t) => {
      const entry =
        allMonthly.find(
          (m) =>
            m.productKey === selectedProduct &&
            m.territory.toLowerCase() === t.labelFull.toLowerCase() &&
            m.month === LATEST_MONTH,
        ) ??
        allMonthly.find(
          (m) =>
            m.productKey === selectedProduct &&
            m.territory.toLowerCase() === t.labelFull.toLowerCase() &&
            m.month === FALLBACK_MONTH,
        );

      if (!entry) {
        return {
          code: t.code,
          label: t.label,
          flag: t.flag,
          avgPrice: null,
          minPrice: null,
          maxPrice: null,
          bestStore: '—',
          observationCount: 0,
          surplusPct: null,
          fairness: null,
          month: '—',
        };
      }

      const surplusPct =
        hexPrice != null && hexPrice > 0
          ? ((entry.avgPrice - hexPrice) / hexPrice) * 100
          : null;

      return {
        code: t.code,
        label: t.label,
        flag: t.flag,
        avgPrice: entry.avgPrice,
        minPrice: entry.minPrice,
        maxPrice: entry.maxPrice,
        bestStore: entry.enseignes[0] ?? '—',
        observationCount: entry.observationCount,
        surplusPct: surplusPct != null ? Math.round(surplusPct * 10) / 10 : null,
        fairness:
          hexPrice != null && entry.avgPrice != null
            ? fairnessScore(entry.avgPrice, hexPrice)
            : null,
        month: entry.month,
      };
    });
  }, [allMonthly, selectedProduct]);

  const rowsWithData = rows.filter((r) => r.avgPrice != null);
  const cheapest = rowsWithData.reduce<TerritoryRow | null>(
    (best, r) =>
      r.avgPrice != null && (best == null || r.avgPrice < (best.avgPrice ?? Infinity))
        ? r
        : best,
    null,
  );
  const mostExpensive = rowsWithData.reduce<TerritoryRow | null>(
    (worst, r) =>
      r.avgPrice != null && (worst == null || r.avgPrice > (worst.avgPrice ?? 0))
        ? r
        : worst,
    null,
  );

  const selectedProductMeta = products.find((p) => p.key === selectedProduct);

  return (
    <>
      <Helmet>
        <title>Comparateur inter-territoires — A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Comparez les prix du même produit dans tous les DROM-COM et en France métropolitaine. Surplus vs Hexagone, score équité prix."
        />
      </Helmet>

      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
        <div className="container mx-auto px-4 max-w-5xl">

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
              <BarChart2 className="w-8 h-8 text-blue-600" />
              Comparateur inter-territoires
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Comparez le même produit dans tous les DROM-COM et en France métropolitaine.
              Visualisez le surplus de prix et le score d'équité.
            </p>
          </div>

          {/* Info banner */}
          <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Le <strong>score d'équité</strong> mesure l'écart vs le prix hexagonal (100 = parité,
                0 = prix double). Le <strong>surplus</strong> indique la surtaxe insulaire en %.
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 flex flex-wrap gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Catégorie
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedProduct('');
                }}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200"
              >
                <option value="">Toutes</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="flex-1 min-w-48">
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Produit
              </label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200"
              >
                {filteredProducts.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Summary badges */}
          {!loading && !error && rowsWithData.length > 0 && (
            <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Produit sélectionné</p>
                <p className="font-semibold text-slate-900 dark:text-white text-sm">
                  {selectedProductMeta?.name ?? '—'}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{selectedProductMeta?.category}</p>
              </div>
              {cheapest && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800 shadow-sm">
                  <div className="flex items-center gap-1 mb-1">
                    <Award className="w-3 h-3 text-green-600" />
                    <p className="text-xs text-green-700 dark:text-green-300">Moins cher</p>
                  </div>
                  <p className="font-semibold text-green-900 dark:text-green-100">
                    {cheapest.flag} {cheapest.label}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {cheapest.avgPrice?.toFixed(2)} €
                  </p>
                </div>
              )}
              {mostExpensive && mostExpensive.code !== cheapest?.code && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800 shadow-sm">
                  <div className="flex items-center gap-1 mb-1">
                    <TrendingUp className="w-3 h-3 text-red-500" />
                    <p className="text-xs text-red-700 dark:text-red-300">Plus cher</p>
                  </div>
                  <p className="font-semibold text-red-900 dark:text-red-100">
                    {mostExpensive.flag} {mostExpensive.label}
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {mostExpensive.avgPrice?.toFixed(2)} €
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Main table */}
          {loading ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg animate-pulse">
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4" />
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-10 bg-slate-100 dark:bg-slate-700 rounded mb-2" />
              ))}
            </div>
          ) : error ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-700">
              <AlertCircle className="w-10 h-10 text-orange-400 mx-auto mb-3" />
              <p className="text-slate-500">Données temporairement indisponibles</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-700">
              <BarChart2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Sélectionnez un produit pour comparer</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900/50">
                    <tr className="text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left px-4 py-3">Territoire</th>
                      <th className="text-right px-4 py-3">Prix moy.</th>
                      <th className="text-right px-4 py-3">Min</th>
                      <th className="text-right px-4 py-3">Max</th>
                      <th className="text-right px-4 py-3">Surplus / Hex.</th>
                      <th className="text-right px-4 py-3">Score équité</th>
                      <th className="text-left px-4 py-3">Meilleure enseigne</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr
                        key={row.code}
                        className={`border-t border-slate-100 dark:border-slate-800 transition-colors
                          ${row.code === cheapest?.code ? 'bg-green-50/60 dark:bg-green-900/10' : ''}
                          ${row.code === mostExpensive?.code && row.code !== cheapest?.code ? 'bg-red-50/40 dark:bg-red-900/10' : ''}
                          hover:bg-slate-50 dark:hover:bg-slate-750
                        `}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{row.flag}</span>
                            <div>
                              <span className="font-medium text-slate-900 dark:text-white">
                                {row.label}
                              </span>
                              {row.code === cheapest?.code && (
                                <span className="ml-1 text-xs text-green-600 dark:text-green-400">★</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {row.avgPrice != null ? (
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {row.avgPrice.toFixed(2)} €
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-green-600 dark:text-green-400">
                          {row.minPrice != null ? `${row.minPrice.toFixed(2)} €` : '—'}
                        </td>
                        <td className="px-4 py-3 text-right text-red-500 dark:text-red-400">
                          {row.maxPrice != null ? `${row.maxPrice.toFixed(2)} €` : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {row.surplusPct != null ? (
                            <span className={surplusLabel(row.surplusPct).cls}>
                              {surplusLabel(row.surplusPct).text}
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {row.fairness != null ? (
                            <span className={`font-bold ${scoreColor(row.fairness)}`}>
                              {row.fairness}/100
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs">
                          {row.bestStore}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-400">
                Données : relevés citoyens · Période : {LATEST_MONTH} (ou {FALLBACK_MONTH} si indisponible) ·
                Score équité : 100 = parité hexagonale, 0 = prix double
              </div>
            </div>
          )}

          {/* Inflation delta section */}
          {!loading && !error && rowsWithData.length > 1 && (
            <InflationDeltaSection rows={rowsWithData} />
          )}
        </div>
      </div>
    </>
  );
}

// ─── Bonus: Inflation delta between cheapest and most expensive ───────────────

function InflationDeltaSection({ rows }: { rows: TerritoryRow[] }) {
  const sorted = [...rows]
    .filter((r) => r.avgPrice != null)
    .sort((a, b) => (a.avgPrice ?? 0) - (b.avgPrice ?? 0));

  if (sorted.length < 2) return null;

  const cheap = sorted[0];
  const expensive = sorted[sorted.length - 1];
  const delta = ((expensive.avgPrice! - cheap.avgPrice!) / cheap.avgPrice!) * 100;

  return (
    <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-5 border border-blue-200 dark:border-blue-800">
      <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
        <TrendingDown className="w-5 h-5 text-blue-600" />
        Écart maximal inter-territorial
      </h3>
      <p className="text-slate-700 dark:text-slate-300 text-sm">
        Le même produit coûte{' '}
        <strong className="text-red-600 dark:text-red-400">
          {delta.toFixed(1)}% plus cher
        </strong>{' '}
        à{' '}
        <strong>
          {expensive.flag} {expensive.label}
        </strong>{' '}
        ({expensive.avgPrice?.toFixed(2)} €) qu'à{' '}
        <strong>
          {cheap.flag} {cheap.label}
        </strong>{' '}
        ({cheap.avgPrice?.toFixed(2)} €).
      </p>
    </div>
  );
}
