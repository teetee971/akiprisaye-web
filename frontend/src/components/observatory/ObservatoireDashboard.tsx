 
/**
 * Observatoire Dashboard - v3.1
 *
 * Public observatory of prices for citizens, media, and institutions
 * Read-only, aggregated data with CSV/JSON/PDF exports + automatic market alerts
 *
 * @module ObservatoireDashboard
 */

import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { GlassCard } from '../ui/glass-card';
import { exportOpenData, getExportStatistics } from '../../services/openDataExportService';
import type { OpenDataExportRequest } from '../../types/openData';
import type { TerritoryCode } from '../../types/extensions';

// ── PDF export helper (no external runtime dep beyond jspdf already in package.json) ──
async function exportObservatoirePDF(
  stats: PriceStats[],
  territory: string,
  exportStats: Record<string, unknown> | null,
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 297, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Observatoire Public des Prix — A KI PRI SA YÉ', 14, 12);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Rapport généré le ${dateStr} à ${timeStr} | Territoire : ${territory === 'all' ? 'Tous' : territory}`, 14, 22);

  // Stats summary bar
  if (exportStats) {
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 30, 297, 18, 'F');
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    const summaries = [
      `Produits suivis : ${exportStats.products ?? 0}`,
      `Prix enregistrés : ${exportStats.prices ?? 0}`,
      `Territoires : ${(exportStats.territories as unknown[])?.length ?? 0}`,
      `Enseignes : ${exportStats.stores ?? 0}`,
    ];
    summaries.forEach((s, i) => doc.text(s, 14 + i * 70, 41));
  }

  // Table header
  const colX = [14, 45, 100, 135, 170, 205, 245];
  const headers = ['EAN', 'Produit', 'Catégorie', 'Prix moy.', 'Min / Max', 'Évol. 30j', 'Mise à jour'];
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 52, 297, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  headers.forEach((h, i) => doc.text(h, colX[i], 59));

  // Table rows
  doc.setFont('helvetica', 'normal');
  let y = 66;
  const rowH = 8;
  const maxRows = Math.min(stats.length, 60);
  for (let i = 0; i < maxRows; i++) {
    const item = stats[i];
    if (y > 195) {
      doc.addPage();
      y = 14;
    }
    const rowColor = i % 2 === 0 ? [15, 23, 42] : [22, 33, 54];
    doc.setFillColor(rowColor[0], rowColor[1], rowColor[2]);
    doc.rect(0, y - 5, 297, rowH, 'F');
    doc.setTextColor(200, 210, 220);
    doc.text(item.ean?.slice(0, 13) ?? '', colX[0], y);
    doc.text(item.productName.slice(0, 28), colX[1], y);
    doc.text(item.category.slice(0, 18), colX[2], y);
    doc.text(`${item.avgPrice.toFixed(2)} €`, colX[3], y);
    doc.text(`${item.minPrice.toFixed(2)} / ${item.maxPrice.toFixed(2)} €`, colX[4], y);
    const sign = item.priceChange30d >= 0 ? '+' : '';
    doc.setTextColor(item.priceChange30d > 0 ? 252 : 74, item.priceChange30d > 0 ? 165 : 222, item.priceChange30d > 0 ? 165 : 128);
    doc.text(`${sign}${item.priceChange30d.toFixed(1)}%`, colX[5], y);
    doc.setTextColor(200, 210, 220);
    doc.text(new Date(item.lastUpdate).toLocaleDateString('fr-FR'), colX[6], y);
    y += rowH;
  }

  // Footer
  doc.setFillColor(15, 23, 42);
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'A KI PRI SA YÉ — Service Public Numérique | Données factuelles observées, aucune garantie',
      14,
      205,
    );
    doc.text(`Page ${p}/${pages}`, 280, 205);
  }

  doc.save(`observatoire-rapport-${now.toISOString().slice(0, 10)}.pdf`);
}

interface PriceStats {
  productName: string;
  category: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  priceChange30d: number;
  lastUpdate: string;
  ean: string;
}

// Alert threshold: products with absolute 30-day change ≥ this value trigger an automatic alert
const ALERT_THRESHOLD_PCT = 5;

interface MarketAlert {
  productName: string;
  category: string;
  priceChange30d: number;
  avgPrice: number;
  severity: 'warning' | 'critical';
}

