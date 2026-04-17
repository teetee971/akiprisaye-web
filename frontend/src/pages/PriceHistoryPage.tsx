/**
 * Price History Page
 * Display price evolution charts and statistics — multi-month & multi-year view.
 * v2: CSV/PDF export + multi-product comparison overlay.
 */

import { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  Info,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  BarChart2,
  Filter,
} from 'lucide-react';
import { PriceHistoryChart } from '../components/PriceHistoryChart';
import { UpgradeGate } from '../components/billing/UpgradeGate';
import { historyService } from '../services/historyService';
import { loadObservatoireData } from '../services/observatoireDataLoader';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';
import {
  buildMonthlyAggregates,
  buildPriceTrendSeries,
  filterMonthly,
  getCategories,
  getEnseignes,
  type MonthlyAggregate,
  type PriceTrendSeries,
} from '../services/temporalAggregationService';
import { TERRITORIES, getTerritoryLabel } from '../services/territoryNormalizationService';
import type { PriceHistoryPoint, Timeframe } from '../types/priceHistory';

// ─── Export helpers ───────────────────────────────────────────────────────────

function exportHistoryCSV(trendSeries: PriceTrendSeries[], territory: string) {
  if (trendSeries.length === 0) return;
  const rows: string[][] = [
    ['Territoire', 'Produit', 'Catégorie', 'Mois', 'Prix moy.', 'Prix min', 'Prix max', 'Obs.'],
  ];
  trendSeries.forEach((ts) => {
    ts.monthly.forEach((m) => {
      rows.push([
        territory,
        ts.productName,
        ts.category,
        m.month,
        m.avgPrice.toFixed(2),
        m.minPrice.toFixed(2),
        m.maxPrice.toFixed(2),
        String(m.observationCount ?? ''),
      ]);
    });
  });
  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `historique-prix-${territory}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function exportHistoryPDF(trendSeries: PriceTrendSeries[], territory: string) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const now = new Date();

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 297, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Historique des Prix — A KI PRI SA YÉ', 14, 11);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Territoire : ${territory} | Généré le ${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
    14,
    20
  );

  let y = 34;
  trendSeries.slice(0, 15).forEach((ts, tsIdx) => {
    if (y > 170) {
      doc.addPage();
      y = 14;
    }
    doc.setFillColor(30, 58, 138);
    doc.rect(0, y - 4, 297, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`${tsIdx + 1}. ${ts.productName} — ${ts.category}`, 14, y + 3);
    y += 12;

    const headers = ['Mois', 'Prix moy.', 'Min', 'Max', 'Obs.'];
    const colX = [14, 70, 110, 150, 190];
    doc.setFillColor(51, 65, 85);
    doc.rect(0, y - 4, 297, 9, 'F');
    doc.setTextColor(200, 210, 220);
    doc.setFontSize(7);
    headers.forEach((h, i) => doc.text(h, colX[i], y + 2));
    y += 9;

    doc.setFont('helvetica', 'normal');
    ts.monthly.slice(-12).forEach((m, ri) => {
      if (y > 185) {
        doc.addPage();
        y = 14;
      }
      doc.setFillColor(ri % 2 === 0 ? 15 : 22, ri % 2 === 0 ? 23 : 33, ri % 2 === 0 ? 42 : 54);
      doc.rect(0, y - 4, 297, 8, 'F');
      doc.setTextColor(200, 210, 220);
      doc.text(m.month, colX[0], y + 1);
      doc.text(`${m.avgPrice.toFixed(2)} €`, colX[1], y + 1);
      doc.setTextColor(74, 222, 128);
      doc.text(`${m.minPrice.toFixed(2)} €`, colX[2], y + 1);
      doc.setTextColor(252, 165, 165);
      doc.text(`${m.maxPrice.toFixed(2)} €`, colX[3], y + 1);
      doc.setTextColor(200, 210, 220);
      doc.text(String(m.observationCount ?? ''), colX[4], y + 1);
      y += 8;
    });
    y += 4;
  });

  // Footer
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text('A KI PRI SA YÉ — Données observatoire public', 14, 205);
    doc.text(`Page ${p}/${pages}`, 280, 205);
  }

  doc.save(`historique-prix-${territory}-${now.toISOString().slice(0, 10)}.pdf`);
}

// ─── View modes ───────────────────────────────────────────────────────────────

type ViewMode = 'monthly' | 'annual' | 'per-product' | 'compare';

const TIMEFRAME_MONTHS: Record<string, number> = {
  '3m': 3,
  '6m': 6,
  '1y': 12,
  all: 999,
};

const TERRITORY_OPTIONS = TERRITORIES.filter((t) =>
  ['gp', 'mq', 'gf', 're', 'yt', 'fr'].includes(t.code)
);

// ─── Component ────────────────────────────────────────────────────────────────

export default function PriceHistoryPage() {
  // Legacy point-based chart data (for backwards-compatible API path)
  const [legacyData, setLegacyData] = useState<PriceHistoryPoint[]>([]);
  const [timeframe, setTimeframe] = useState<Timeframe>('30d');

  // Aggregated observatoire data
  const [monthly, setMonthly] = useState<MonthlyAggregate[]>([]);
  const [trendSeries, setTrendSeries] = useState<PriceTrendSeries[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [enseignes, setEnseignes] = useState<string[]>([]);

  // Filters
  const [selectedTerritory, setSelectedTerritory] = useState('gp');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedEnseigne, setSelectedEnseigne] = useState('');
  const [selectedTimespan, setSelectedTimespan] = useState('all');

  // UI state
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [exporting, setExporting] = useState(false);
  // Multi-product comparison: set of selected product keys
  const [compareKeys, setCompareKeys] = useState<Set<string>>(new Set());

  // ─── Load legacy chart data ────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    historyService
      .getPriceHistory('3017620422003', timeframe)
      .then((h) => {
        if (!cancelled) setLegacyData(h.dataPoints);
      })
      .catch(() => {
        /* silent – observatoire data used instead */
      });
    return () => {
      cancelled = true;
    };
  }, [timeframe]);

  // ─── Load observatoire aggregated data ────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    const territory = TERRITORY_OPTIONS.find((t) => t.code === selectedTerritory);
    const territoryLabel = territory?.labelFull ?? 'Guadeloupe';

    loadObservatoireData(territoryLabel)
      .then((snapshots) => {
        if (cancelled) return;
        const m = buildMonthlyAggregates(snapshots);
        const ts = buildPriceTrendSeries(snapshots);
        setMonthly(m);
        setTrendSeries(ts);
        setCategories(getCategories(snapshots));
        setEnseignes(getEnseignes(snapshots));
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
  }, [selectedTerritory]);

  // ─── Filtered monthly data ────────────────────────────────────────────────
  const filteredMonthly = useMemo(() => {
    const months = TIMEFRAME_MONTHS[selectedTimespan] ?? 999;
    const cutoff = (() => {
      if (months >= 999) return '';
      const d = new Date();
      d.setMonth(d.getMonth() - months);
      return d.toISOString().slice(0, 7);
    })();
    return filterMonthly(monthly, {
      territory: selectedTerritory,
      category: selectedCategory || undefined,
      enseigne: selectedEnseigne || undefined,
      fromMonth: cutoff || undefined,
    });
  }, [monthly, selectedTerritory, selectedCategory, selectedEnseigne, selectedTimespan]);

  // Group filtered monthly by product for charts
  const productGroups = useMemo(() => {
    const map = new Map<string, MonthlyAggregate[]>();
    filteredMonthly.forEach((m) => {
      const arr = map.get(m.productKey) ?? [];
      arr.push(m);
      map.set(m.productKey, arr);
    });
    return map;
  }, [filteredMonthly]);

  const handleRetry = () => {
    setSelectedTerritory((t) => t); // trigger re-render via dependency
    setError(false);
    setLoading(true);
  };

  const handleExportCSV = () => {
    exportHistoryCSV(trendSeries, selectedTerritory.toUpperCase());
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      await exportHistoryPDF(trendSeries, selectedTerritory.toUpperCase());
    } finally {
      setExporting(false);
    }
  };

  const toggleCompare = (productKey: string) => {
    setCompareKeys((prev) => {
      const next = new Set(prev);
      if (next.has(productKey)) {
        next.delete(productKey);
      } else {
        next.add(productKey);
      }
      return next;
    });
  };

  // ─── Render helpers ───────────────────────────────────────────────────────

  function trendBadge(trend: 'up' | 'down' | 'stable', pct: number | null) {
    const label = pct != null ? `${Math.abs(pct).toFixed(1)}%` : '';
    if (trend === 'up')
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
          <TrendingUp className="w-3 h-3" />
          {label && `+${label}`}
        </span>
      );
    if (trend === 'down')
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
          <TrendingDown className="w-3 h-3" />
          {label && `-${label}`}
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
        <Minus className="w-3 h-3" />
        Stable
      </span>
    );
  }

  return (
    <>
      <Helmet>
        <title>Historique des Prix Observés - A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Évolution multi-mois et multi-années des prix dans les DROM-COM, avec filtres par territoire, catégorie et enseigne"
        />
        <link rel="canonical" href="https://teetee971.github.io/akiprisaye-web/prix-historique" />
        <link
          rel="alternate"
          hrefLang="fr"
          href="https://teetee971.github.io/akiprisaye-web/prix-historique"
        />
        <link
          rel="alternate"
          hrefLang="x-default"
          href="https://teetee971.github.io/akiprisaye-web/prix-historique"
        />
      </Helmet>

      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
        <div className="container mx-auto px-4 max-w-5xl">
          <HeroImage
            src={PAGE_HERO_IMAGES.priceHistory}
            alt="Étiquettes de prix en supermarché"
            gradient="from-blue-900 to-slate-950"
            height="h-44 sm:h-56"
            className="mb-6"
          >
            <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">
              Historique des prix observés
            </h1>
            <p className="text-blue-100 text-sm mt-1 drop-shadow">
              Multi-mois · Multi-années · Filtres territoire, catégorie, enseigne
            </p>
          </HeroImage>

          {/* Context banner */}
          <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Les variations peuvent être liées à la saisonnalité, au transport ou à l'offre
                locale. Les données proviennent des relevés citoyens et sont agrégées mensuellement.
              </p>
            </div>
          </div>

          {/* Controls row */}
          <div className="mb-6 flex flex-wrap gap-3 items-center">
            {/* Territory selector */}
            <select
              value={selectedTerritory}
              onChange={(e) => setSelectedTerritory(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm"
              aria-label="Sélectionner le territoire"
            >
              {TERRITORY_OPTIONS.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.flag} {t.label}
                </option>
              ))}
            </select>

            {/* Timespan selector */}
            <div className="flex gap-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-600 p-1">
              {Object.keys(TIMEFRAME_MONTHS).map((ts) => (
                <button
                  key={ts}
                  onClick={() => setSelectedTimespan(ts)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${selectedTimespan === ts ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                >
                  {ts === '3m' ? '3 mois' : ts === '6m' ? '6 mois' : ts === '1y' ? '1 an' : 'Tout'}
                </button>
              ))}
            </div>

            {/* View mode */}
            <div className="flex gap-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-600 p-1">
              {(['monthly', 'annual', 'per-product', 'compare'] as ViewMode[]).map((vm) => (
                <button
                  key={vm}
                  onClick={() => setViewMode(vm)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${viewMode === vm ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                >
                  {vm === 'monthly'
                    ? 'Mensuel'
                    : vm === 'annual'
                      ? 'Annuel'
                      : vm === 'per-product'
                        ? 'Par produit'
                        : '⚖️ Comparer'}
                </button>
              ))}
            </div>

            {/* Export buttons */}
            {!loading && !error && trendSeries.length > 0 && (
              <div className="flex gap-1 ml-auto">
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-green-600 text-green-600 dark:text-green-400 bg-white dark:bg-slate-800 hover:bg-green-50 dark:hover:bg-green-900/20 text-xs font-medium transition-colors"
                >
                  📥 CSV
                </button>
                <button
                  onClick={handleExportPDF}
                  disabled={exporting}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-600 text-red-600 dark:text-red-400 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {exporting ? '⏳' : '📄'} PDF
                </button>
              </div>
            )}

            {/* Filters toggle */}
            {(categories.length > 0 || enseignes.length > 0) && (
              <button
                onClick={() => setShowFilters((v) => !v)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <Filter className="w-4 h-4" />
                Filtres{selectedCategory || selectedEnseigne ? ' ✓' : ''}
              </button>
            )}
          </div>

          {/* Advanced filters panel */}
          {showFilters && (
            <div className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-wrap gap-4">
              {categories.length > 0 && (
                <div>
                  <label
                    htmlFor="ph-categorie"
                    className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1"
                  >
                    Catégorie
                  </label>
                  <select
                    id="ph-categorie"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200"
                  >
                    <option value="">Toutes</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {enseignes.length > 0 && (
                <div>
                  <label
                    htmlFor="ph-enseigne"
                    className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1"
                  >
                    Enseigne
                  </label>
                  <select
                    id="ph-enseigne"
                    value={selectedEnseigne}
                    onChange={(e) => setSelectedEnseigne(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200"
                  >
                    <option value="">Toutes</option>
                    {enseignes.map((e) => (
                      <option key={e} value={e}>
                        {e}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {(selectedCategory || selectedEnseigne) && (
                <button
                  onClick={() => {
                    setSelectedCategory('');
                    setSelectedEnseigne('');
                  }}
                  className="self-end text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Réinitialiser
                </button>
              )}
            </div>
          )}

          {/* Main content */}
          {loading ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg animate-pulse">
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4" />
              <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
            </div>
          ) : error ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-12 shadow-lg text-center">
              <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Données temporairement indisponibles
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Nous ne pouvons pas charger l'historique pour le moment
              </p>
              <button
                onClick={handleRetry}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Réessayer
              </button>
            </div>
          ) : viewMode === 'per-product' && trendSeries.length > 0 ? (
            // ─── Per-product trend cards ───────────────────────────────────
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                Tendances par produit —{' '}
                {getTerritoryLabel(selectedTerritory as Parameters<typeof getTerritoryLabel>[0])}
              </h2>
              {trendSeries
                .filter(
                  (ts) =>
                    !selectedCategory ||
                    ts.category.toLowerCase() === selectedCategory.toLowerCase()
                )
                .map((ts) => (
                  <div
                    key={`${ts.territory}-${ts.productKey}`}
                    className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                          {ts.productName}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{ts.category}</p>
                      </div>
                      {trendBadge(ts.trend, ts.changePercent)}
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-xs text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700">
                            <th className="text-left py-1 pr-4">Mois</th>
                            <th className="text-right py-1 pr-4">Moy.</th>
                            <th className="text-right py-1 pr-4">Min</th>
                            <th className="text-right py-1">Max</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ts.monthly.map((m) => (
                            <tr
                              key={m.month}
                              className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750"
                            >
                              <td className="py-1 pr-4 text-slate-700 dark:text-slate-300">
                                {m.month}
                              </td>
                              <td className="py-1 pr-4 text-right font-medium text-slate-900 dark:text-white">
                                {m.avgPrice.toFixed(2)} €
                              </td>
                              <td className="py-1 pr-4 text-right text-green-600 dark:text-green-400">
                                {m.minPrice.toFixed(2)} €
                              </td>
                              <td className="py-1 text-right text-red-600 dark:text-red-400">
                                {m.maxPrice.toFixed(2)} €
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              {trendSeries.filter(
                (ts) =>
                  !selectedCategory || ts.category.toLowerCase() === selectedCategory.toLowerCase()
              ).length === 0 && (
                <EmptyState message="Aucune tendance disponible pour les filtres sélectionnés" />
              )}
            </div>
          ) : viewMode === 'annual' ? (
            // ─── Annual aggregates table ───────────────────────────────────
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-blue-600" />
                <h2 className="font-semibold text-slate-900 dark:text-white">
                  Agrégation annuelle —{' '}
                  {getTerritoryLabel(selectedTerritory as Parameters<typeof getTerritoryLabel>[0])}
                </h2>
              </div>
              {trendSeries.length === 0 ? (
                <EmptyState message="Aucune donnée annuelle disponible" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900/50">
                      <tr className="text-xs text-slate-500 dark:text-slate-400">
                        <th className="text-left px-4 py-3">Produit</th>
                        <th className="text-left px-4 py-3">Catégorie</th>
                        {[...new Set(trendSeries.flatMap((ts) => ts.annual.map((a) => a.year)))]
                          .sort()
                          .map((y) => (
                            <th key={y} className="text-right px-4 py-3">
                              {y}
                            </th>
                          ))}
                        <th className="text-right px-4 py-3">Tendance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trendSeries
                        .filter(
                          (ts) =>
                            !selectedCategory ||
                            ts.category.toLowerCase() === selectedCategory.toLowerCase()
                        )
                        .map((ts) => {
                          const years = [
                            ...new Set(trendSeries.flatMap((t) => t.annual.map((a) => a.year))),
                          ].sort();
                          return (
                            <tr
                              key={`${ts.territory}-${ts.productKey}`}
                              className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750"
                            >
                              <td className="px-4 py-2 font-medium text-slate-900 dark:text-white">
                                {ts.productName}
                              </td>
                              <td className="px-4 py-2 text-slate-500 dark:text-slate-400">
                                {ts.category}
                              </td>
                              {years.map((y) => {
                                const agg = ts.annual.find((a) => a.year === y);
                                return (
                                  <td
                                    key={y}
                                    className="px-4 py-2 text-right text-slate-700 dark:text-slate-300"
                                  >
                                    {agg ? `${agg.avgPrice.toFixed(2)} €` : '—'}
                                  </td>
                                );
                              })}
                              <td className="px-4 py-2 text-right">
                                {trendBadge(ts.trend, ts.changePercent)}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : viewMode === 'compare' ? (
            // ─── Multi-product comparison ──────────────────────────────────
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                <h2 className="font-semibold text-slate-900 dark:text-white mb-1">
                  ⚖️ Comparaison multi-produits
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  Sélectionnez jusqu'à 5 produits pour comparer leur évolution de prix sur le même
                  graphique.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {trendSeries.map((ts) => {
                    const isSelected = compareKeys.has(ts.productKey);
                    return (
                      <button
                        key={ts.productKey}
                        onClick={() => toggleCompare(ts.productKey)}
                        disabled={!isSelected && compareKeys.size >= 5}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : compareKeys.size >= 5
                              ? 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-400 cursor-not-allowed'
                              : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-blue-500'
                        }`}
                      >
                        {ts.productName}
                      </button>
                    );
                  })}
                </div>
                {compareKeys.size === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">
                    Sélectionnez des produits ci-dessus pour démarrer la comparaison.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    {/* Build months union */}
                    {(() => {
                      const selectedSeries = trendSeries.filter((ts) =>
                        compareKeys.has(ts.productKey)
                      );
                      const allMonths = [
                        ...new Set(selectedSeries.flatMap((ts) => ts.monthly.map((m) => m.month))),
                      ].sort();
                      const COLORS = ['#3b82f6', '#f97316', '#22c55e', '#a855f7', '#ef4444'];
                      return (
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                              <th className="text-left py-2 pr-3">Mois</th>
                              {selectedSeries.map((ts, i) => (
                                <th
                                  key={ts.productKey}
                                  className="text-right py-2 px-2"
                                  style={{ color: COLORS[i] }}
                                >
                                  {ts.productName.slice(0, 18)}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {allMonths.map((month, ri) => (
                              <tr
                                key={month}
                                className={`border-b border-slate-100 dark:border-slate-800 ${ri % 2 === 0 ? '' : 'bg-slate-50 dark:bg-slate-900/20'}`}
                              >
                                <td className="py-1.5 pr-3 text-slate-600 dark:text-slate-400 font-medium">
                                  {month}
                                </td>
                                {selectedSeries.map((ts, i) => {
                                  const m = ts.monthly.find((x) => x.month === month);
                                  return (
                                    <td
                                      key={ts.productKey}
                                      className="py-1.5 px-2 text-right font-medium"
                                      style={{ color: COLORS[i] }}
                                    >
                                      {m ? `${m.avgPrice.toFixed(2)} €` : '—'}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          ) : (
            // ─── Monthly chart (default) ───────────────────────────────────
            <div className="space-y-6">
              {/* Legacy API chart */}
              {legacyData.length > 0 && (
                <UpgradeGate feature="PRICE_HISTORY_ADVANCED">
                  <div className="mb-4">
                    <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                      Vue courbe (données temps-réel)
                    </span>
                    <div className="flex gap-1 mb-3">
                      {(['7d', '30d', '90d', '365d'] as Timeframe[]).map((tf) => (
                        <button
                          key={tf}
                          onClick={() => setTimeframe(tf)}
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${timeframe === tf ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:bg-slate-50'}`}
                        >
                          {tf === '7d' ? '7j' : tf === '30d' ? '30j' : tf === '90d' ? '3m' : '1an'}
                        </button>
                      ))}
                    </div>
                    <PriceHistoryChart data={legacyData} showTrendLine showAverage />
                  </div>
                </UpgradeGate>
              )}

              {/* Monthly aggregates from observatoire */}
              <div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">
                  Agrégation mensuelle —{' '}
                  {getTerritoryLabel(selectedTerritory as Parameters<typeof getTerritoryLabel>[0])}
                </h2>
                {filteredMonthly.length === 0 ? (
                  <EmptyState message="Aucune donnée mensuelle pour les filtres sélectionnés" />
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {Array.from(productGroups.entries()).map(([productKey, months]) => {
                      const sorted = [...months].sort((a, b) => a.month.localeCompare(b.month));
                      const latest = sorted[sorted.length - 1];
                      const earliest = sorted[0];
                      const changePercent =
                        sorted.length >= 2 && earliest.avgPrice > 0
                          ? ((latest.avgPrice - earliest.avgPrice) / earliest.avgPrice) * 100
                          : null;
                      const trend =
                        changePercent == null
                          ? 'stable'
                          : changePercent > 2
                            ? 'up'
                            : changePercent < -2
                              ? 'down'
                              : 'stable';
                      return (
                        <div
                          key={productKey}
                          className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="min-w-0">
                              <h3 className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                                {latest.productName}
                              </h3>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {latest.category}
                              </p>
                            </div>
                            {trendBadge(
                              trend,
                              changePercent != null
                                ? Math.round(Math.abs(changePercent) * 10) / 10
                                : null
                            )}
                          </div>
                          <div className="space-y-1">
                            {sorted.map((m) => (
                              <div
                                key={m.month}
                                className="flex items-center justify-between text-xs"
                              >
                                <span className="text-slate-500 dark:text-slate-400">
                                  {m.month}
                                </span>
                                <span className="font-medium text-slate-800 dark:text-slate-200">
                                  {m.avgPrice.toFixed(2)} €
                                </span>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                            {latest.observationCount} obs. ·{' '}
                            {latest.enseignes.slice(0, 2).join(', ')}
                            {latest.enseignes.length > 2 ? '…' : ''}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CTA */}
          {!loading && !error && (
            <div className="mt-8 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-lg p-6 border border-slate-200 dark:border-slate-600">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    Voir l'impact sur l'inflation globale
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Découvrez comment ces variations affectent le pouvoir d'achat local
                  </p>
                </div>
                <Link
                  to="/inflation"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold whitespace-nowrap"
                >
                  Voir l'inflation
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Empty state helper ───────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-10 text-center border border-slate-200 dark:border-slate-700">
      <BarChart2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
      <p className="text-slate-500 dark:text-slate-400 text-sm">{message}</p>
    </div>
  );
}
