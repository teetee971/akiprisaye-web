/**
 * Observatoire Temps Réel - Real-Time Price Observatory
 *
 * A KI PRI SA YÉ - MODE E - DÉPLOIEMENT AUTOMATIQUE
 *
 * Features:
 * - Pilot product (Lait demi-écrémé 1L)
 * - Territory selector
 * - Product selector
 * - Temporal granularity selector
 * - Dynamic price curves
 * - Numerical indicators
 * - Anomaly alerts
 * - Mobile-first design
 */

import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, RefreshCw } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  loadObservatoireData,
  calculateStatistics,
  type ObservatoireSnapshot,
  type PriceStatistics,
} from '../services/observatoireDataLoader';
import {
  getAllAnomalies,
  formatAnomalyDisplay,
  formatAnomalyDate,
  type PriceAnomaly,
  type PriceDataPoint,
} from '../services/anomalyDetectionService';
import {
  downloadPricesJSON,
  downloadPricesCSV,
  downloadAnomaliesJSON,
  downloadAnomaliesCSV,
  type OpenDataPriceRecord,
} from '../services/openDataService';

type Territory = 'Guadeloupe' | 'Martinique' | 'Guyane' | 'La Réunion' | 'Mayotte' | 'Hexagone';
type Granularity = 'hour' | 'day' | 'week' | 'month';

const TERRITORIES: Territory[] = [
  'Guadeloupe',
  'Martinique',
  'Guyane',
  'La Réunion',
  'Mayotte',
  'Hexagone',
];

const GRANULARITIES: Array<{ value: Granularity; label: string }> = [
  { value: 'hour', label: 'Heure' },
  { value: 'day', label: 'Jour' },
  { value: 'week', label: 'Semaine' },
  { value: 'month', label: 'Mois' },
];