export default function ObservatoireDashboard() {
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [stats, setStats] = useState<PriceStats[]>([]);
  const [exportStats, setExportStats] = useState<Record<string, unknown> | null>(null);

  // Filters
  const [selectedTerritory, setSelectedTerritory] = useState<TerritoryCode | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchEAN, setSearchEAN] = useState<string>('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Automatic market alerts — derived from price data
  const marketAlerts = useMemo<MarketAlert[]>(() => {
    return stats
      .filter((s) => Math.abs(s.priceChange30d) >= ALERT_THRESHOLD_PCT)
      .sort((a, b) => Math.abs(b.priceChange30d) - Math.abs(a.priceChange30d))
      .slice(0, 10)
      .map((s) => ({
        productName: s.productName,
        category: s.category,
        priceChange30d: s.priceChange30d,
        avgPrice: s.avgPrice,
        severity: Math.abs(s.priceChange30d) >= 10 ? 'critical' : 'warning',
      }));
  }, [stats]);

  useEffect(() => {
    loadStatistics();
    loadPriceData();
  }, []);

  const loadStatistics = async () => {
    try {
      const data = await getExportStatistics();
      setExportStats(data);
    } catch (error) {
      console.error('Failed to load export statistics:', error);
    }
  };

  const loadPriceData = async () => {
    setLoading(true);
    try {
      // Load real aggregated data from observatoire snapshots
      const STEMS = ['guadeloupe', 'martinique', 'guyane', 'la_réunion', 'mayotte', 'hexagone'];
      const MONTH = '2026-03';
      const snapshots = await Promise.all(
        STEMS.map((stem) =>
          fetch(`${import.meta.env.BASE_URL}data/observatoire/${stem}_${MONTH}.json`)
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null),
        ),
      );
      const prevSnapshots = await Promise.all(
        STEMS.map((stem) =>
          fetch(`${import.meta.env.BASE_URL}data/observatoire/${stem}_2026-02.json`)
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null),
        ),
      );

      // Aggregate prices by product across all territories
      const byProduct: Record<string, { prices: number[]; prevPrices: number[]; category: string; ean: string }> = {};

      snapshots.forEach((snap, snapIdx) => {
        if (!snap?.donnees) return;
        snap.donnees.forEach((item: { produit: string; prix: number; categorie: string; ean: string }) => {
          if (!byProduct[item.produit]) {
            byProduct[item.produit] = { prices: [], prevPrices: [], category: item.categorie ?? 'Épicerie', ean: item.ean ?? '' };
          }
          byProduct[item.produit].prices.push(item.prix);
          // Previous month
          const prevSnap = prevSnapshots[snapIdx];
          if (prevSnap?.donnees) {
            const prev = prevSnap.donnees.find((d: { produit: string }) => d.produit === item.produit);
            if (prev) byProduct[item.produit].prevPrices.push(prev.prix);
          }
        });
      });

      const realData: PriceStats[] = Object.entries(byProduct)
        .filter(([, v]) => v.prices.length > 0)
        .map(([productName, v]) => {
          const avg = v.prices.reduce((s, p) => s + p, 0) / v.prices.length;
          const min = Math.min(...v.prices);
          const max = Math.max(...v.prices);
          const prevAvg = v.prevPrices.length > 0
            ? v.prevPrices.reduce((s, p) => s + p, 0) / v.prevPrices.length
            : avg;
          const change = prevAvg > 0 ? Math.round(((avg - prevAvg) / prevAvg) * 1000) / 10 : 0;
          return {
            productName,
            category: v.category,
            avgPrice: Math.round(avg * 100) / 100,
            minPrice: Math.round(min * 100) / 100,
            maxPrice: Math.round(max * 100) / 100,
            priceChange30d: change,
            lastUpdate: new Date().toISOString(),
            ean: v.ean,
          };
        })
        .sort((a, b) => b.avgPrice - a.avgPrice);

      setStats(realData);
    } catch (error) {
      console.error('Failed to load price data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'json' | 'pdf') => {
    if (format === 'pdf') {
      setExporting(true);
      try {
        await exportObservatoirePDF(filteredStats, selectedTerritory, exportStats);
        toast.success('Rapport PDF généré');
      } catch (err) {
        console.error('PDF export failed:', err);
        toast.error('Erreur lors de la génération PDF');
      } finally {
        setExporting(false);
      }
      return;
    }
    setExporting(true);
    try {
      const request: OpenDataExportRequest = {
        format,
        dataType: 'prices',
        territory: selectedTerritory !== 'all' ? selectedTerritory as TerritoryCode : undefined,
        dateRange: dateRange.start && dateRange.end ? dateRange : undefined,
        includeMetadata: true,
      };

      const result = await exportOpenData(request);

      if (result.success && result.data) {
        // Create download
        const blob = new Blob([result.data.content], { type: result.data.contentType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.data.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        toast.error(`Export échoué: ${result.error}`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Erreur lors de l\'export');
    } finally {
      setExporting(false);
    }
  };

  const filteredStats = stats.filter(item => {
    if (searchEAN && !item.ean.includes(searchEAN)) return false;
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    return true;
  });

  const categories = Array.from(new Set(stats.map(s => s.category)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <GlassCard>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">🏛️ Observatoire Public des Prix</h1>
            <p className="text-gray-300 text-lg">
              Données agrégées officielles - Lecture seule
            </p>
          </div>
          <div className="text-right text-sm text-gray-400">
            <div>Version: v3.1</div>
            <div>Dernière mise à jour: {new Date().toLocaleDateString('fr-FR')}</div>
          </div>
        </div>
        
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mt-4">
          <h3 className="font-semibold text-blue-300 mb-2">📊 Méthodologie</h3>
          <p className="text-sm text-gray-300">
            Les prix affichés sont des moyennes calculées sur l'ensemble des observations collectées.
            Toutes les données sont horodatées et sourcées. Aucune extrapolation ou estimation n'est effectuée.
          </p>
          <Link 
            to="/methodologie" 
            className="text-blue-400 hover:text-blue-300 text-sm underline mt-2 inline-block"
          >
            Consulter la méthodologie complète →
          </Link>
        </div>
      </GlassCard>

      {/* Statistics Overview */}
      {exportStats && (
        <GlassCard>
          <h2 className="text-xl font-semibold mb-4">📈 Statistiques globales</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <div className="text-2xl font-bold text-blue-400">{(exportStats.products as number) || 0}</div>
              <div className="text-sm text-gray-400">Produits suivis</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <div className="text-2xl font-bold text-green-400">{(exportStats.prices as number) || 0}</div>
              <div className="text-sm text-gray-400">Prix enregistrés</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <div className="text-2xl font-bold text-purple-400">{(exportStats.territories as unknown[])?.length || 0}</div>
              <div className="text-sm text-gray-400">Territoires</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <div className="text-2xl font-bold text-yellow-400">{(exportStats.stores as number) || 0}</div>
              <div className="text-sm text-gray-400">Enseignes</div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Filters */}
      <GlassCard>
        <h2 className="text-xl font-semibold mb-4">🔍 Filtres</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="obs-ean" className="block text-sm font-medium text-gray-300 mb-2">Code EAN</label>
            <input
              id="obs-ean"
              type="text"
              value={searchEAN}
              onChange={(e) => setSearchEAN(e.target.value)}
              placeholder="3560070..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="obs-category" className="block text-sm font-medium text-gray-300 mb-2">Catégorie</label>
            <select
              id="obs-category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">Toutes les catégories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="obs-territory" className="block text-sm font-medium text-gray-300 mb-2">Territoire</label>
            <select
              id="obs-territory"
              value={selectedTerritory}
              onChange={(e) => setSelectedTerritory(e.target.value as any)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">Tous les territoires</option>
              <option value="GP">Guadeloupe</option>
              <option value="MQ">Martinique</option>
              <option value="GF">Guyane</option>
              <option value="RE">Réunion</option>
              <option value="YT">Mayotte</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="obs-period" className="block text-sm font-medium text-gray-300 mb-2">Période</label>
            <select
              id="obs-period"
              onChange={(e) => {
                const days = parseInt(e.target.value);
                if (days > 0) {
                  const end = new Date().toISOString().split('T')[0];
                  const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                  setDateRange({ start, end });
                } else {
                  setDateRange({ start: '', end: '' });
                }
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="0">Toutes les dates</option>
              <option value="7">7 derniers jours</option>
              <option value="30">30 derniers jours</option>
              <option value="90">90 derniers jours</option>
              <option value="365">1 an</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Automatic Market Alerts */}
      {marketAlerts.length > 0 && (
        <GlassCard>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            🚨 Alertes marchés automatiques
            <span className="text-sm font-normal text-gray-400">(variations ≥ {ALERT_THRESHOLD_PCT}% sur 30 jours)</span>
          </h2>
          <div className="space-y-2">
            {marketAlerts.map((alert, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  alert.severity === 'critical'
                    ? 'bg-red-900/20 border-red-500/40'
                    : 'bg-yellow-900/20 border-yellow-500/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{alert.severity === 'critical' ? '🔴' : '🟡'}</span>
                  <div>
                    <div className="font-medium text-sm">{alert.productName}</div>
                    <div className="text-xs text-gray-400">{alert.category} · Prix moy. {alert.avgPrice.toFixed(2)} €</div>
                  </div>
                </div>
                <div className={`font-bold text-lg ${alert.priceChange30d > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {alert.priceChange30d > 0 ? '+' : ''}{alert.priceChange30d.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Price Table */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">📋 Tableau des prix</h2>
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('csv')}
              disabled={exporting}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
            >
              {exporting ? 'Export...' : '📥 Export CSV'}
            </button>
            <button
              onClick={() => handleExport('json')}
              disabled={exporting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
            >
              {exporting ? 'Export...' : '📥 Export JSON'}
            </button>
            <button
              onClick={() => handleExport('pdf')}
              disabled={exporting}
              className="px-4 py-2 bg-red-700 hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
            >
              {exporting ? 'Génération...' : '📄 Rapport PDF'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="text-gray-400 mt-2">Chargement des données...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="pb-3 text-sm font-semibold text-gray-300">EAN</th>
                  <th className="pb-3 text-sm font-semibold text-gray-300">Produit</th>
                  <th className="pb-3 text-sm font-semibold text-gray-300">Catégorie</th>
                  <th className="pb-3 text-sm font-semibold text-gray-300 text-right">Prix Moyen</th>
                  <th className="pb-3 text-sm font-semibold text-gray-300 text-right">Min / Max</th>
                  <th className="pb-3 text-sm font-semibold text-gray-300 text-right">Évolution 30j</th>
                  <th className="pb-3 text-sm font-semibold text-gray-300">Mise à jour</th>
                </tr>
              </thead>
              <tbody>
                {filteredStats.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">
                      Aucune donnée disponible pour les filtres sélectionnés
                    </td>
                  </tr>
                ) : (
                  filteredStats.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/30">
                      <td className="py-3 text-sm text-gray-400">{item.ean}</td>
                      <td className="py-3 text-sm font-medium">{item.productName}</td>
                      <td className="py-3 text-sm text-gray-400">{item.category}</td>
                      <td className="py-3 text-sm text-right font-semibold">{item.avgPrice.toFixed(2)} €</td>
                      <td className="py-3 text-sm text-right text-gray-400">
                        {item.minPrice.toFixed(2)} € / {item.maxPrice.toFixed(2)} €
                      </td>
                      <td className={`py-3 text-sm text-right font-semibold ${
                        item.priceChange30d > 0 ? 'text-red-400' : 'text-green-400'
                      }`}>
                        {item.priceChange30d > 0 ? '+' : ''}{item.priceChange30d.toFixed(1)}%
                      </td>
                      <td className="py-3 text-sm text-gray-400">
                        {new Date(item.lastUpdate).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 p-3 bg-slate-800/30 rounded-lg text-xs text-gray-400">
          <strong>Sources:</strong> Données collectées via scans utilisateurs, APIs publiques, et bases de données officielles.
          Horodatage disponible pour chaque enregistrement dans les exports.
        </div>
      </GlassCard>

      {/* Data Quality Notice */}
      <GlassCard className="bg-yellow-900/10 border-yellow-500/30">
        <h3 className="font-semibold text-yellow-300 mb-2">⚠️ Avertissement important</h3>
        <p className="text-sm text-gray-300">
          Cet observatoire présente des données agrégées à titre informatif. Les prix peuvent varier selon les enseignes,
          les périodes et les territoires. Cette plateforme ne constitue pas une source officielle au sens réglementaire
          et ne remplace pas les enquêtes statistiques officielles (INSEE, IEDOM, etc.).
        </p>
      </GlassCard>
    </div>
  );
}
