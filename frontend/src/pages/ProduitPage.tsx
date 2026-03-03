/**
 * ProduitPage — Fiche produit dédiée (/produit/:ean)
 *
 * Fonctionnalités :
 * - Infos produit par code EAN
 * - Prix par enseigne
 * - Graphique mini d'évolution des prix (PriceHistoryChart)
 * - Signaler un prix (PriceReport modal)
 * - Ajouter aux favoris (useFavorites)
 * - GPS : tri des enseignes par distance (useGeolocation + calculateDistancesBatch)
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  MapPin,
  Heart,
  Flag,
  ArrowLeft,
  Star,
  Navigation,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { PriceHistoryChart } from '../components/PriceHistoryChart';
import PriceReport from '../components/products/PriceReport';
import { historyService } from '../services/historyService';
import { useFavorites } from '../hooks/useFavorites';
import { useGeolocation } from '../hooks/useGeolocation';
import { calculateDistancesBatch, formatDistance } from '../utils/geoLocation';
import type { PriceHistoryPoint, Timeframe } from '../types/priceHistory';

/* ------------------------------------------------------------------ */
/* Types locaux                                                         */
/* ------------------------------------------------------------------ */

interface StorePrice {
  storeId: string;
  storeName: string;
  price: number;
  isPromo: boolean;
  lastUpdated: string;
  lat?: number;
  lon?: number;
  distance?: number;
}

/* ------------------------------------------------------------------ */
/* Données mock (remplacées par API réelle ultérieurement)             */
/* ------------------------------------------------------------------ */

