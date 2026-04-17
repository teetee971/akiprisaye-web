/**
 * CrossTerritoryComparator — redesigned with real photos
 */

import { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  TrendingUp,
  TrendingDown,
  Award,
  AlertCircle,
  Filter,
  BarChart2,
  Info,
} from 'lucide-react';
import { loadObservatoireData } from '../services/observatoireDataLoader';
import { buildMonthlyAggregates } from '../services/temporalAggregationService';
import { TERRITORIES } from '../services/territoryNormalizationService';
import { HeroImage } from '../components/ui/HeroImage';
import { TerritoryCard } from '../components/ui/TerritoryCard';
import { CategoryIcon } from '../components/ui/CategoryIcon';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';
import type { MonthlyAggregate } from '../services/temporalAggregationService';

const COMPARE_TERRITORIES = TERRITORIES.filter((t) =>
  ['gp', 'mq', 'gf', 're', 'yt', 'fr'].includes(t.code)
);
const LATEST_MONTH = '2026-02';
const FALLBACK_MONTH = '2026-01';

function fairnessScore(price: number, hexPrice: number): number {
  if (hexPrice <= 0) return 50;
  return Math.max(0, Math.min(100, Math.round((2 - price / hexPrice) * 100)));
}
function scoreColor(score: number) {
  if (score >= 80) return 'text-green-500';
  if (score >= 50) return 'text-amber-500';
  return 'text-red-500';
}
function scoreBg(score: number) {
  if (score >= 80) return 'bg-green-500';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}