export default function ObservatoireTempsReel() {
  const [selectedTerritory, setSelectedTerritory] = useState<Territory>('Guadeloupe');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedGranularity, setSelectedGranularity] = useState<Granularity>('day');
  const [snapshots, setSnapshots] = useState<ObservatoireSnapshot[]>([]);
  const [statistics, setStatistics] = useState<PriceStatistics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [anomalies, setAnomalies] = useState<PriceAnomaly[]>([]);

  // Load data
  useEffect(() => {
    setLoading(true);
    setError(null);
    loadObservatoireData(selectedTerritory)
      .then((data) => {
        if (data.length === 0) {
          setError(
            "La donnée de l'observatoire est momentanément indisponible. Merci de réessayer ultérieurement."
          );
          return;
        }
        setSnapshots(data);
        const stats = calculateStatistics(data);
        setStatistics(stats);

        // Set pilot product as default if not selected
        // Pilot product: Lait demi-écrémé 1L (EAN: 3560070123456)
        if (!selectedProduct && stats.length > 0) {
          const pilotProduct = stats.find(
            (s) =>
              s.ean === '3560070123456' || s.productName.toLowerCase().includes('lait demi-écrémé')
          );
          setSelectedProduct(pilotProduct?.productName || stats[0].productName);
        }

        if (data.length > 0) {
          setLastUpdate(data[data.length - 1].date_snapshot);
        }
      })
      .catch((err) => {
        console.error('Error loading observatory data:', err);
        setError(
          "La donnée de l'observatoire est momentanément indisponible. Merci de réessayer ultérieurement."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedTerritory, retryCount]);

  // Calculate anomalies for selected product
  useEffect(() => {
    if (!selectedProduct || snapshots.length === 0) {
      setAnomalies([]);
      return;
    }

    // Extract price data for selected product
    const priceData: PriceDataPoint[] = [];
    snapshots.forEach((snapshot) => {
      snapshot.donnees
        .filter((obs) => obs.produit === selectedProduct)
        .forEach((obs) => {
          priceData.push({
            date: snapshot.date_snapshot,
            price: obs.prix,
            territory: snapshot.territoire,
            store: obs.enseigne,
          });
        });
    });

    if (priceData.length > 0) {
      const detectedAnomalies = getAllAnomalies(priceData, selectedProduct, undefined, {
        enableSuddenIncrease: true,
        enableSeriesBreak: true,
      });
      setAnomalies(detectedAnomalies);
    }
  }, [selectedProduct, snapshots]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!selectedProduct || snapshots.length === 0) return [];

    const dataByDate = new Map<string, { date: string; prices: number[] }>();

    snapshots.forEach((snapshot) => {
      snapshot.donnees
        .filter((obs) => obs.produit === selectedProduct)
        .forEach((obs) => {
          const date = snapshot.date_snapshot;
          if (!dataByDate.has(date)) {
            dataByDate.set(date, { date, prices: [] });
          }
          dataByDate.get(date)!.prices.push(obs.prix);
        });
    });

    return Array.from(dataByDate.values())
      .map((entry) => ({
        date: new Date(entry.date).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'short',
        }),
        fullDate: entry.date,
        prixMoyen: entry.prices.reduce((a, b) => a + b, 0) / entry.prices.length,
        prixMin: Math.min(...entry.prices),
        prixMax: Math.max(...entry.prices),
      }))
      .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());
  }, [selectedProduct, snapshots]);

  // Current product stats
  const currentStats = useMemo(() => {
    return statistics.find((s) => s.productName === selectedProduct);
  }, [statistics, selectedProduct]);

  // Prepare open data records
  const openDataRecords: OpenDataPriceRecord[] = useMemo(() => {
    const records: OpenDataPriceRecord[] = [];
    snapshots.forEach((snapshot) => {
      snapshot.donnees.forEach((obs) => {
        records.push({
          ean: obs.ean,
          productName: obs.produit,
          category: obs.categorie,
          territory: snapshot.territoire,
          price: obs.prix,
          priceUnit: 'EUR',
          observedAt: snapshot.date_snapshot,
          store: obs.enseigne,
          commune: obs.commune,
          source: snapshot.source,
          qualityScore: snapshot.qualite === 'verifie' ? 0.95 : 0.7,
        });
      });
    });
    return records;
  }, [snapshots]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6">
        {/* Header */}
        <header className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-3xl">📊</span>
            <div>
              <p className="text-sm text-blue-300 uppercase tracking-wide font-semibold">
                Mode Production
              </p>
              <h1 className="text-4xl sm:text-5xl font-bold text-white">Observatoire Temps Réel</h1>
            </div>
          </div>
          <p className="text-lg text-slate-300 max-w-3xl">
            Suivi en temps réel des prix sur les territoires. Données vérifiables, traçables et
            téléchargeables. Licence Ouverte Etalab 2.0.
          </p>

          {/* Last Update Badge */}
          {lastUpdate && (
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-2">
              <span className="text-emerald-400">🟢</span>
              <span className="text-sm text-emerald-200">
                Dernière mise à jour :{' '}
                {new Date(lastUpdate).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
          )}
        </header>

        {/* Données indisponibles */}
        {error && !loading && (
          <div
            role="alert"
            aria-live="assertive"
            className="rounded-xl border border-orange-500/40 bg-orange-950/30 px-6 py-4 text-center space-y-4"
          >
            <AlertCircle className="w-10 h-10 text-orange-400 mx-auto" aria-hidden="true" />
            <div>
              <p className="text-lg font-semibold text-orange-200">
                Données momentanément indisponibles
              </p>
              <p className="mt-1 text-sm text-orange-300/80">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => setRetryCount((c) => c + 1)}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold transition-colors"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              Réessayer
            </button>
          </div>
        )}

        {/* Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Sélection</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Territory Selector */}
            <div>
              <label htmlFor="territory" className="block text-sm font-medium text-slate-300 mb-2">
                Territoire
              </label>
              <select
                id="territory"
                value={selectedTerritory}
                onChange={(e) => setSelectedTerritory(e.target.value as Territory)}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {TERRITORIES.map((territory) => (
                  <option key={territory} value={territory}>
                    {territory}
                  </option>
                ))}
              </select>
            </div>

            {/* Product Selector */}
            <div>
              <label htmlFor="product" className="block text-sm font-medium text-slate-300 mb-2">
                Produit
              </label>
              <select
                id="product"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading || statistics.length === 0}
              >
                {statistics.map((stat) => (
                  <option key={stat.productName} value={stat.productName}>
                    {stat.productName}
                  </option>
                ))}
              </select>
            </div>

            {/* Granularity Selector */}
            <div>
              <label
                htmlFor="granularity"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Granularité temporelle
              </label>
              <select
                id="granularity"
                value={selectedGranularity}
                onChange={(e) => setSelectedGranularity(e.target.value as Granularity)}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {GRANULARITIES.map((gran) => (
                  <option key={gran.value} value={gran.value}>
                    {gran.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Anomaly Alerts */}
        {anomalies.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 space-y-3">
            <h2 className="text-xl font-semibold text-amber-200 flex items-center gap-2">
              <span>⚠️</span>
              Alertes Détectées
            </h2>
            <div className="space-y-2">
              {anomalies.map((anomaly, idx) => {
                const display = formatAnomalyDisplay(anomaly);
                return (
                  <div
                    key={idx}
                    className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 flex items-start gap-3"
                  >
                    <span
                      className="px-3 py-1 rounded-full text-sm font-semibold"
                      style={{
                        backgroundColor: `${display.color}20`,
                        color: display.color,
                        border: `1px solid ${display.color}40`,
                      }}
                    >
                      {display.badge}
                    </span>
                    <div className="flex-1">
                      <p className="text-slate-200">{display.message}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Détecté le {formatAnomalyDate(anomaly.detectedAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-sm text-slate-400">
              ℹ️ Ces alertes sont générées automatiquement par des méthodes statistiques
              transparentes. Aucune IA opaque. Tout est explicable.
            </p>
          </div>
        )}

        {/* Price Chart */}
        {!loading && chartData.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-semibold text-white">Courbe Dynamique</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #475569',
                      borderRadius: '8px',
                      color: '#f1f5f9',
                    }}
                    formatter={(value) => {
                      const numericValue = typeof value === 'number' ? value : Number(value ?? 0);
                      return [`${numericValue.toFixed(2)}€`, ''];
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="prixMoyen"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Prix Moyen"
                    dot={{ fill: '#3b82f6', r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="prixMin"
                    stroke="#10b981"
                    strokeWidth={1}
                    strokeDasharray="5 5"
                    name="Prix Min"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="prixMax"
                    stroke="#ef4444"
                    strokeWidth={1}
                    strokeDasharray="5 5"
                    name="Prix Max"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Numerical Indicators */}
        {currentStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <p className="text-sm text-slate-400 mb-1">Prix Moyen</p>
              <p className="text-3xl font-bold text-white">{currentStats.avgPrice.toFixed(2)}€</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <p className="text-sm text-slate-400 mb-1">Prix Min / Max</p>
              <p className="text-3xl font-bold text-white">
                {currentStats.minPrice.toFixed(2)}€ / {currentStats.maxPrice.toFixed(2)}€
              </p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <p className="text-sm text-slate-400 mb-1">Observations</p>
              <p className="text-3xl font-bold text-white">{currentStats.observations}</p>
            </div>
          </div>
        )}

        {/* Open Data Export Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <span>📥</span>
            Télécharger les Données
          </h2>
          <p className="text-slate-300">
            Toutes les données sont disponibles en Open Data sous{' '}
            <span className="font-semibold text-blue-400">Licence Ouverte Etalab 2.0</span>
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => downloadPricesJSON(openDataRecords, [selectedTerritory])}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
              disabled={openDataRecords.length === 0}
            >
              📄 Télécharger Prix (JSON)
            </button>
            <button
              onClick={() => downloadPricesCSV(openDataRecords)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
              disabled={openDataRecords.length === 0}
            >
              📊 Télécharger Prix (CSV)
            </button>
            <button
              onClick={() => downloadAnomaliesJSON(anomalies, [selectedTerritory])}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium transition-colors"
              disabled={anomalies.length === 0}
            >
              ⚠️ Télécharger Anomalies (JSON)
            </button>
            <button
              onClick={() => downloadAnomaliesCSV(anomalies)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium transition-colors"
              disabled={anomalies.length === 0}
            >
              ⚠️ Télécharger Anomalies (CSV)
            </button>
          </div>

          <div className="text-sm text-slate-400 space-y-1">
            <p>✅ Sources incluses</p>
            <p>✅ Méthodologie documentée</p>
            <p>✅ Date et hash d'intégrité</p>
            <p>✅ Téléchargeable par collectivités, journalistes, chercheurs</p>
          </div>
        </div>

        {/* Footer Links */}
        <div className="flex flex-wrap gap-4">
          <Link
            to="/observatoire/methodologie"
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg font-medium transition-colors"
          >
            📚 Voir la Méthodologie
          </Link>
          <Link
            to="/transparence"
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg font-medium transition-colors"
          >
            🔍 Transparence & Limites
          </Link>
        </div>

        {/* Institutional Statement */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-blue-200 mb-2">
            🏛️ Positionnement Institutionnel
          </h3>
          <p className="text-slate-300 leading-relaxed">
            A KI PRI SA YÉ est un <strong>observatoire civique numérique</strong>, aligné avec les
            institutions publiques (OPMR, DGCCRF, collectivités) et accessible aux médias. Nous ne
            sommes pas un comparateur commercial ni une startup classique.
          </p>
        </div>
      </div>
    </div>
  );
}