function buildMockStorePrices(ean: string): StorePrice[] {
  // Seed déterministe basée sur l'EAN pour des valeurs cohérentes
  const seed = ean.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const base = 1.5 + (seed % 300) / 100;
  return [
    {
      storeId: 'carrefour-jarry',
      storeName: 'Carrefour Jarry',
      price: parseFloat((base * 1.05).toFixed(2)),
      isPromo: false,
      lastUpdated: new Date(Date.now() - 3600000).toISOString(),
      lat: 16.271,
      lon: -61.588,
    },
    {
      storeId: 'leader-price-gp',
      storeName: 'Leader Price Guadeloupe',
      price: parseFloat((base * 0.95).toFixed(2)),
      isPromo: true,
      lastUpdated: new Date(Date.now() - 7200000).toISOString(),
      lat: 16.2415,
      lon: -61.5331,
    },
    {
      storeId: 'match-gp',
      storeName: 'Hyper Match',
      price: parseFloat((base * 1.02).toFixed(2)),
      isPromo: false,
      lastUpdated: new Date(Date.now() - 86400000).toISOString(),
      lat: 16.2544,
      lon: -61.5602,
    },
    {
      storeId: 'leclerc-gp',
      storeName: 'E.Leclerc Guadeloupe',
      price: parseFloat((base * 0.98).toFixed(2)),
      isPromo: false,
      lastUpdated: new Date(Date.now() - 43200000).toISOString(),
      lat: 16.23,
      lon: -61.508,
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Composant principal                                                  */
/* ------------------------------------------------------------------ */

export default function ProduitPage() {
  const { ean = '' } = useParams<{ ean: string }>();

  const [productName, setProductName] = useState<string>('Chargement…');
  const [storePrices, setStorePrices] = useState<StorePrice[]>([]);
  const [historyData, setHistoryData] = useState<PriceHistoryPoint[]>([]);
  const [timeframe, setTimeframe] = useState<Timeframe>('30d');
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  /* Favoris */
  const { isFavorite, toggleFavorite } = useFavorites();
  const favKey = `product-${ean}`;
  const isFav = isFavorite(favKey);

  /* GPS */
  const { position, loading: gpsLoading, requestPermission } = useGeolocation({
    enableHighAccuracy: false,
    timeout: 8000,
  });

  /* ---------------------------------------------------------------- */
  /* Chargement produit + prix                                          */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    if (!ean) return;
    setLoading(true);

    // En production : appel API par EAN (Open Food Facts, base interne, etc.)
    setTimeout(() => {
      setProductName(`Produit EAN ${ean}`);
      setStorePrices(buildMockStorePrices(ean));
      setLoading(false);
    }, 400);
  }, [ean]);

  /* ---------------------------------------------------------------- */
  /* Chargement historique prix                                         */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    if (!ean) return;
    setHistoryLoading(true);
    historyService
      .getPriceHistory(ean, timeframe)
      .then((series) => {
        setHistoryData(series.dataPoints);
        if (series.productName && series.productName !== 'Produit Example') {
          setProductName(series.productName);
        }
      })
      .catch(() => setHistoryData([]))
      .finally(() => setHistoryLoading(false));
  }, [ean, timeframe]);

  /* ---------------------------------------------------------------- */
  /* Tri GPS des enseignes                                              */
  /* ---------------------------------------------------------------- */
  const sortedPrices = useCallback((): StorePrice[] => {
    if (!position) return [...storePrices].sort((a, b) => a.price - b.price);
    const withCoords = storePrices.filter((s) => s.lat !== undefined && s.lon !== undefined) as (StorePrice & {
      lat: number;
      lon: number;
    })[];
    const withDist = calculateDistancesBatch({ lat: position.lat, lon: position.lon }, withCoords);
    return withDist
      .map((s) => ({ ...s, distance: s.distance }))
      .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
  }, [storePrices, position])();

  /* ---------------------------------------------------------------- */
  /* Helpers UI                                                         */
  /* ---------------------------------------------------------------- */
  const bestPrice = sortedPrices.length ? Math.min(...sortedPrices.map((s) => s.price)) : null;
  const worstPrice = sortedPrices.length ? Math.max(...sortedPrices.map((s) => s.price)) : null;

  const trendIcon = (trend: string) => {
    if (trend === 'increasing') return <TrendingUp className="w-4 h-4 text-red-500" />;
    if (trend === 'decreasing') return <TrendingDown className="w-4 h-4 text-green-500" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  const handleToggleFavorite = () => {
    toggleFavorite({
      id: favKey,
      label: productName,
      type: 'product',
      barcode: ean,
      productName,
      route: `/produit/${ean}`,
    });
  };

  /* ---------------------------------------------------------------- */
  /* Rendu                                                              */
  /* ---------------------------------------------------------------- */
  if (!ean) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">
        <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
        <p className="text-slate-700 dark:text-slate-300">Code EAN manquant.</p>
        <Link to="/comparateur" className="text-blue-600 hover:underline">
          ← Retour comparateur
        </Link>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{productName} — A KI PRI SA YÉ</title>
        <meta
          name="description"
          content={`Comparez les prix du produit EAN ${ean} dans les enseignes locales. Historique, alertes et localisation GPS.`}
        />
      </Helmet>

      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

          {/* ---- Fil d'Ariane ---- */}
          <nav aria-label="Fil d'Ariane">
            <Link
              to="/comparateur"
              className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour comparateur
            </Link>
          </nav>

          {/* ---- En-tête produit ---- */}
          <header className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            {loading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
              </div>
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {productName}
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    EAN : <span className="font-mono">{ean}</span>
                  </p>
                  {bestPrice !== null && (
                    <p className="mt-2 text-xl font-semibold text-green-600 dark:text-green-400">
                      À partir de {bestPrice.toFixed(2)} €
                    </p>
                  )}
                </div>

                {/* Boutons actions */}
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={handleToggleFavorite}
                    aria-label={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    className={`p-2 rounded-lg border transition-colors ${
                      isFav
                        ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-red-300 hover:text-red-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isFav ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={() => setShowReportModal(true)}
                    aria-label="Signaler un prix"
                    className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-orange-300 hover:text-orange-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-400 transition-colors"
                  >
                    <Flag className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </header>

          {/* ---- Prix par enseigne + GPS ---- */}
          <section aria-labelledby="prices-heading">
            <div className="flex items-center justify-between mb-3">
              <h2 id="prices-heading" className="text-lg font-semibold text-slate-900 dark:text-white">
                Prix par enseigne
              </h2>
              {!position && (
                <button
                  onClick={requestPermission}
                  disabled={gpsLoading}
                  className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
                >
                  {gpsLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Navigation className="w-4 h-4" />
                  )}
                  Trier par distance
                </button>
              )}
              {position && (
                <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                  <MapPin className="w-3.5 h-3.5" />
                  Trié par distance GPS
                </span>
              )}
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-16 bg-white dark:bg-slate-800 rounded-xl animate-pulse border border-slate-200 dark:border-slate-700"
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3" role="list" aria-label="Liste des enseignes">
                {sortedPrices.map((store, idx) => {
                  const isBest = store.price === bestPrice;
                  const isWorst = store.price === worstPrice && sortedPrices.length > 1;
                  return (
                    <div
                      key={store.storeId}
                      role="listitem"
                      className={`bg-white dark:bg-slate-800 rounded-xl p-4 border shadow-sm flex items-center justify-between gap-4 transition-all ${
                        isBest
                          ? 'border-green-300 dark:border-green-700'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Rang */}
                        <span className="text-sm font-bold text-slate-400 w-5 flex-shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-white truncate">
                            {store.storeName}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {store.distance !== undefined && (
                              <span className="inline-flex items-center gap-0.5 text-xs text-slate-500 dark:text-slate-400">
                                <MapPin className="w-3 h-3" />
                                {formatDistance(store.distance)}
                              </span>
                            )}
                            {store.isPromo && (
                              <span className="text-xs px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded font-medium">
                                Promo
                              </span>
                            )}
                            {isBest && (
                              <span className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded font-medium">
                                <Star className="w-3 h-3" />
                                Meilleur prix
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p
                          className={`text-xl font-bold ${
                            isBest
                              ? 'text-green-600 dark:text-green-400'
                              : isWorst
                              ? 'text-red-500 dark:text-red-400'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {store.price.toFixed(2)} €
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          {new Date(store.lastUpdated).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ---- Graphique historique des prix ---- */}
          <section aria-labelledby="history-heading">
            <div className="flex items-center justify-between mb-3">
              <h2
                id="history-heading"
                className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2"
              >
                {trendIcon(
                  historyData.length >= 2
                    ? historyService.calculateStatistics(historyData).trend
                    : 'stable'
                )}
                Évolution des prix
              </h2>

              {/* Sélecteur période */}
              <div className="flex gap-1" role="group" aria-label="Période">
                {(['7d', '30d', '90d', '365d'] as Timeframe[]).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    aria-pressed={timeframe === tf}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      timeframe === tf
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {tf === '7d' && '7j'}
                    {tf === '30d' && '30j'}
                    {tf === '90d' && '90j'}
                    {tf === '365d' && '1an'}
                  </button>
                ))}
              </div>
            </div>

            {historyLoading ? (
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 animate-pulse">
                <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded" />
              </div>
            ) : (
              <PriceHistoryChart data={historyData} showTrendLine showAverage />
            )}
          </section>

          {/* ---- CTA Alerte prix ---- */}
          <section className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl p-5 text-white">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h3 className="font-bold text-lg mb-1">
                  Soyez alerté d'une baisse de prix
                </h3>
                <p className="text-blue-100 text-sm">
                  Définissez un seuil et recevez une notification dès que le prix baisse.
                </p>
              </div>
              <Link
                to={`/alertes?ean=${ean}&name=${encodeURIComponent(productName)}`}
                className="flex-shrink-0 px-5 py-2.5 bg-white text-blue-700 rounded-lg font-semibold hover:bg-blue-50 transition-colors text-sm"
              >
                Créer une alerte
              </Link>
            </div>
          </section>

          {/* ---- Signalement succès ---- */}
          {reportSuccess && (
            <div
              role="status"
              aria-live="polite"
              className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3"
            >
              <span className="text-green-600 dark:text-green-400 text-xl">✓</span>
              <p className="text-green-800 dark:text-green-200 text-sm font-medium">
                Prix signalé ! Merci pour votre contribution citoyenne.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ---- Modal Signaler un prix ---- */}
      {showReportModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Signaler un prix"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <PriceReport
              productEan={ean}
              productName={productName}
              onReportSuccess={() => {
                setShowReportModal(false);
                setReportSuccess(true);
                setTimeout(() => setReportSuccess(false), 5000);
              }}
              onCancel={() => setShowReportModal(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