function surplusLabel(pct: number): { text: string; cls: string } {
  if (pct > 0) return { text: `+${pct.toFixed(1)}%`, cls: 'text-red-500 font-semibold' };
  if (pct < 0) return { text: `${pct.toFixed(1)}%`, cls: 'text-green-500 font-semibold' };
  return { text: '—', cls: 'text-slate-400' };
}

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

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    Promise.all(COMPARE_TERRITORIES.map((t) => loadObservatoireData(t.labelFull).catch(() => [])))
      .then((allSnaps) => {
        if (cancelled) return;
        setAllMonthly(buildMonthlyAggregates(allSnaps.flat()));
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const products = useMemo(() => {
    const map = new Map<string, { key: string; name: string; category: string }>();
    for (const m of allMonthly)
      if (!map.has(m.productKey))
        map.set(m.productKey, { key: m.productKey, name: m.productName, category: m.category });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  }, [allMonthly]);

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category))].sort(),
    [products]
  );
  const filteredProducts = useMemo(
    () => (selectedCategory ? products.filter((p) => p.category === selectedCategory) : products),
    [products, selectedCategory]
  );
  useEffect(() => {
    if (filteredProducts.length > 0 && !selectedProduct)
      setSelectedProduct(filteredProducts[0].key);
  }, [filteredProducts, selectedProduct]);

  const rows = useMemo<TerritoryRow[]>(() => {
    if (!selectedProduct) return [];
    const hexEntry = allMonthly.find(
      (m) =>
        m.productKey === selectedProduct &&
        m.territory === 'Hexagone' &&
        (m.month === LATEST_MONTH || m.month === FALLBACK_MONTH)
    );
    const hexPrice = hexEntry?.avgPrice ?? null;
    return COMPARE_TERRITORIES.map((t) => {
      const entry =
        allMonthly.find(
          (m) =>
            m.productKey === selectedProduct &&
            m.territory.toLowerCase() === t.labelFull.toLowerCase() &&
            m.month === LATEST_MONTH
        ) ??
        allMonthly.find(
          (m) =>
            m.productKey === selectedProduct &&
            m.territory.toLowerCase() === t.labelFull.toLowerCase() &&
            m.month === FALLBACK_MONTH
        );
      if (!entry)
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
      const surplusPct =
        hexPrice != null && hexPrice > 0 ? ((entry.avgPrice - hexPrice) / hexPrice) * 100 : null;
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
        fairness: hexPrice != null ? fairnessScore(entry.avgPrice, hexPrice) : null,
        month: entry.month,
      };
    });
  }, [allMonthly, selectedProduct]);

  const rowsWithData = rows.filter((r) => r.avgPrice != null);
  const cheapest = rowsWithData.reduce<TerritoryRow | null>(
    (b, r) => (b == null || r.avgPrice! < b.avgPrice! ? r : b),
    null
  );
  const mostExpensive = rowsWithData.reduce<TerritoryRow | null>(
    (w, r) => (w == null || r.avgPrice! > w.avgPrice! ? r : w),
    null
  );
  const selectedProductMeta = products.find((p) => p.key === selectedProduct);

  return (
    <>
      <Helmet>
        <title>Comparateur inter-territoires — A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Comparez les prix du même produit dans tous les DROM-COM et en France métropolitaine."
        />
        <link
          rel="canonical"
          href="https://teetee971.github.io/akiprisaye-web/comparateur-territoires"
        />
        <link
          rel="alternate"
          hrefLang="fr"
          href="https://teetee971.github.io/akiprisaye-web/comparateur-territoires"
        />
        <link
          rel="alternate"
          hrefLang="x-default"
          href="https://teetee971.github.io/akiprisaye-web/comparateur-territoires"
        />
      </Helmet>

      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Hero */}
          <HeroImage
            src={PAGE_HERO_IMAGES.crossTerritory}
            alt="Marché tropical et produits frais"
            gradient="from-emerald-900 to-teal-950"
            height="h-48 sm:h-64"
            className="mb-8"
          >
            <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">
              Comparateur inter-territoires
            </h1>
            <p className="text-emerald-100 text-sm mt-1 drop-shadow">
              Surplus vs Hexagone · Score d'équité · Meilleure enseigne par territoire
            </p>
          </HeroImage>

          {/* Info */}
          <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Le <strong>score d'équité</strong> mesure l'écart vs le prix hexagonal (100 =
                parité, 0 = prix double). Le <strong>surplus</strong> indique la surtaxe insulaire
                en %.
              </p>
            </div>
          </div>

          {/* Territory grid selector */}
          <div className="mb-6">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-2">
              <Filter className="w-4 h-4" /> Sélectionnez un territoire de référence
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {COMPARE_TERRITORIES.map((t) => {
                const rowForT = rows.find((r) => r.code === t.code);
                return (
                  <TerritoryCard
                    key={t.code}
                    code={t.code}
                    label={t.label}
                    flag={t.flag}
                    className="h-24"
                  >
                    {rowForT?.avgPrice != null && (
                      <p className="text-white text-xs font-bold drop-shadow">
                        {rowForT.avgPrice.toFixed(2)} €
                      </p>
                    )}
                  </TerritoryCard>
                );
              })}
            </div>
          </div>

          {/* Product + category filters */}
          <div className="mb-6 flex flex-wrap gap-3">
            <div>
              <label htmlFor="cross-categorie" className="block text-xs text-slate-500 mb-1">
                Catégorie
              </label>
              <select
                id="cross-categorie"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedProduct('');
                }}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200"
              >
                <option value="">Toutes</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-48">
              <label htmlFor="cross-produit" className="block text-xs text-slate-500 mb-1">
                Produit comparé
              </label>
              <select
                id="cross-produit"
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
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
                {selectedProductMeta && (
                  <CategoryIcon category={selectedProductMeta.category} size="lg" />
                )}
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Produit sélectionné</p>
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">
                    {selectedProductMeta?.name ?? '—'}
                  </p>
                  <p className="text-xs text-slate-400">{selectedProductMeta?.category}</p>
                </div>
              </div>
              {cheapest && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800 shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-xl">
                    {cheapest.flag}
                  </div>
                  <div>
                    <div className="flex items-center gap-1 mb-0.5">
                      <Award className="w-3 h-3 text-green-600" />
                      <p className="text-xs text-green-700 dark:text-green-300">Moins cher</p>
                    </div>
                    <p className="font-semibold text-green-900 dark:text-green-100">
                      {cheapest.label}
                    </p>
                    <p className="text-sm font-bold text-green-700 dark:text-green-300">
                      {cheapest.avgPrice?.toFixed(2)} €
                    </p>
                  </div>
                </div>
              )}
              {mostExpensive && mostExpensive.code !== cheapest?.code && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800 shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center text-xl">
                    {mostExpensive.flag}
                  </div>
                  <div>
                    <div className="flex items-center gap-1 mb-0.5">
                      <TrendingUp className="w-3 h-3 text-red-500" />
                      <p className="text-xs text-red-700 dark:text-red-300">Plus cher</p>
                    </div>
                    <p className="font-semibold text-red-900 dark:text-red-100">
                      {mostExpensive.label}
                    </p>
                    <p className="text-sm font-bold text-red-700 dark:text-red-300">
                      {mostExpensive.avgPrice?.toFixed(2)} €
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Main table */}
          {loading ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow animate-pulse space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-12 bg-slate-100 dark:bg-slate-700 rounded" />
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
                      <th className="text-right px-4 py-3">Surplus</th>
                      <th className="text-right px-4 py-3">Équité</th>
                      <th className="text-left px-4 py-3 hidden sm:table-cell">Enseigne</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr
                        key={row.code}
                        className={`border-t border-slate-100 dark:border-slate-800 transition-colors
                          ${row.code === cheapest?.code ? 'bg-green-50/60 dark:bg-green-900/10' : ''}
                          ${row.code === mostExpensive?.code && row.code !== cheapest?.code ? 'bg-red-50/40 dark:bg-red-900/10' : ''}
                          hover:bg-slate-50 dark:hover:bg-slate-750`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{row.flag}</span>
                            <span className="font-medium text-slate-900 dark:text-white">
                              {row.label}
                            </span>
                            {row.code === cheapest?.code && (
                              <span className="text-green-500 text-xs">★</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-white">
                          {row.avgPrice != null ? (
                            `${row.avgPrice.toFixed(2)} €`
                          ) : (
                            <span className="text-slate-300">—</span>
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
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {row.fairness != null ? (
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${scoreBg(row.fairness)}`}
                                  style={{ width: `${row.fairness}%` }}
                                />
                              </div>
                              <span className={`font-bold text-xs ${scoreColor(row.fairness)}`}>
                                {row.fairness}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs hidden sm:table-cell">
                          {row.bestStore}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-400">
                Données : relevés citoyens · {LATEST_MONTH} · Score équité : 100 = parité hexagonale
              </div>
            </div>
          )}

          {/* Delta section */}
          {!loading &&
            !error &&
            rowsWithData.length > 1 &&
            (() => {
              const sorted = [...rowsWithData]
                .filter((r) => r.avgPrice != null)
                .sort((a, b) => a.avgPrice! - b.avgPrice!);
              if (sorted.length < 2) return null;
              const cheap = sorted[0];
              const expensive = sorted[sorted.length - 1];
              const delta = ((expensive.avgPrice! - cheap.avgPrice!) / cheap.avgPrice!) * 100;
              return (
                <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-5 border border-blue-200 dark:border-blue-800">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-blue-600" /> Écart maximal
                    inter-territorial
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
            })()}
        </div>
      </div>
    </>
  );
}
