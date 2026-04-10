/**
 * ProduitPage — Fiche produit dédiée (/produit/:ean)
 *
 * Fonctionnalités :
 * - Infos produit par code EAN (Open Food Facts)
 * - Prix agrégés depuis TOUTES les sources : sites marchands web (Google Shopping),
 *   base Firestore, observations citoyennes, prix temps-réel
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
  Globe,
  RefreshCw,
} from 'lucide-react';
import { PriceHistoryChart } from '../components/PriceHistoryChart';
import PriceReport from '../components/products/PriceReport';
import { historyService } from '../services/historyService';
import { useFavorites } from '../hooks/useFavorites';
import { useGeolocation } from '../hooks/useGeolocation';
import { calculateDistancesBatch, formatDistance } from '../utils/geoLocation';
import { aggregateAllPrices, type AggregatedPrice, type ProductInfo } from '../services/allPriceAggregatorService';
import type { PriceHistoryPoint, Timeframe } from '../types/priceHistory';

/* ------------------------------------------------------------------ */
/* Badge source                                                         */
/* ------------------------------------------------------------------ */

function SourceBadge({ source }: { source: AggregatedPrice['source'] }) {
  const map: Record<AggregatedPrice['source'], { label: string; className: string }> = {
    web_merchant: { label: '🌐 Web', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
    firestore: { label: '📊 Base', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
    observation: { label: '👥 Citoyen', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
    realtime: { label: '⚡ Live', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
    retailer: { label: '🏪 Enseigne', className: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' },
    fallback: { label: '💾 Local', className: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
  };
  const { label, className } = map[source] ?? map.fallback;
  return <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${className}`}>{label}</span>;
}

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
/* Helper : mappe les observations /api/local-price en StorePrice[]    */
/* ------------------------------------------------------------------ */

function observationsToStorePrices(
  observations: Array<{ id: string; storeName?: string | null; storeId?: string | null; price: number; observedAt: string }>,
): StorePrice[] {
  const byStore = new Map<string, StorePrice>();
  for (const obs of observations) {
    const sid = obs.storeId ?? obs.storeName ?? obs.id;
    if (!byStore.has(sid)) {
      byStore.set(sid, {
        storeId: sid,
        storeName: obs.storeName ?? obs.storeId ?? 'Magasin',
        price: obs.price,
        isPromo: false,
        lastUpdated: obs.observedAt,
      });
    } else {
      const existing = byStore.get(sid)!;
      // Keep the most recent observation
      if (obs.observedAt > existing.lastUpdated) {
        existing.price = obs.price;
        existing.lastUpdated = obs.observedAt;
      }
    }
  }
  return Array.from(byStore.values());
}

/* ------------------------------------------------------------------ */
/* Composant principal                                                  */
/* ------------------------------------------------------------------ */

export default function ProduitPage() {
  const { ean = '' } = useParams<{ ean: string }>();

  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  const [productName, setProductName] = useState<string>('Chargement…');
  const [productImage, setProductImage] = useState<string | undefined>();
  // All aggregated prices (local + web merchants)
  const [allPrices, setAllPrices] = useState<AggregatedPrice[]>([]);
  const [aggWarnings, setAggWarnings] = useState<string[]>([]);
  const [aggLoading, setAggLoading] = useState(true);
  const [aggRefreshing, setAggRefreshing] = useState(false);
  // Legacy local prices with GPS support
  const [storePrices, setStorePrices] = useState<StorePrice[]>([]);
  const [historyData, setHistoryData] = useState<PriceHistoryPoint[]>([]);
  const [timeframe, setTimeframe] = useState<Timeframe>('30d');
  const [historyLoading, setHistoryLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [priceTab, setPriceTab] = useState<'all' | 'local' | 'web'>('all');

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
  /* Agrégation complète de tous les prix                               */
  /* ---------------------------------------------------------------- */
  const loadAggregatedPrices = useCallback(async (signal?: AbortSignal) => {
    if (!ean) return;
    const result = await aggregateAllPrices(ean, ean, 'gp', signal).catch(() => null);
    if (!result) return;

    if (result.product) {
      setProductInfo(result.product);
      if (result.product.name) setProductName(result.product.name);
      if (result.product.imageUrl) setProductImage(result.product.imageUrl);
    }

    setAllPrices(result.prices);
    setAggWarnings(result.warnings);

    // Populate legacy storePrices for GPS sort
    const localPrices = result.prices
      .filter((p) => p.source !== 'web_merchant')
      .map((p) => ({
        storeId: p.id,
        storeName: p.merchant,
        price: p.price,
        isPromo: p.isPromo,
        lastUpdated: p.observedAt,
      }));
    if (localPrices.length > 0) setStorePrices(localPrices);
  }, [ean]);

  useEffect(() => {
    if (!ean) return;
    setAggLoading(true);
    const controller = new AbortController();
    loadAggregatedPrices(controller.signal).finally(() => setAggLoading(false));
    return () => controller.abort();
  }, [ean, loadAggregatedPrices]);

  const handleRefresh = async () => {
    setAggRefreshing(true);
    await loadAggregatedPrices().finally(() => setAggRefreshing(false));
  };

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
        if (series.productName && series.productName !== `Produit ${ean}` && series.productName !== 'Produit Example') {
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
    const withCoords = storePrices
      .filter((s) => s.lat !== undefined && s.lon !== undefined)
      .map((s) => ({ ...s, id: s.storeId, lat: s.lat as number, lon: s.lon as number }));
    const withDist = calculateDistancesBatch({ lat: position.lat, lon: position.lon }, withCoords);
    return withDist
      .map((s) => ({ ...s, distance: s.distance }))
      .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
  }, [storePrices, position])();

  /* ---------------------------------------------------------------- */
  /* Helpers UI                                                         */
  /* ---------------------------------------------------------------- */
  const bestPrice = allPrices.length > 0 ? allPrices[0].price : (sortedPrices.length ? Math.min(...sortedPrices.map((s) => s.price)) : null);
  const worstPrice = allPrices.length > 0 ? allPrices[allPrices.length - 1].price : (sortedPrices.length ? Math.max(...sortedPrices.map((s) => s.price)) : null);

  const filteredPrices = priceTab === 'web'
    ? allPrices.filter((p) => p.source === 'web_merchant')
    : priceTab === 'local'
    ? allPrices.filter((p) => p.source !== 'web_merchant')
    : allPrices;

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
            {aggLoading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
              </div>
            ) : (
              <div className="flex items-start gap-4">
                {/* Image produit */}
                {productImage && (
                  <img
                    src={productImage}
                    alt={productName}
                    className="w-20 h-20 object-contain rounded-lg border border-slate-200 dark:border-slate-700 bg-white flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{productName}</h1>
                      {productInfo?.brand && (
                        <p className="text-sm text-slate-500 dark:text-slate-400">{productInfo.brand}</p>
                      )}
                      {/* Nutri-Score + NOVA badges */}
                      {(productInfo?.nutriScore || productInfo?.novaGroup) && (
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {productInfo.nutriScore && (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold text-xs text-white ${
                                productInfo.nutriScore === 'A' ? 'bg-green-600' :
                                productInfo.nutriScore === 'B' ? 'bg-lime-500' :
                                productInfo.nutriScore === 'C' ? 'bg-yellow-500' :
                                productInfo.nutriScore === 'D' ? 'bg-orange-500' : 'bg-red-600'
                              }`}
                              title="Nutri-Score : qualité nutritionnelle (A = meilleure, E = à éviter)"
                            >
                              Nutri-Score {productInfo.nutriScore}
                            </span>
                          )}
                          {productInfo.novaGroup && (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold text-xs text-white ${
                                productInfo.novaGroup === 1 ? 'bg-green-600' :
                                productInfo.novaGroup === 2 ? 'bg-lime-500' :
                                productInfo.novaGroup === 3 ? 'bg-orange-500' : 'bg-red-600'
                              }`}
                              title={`NOVA groupe ${productInfo.novaGroup} : niveau de transformation (1 = non transformé, 4 = ultra-transformé)`}
                            >
                              NOVA {productInfo.novaGroup}
                            </span>
                          )}
                        </div>
                      )}
                      {productInfo?.ingredients && (
                        <details className="mt-1">
                          <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-300">
                            Ingrédients ▾
                          </summary>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">{productInfo.ingredients}</p>
                        </details>
                      )}
                      <p className="text-xs text-slate-400 mt-0.5 font-mono">EAN : {ean}</p>
                      {bestPrice !== null && (
                        <p className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">
                          🏷️ À partir de {bestPrice.toFixed(2)} €
                        </p>
                      )}
                      {allPrices.length > 0 && (
                        <p className="text-xs text-slate-400 mt-1">
                          {allPrices.length} prix trouvés sur {[...new Set(allPrices.map((p) => p.source))].length} source(s)
                        </p>
                      )}
                    </div>
                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={handleRefresh}
                        disabled={aggRefreshing}
                        aria-label="Actualiser les prix"
                        className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-blue-300 hover:text-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-400 transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className={`w-5 h-5 ${aggRefreshing ? 'animate-spin' : ''}`} />
                      </button>
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
                </div>
              </div>
            )}
          </header>

          {/* ---- Comparateur de prix multi-sources ---- */}
          <section aria-labelledby="prices-heading">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h2 id="prices-heading" className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-500" />
                Comparaison de prix toutes sources
              </h2>
              <div className="flex gap-1">
                {!position && (
                  <button
                    onClick={requestPermission}
                    disabled={gpsLoading}
                    className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
                  >
                    {gpsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                    Distance GPS
                  </button>
                )}
              </div>
            </div>

            {/* Onglets de filtrage */}
            <div className="flex gap-1 mb-3 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              {([['all', `Tous (${allPrices.length})`], ['web', `🌐 Web (${allPrices.filter(p => p.source === 'web_merchant').length})`], ['local', `📊 Local (${allPrices.filter(p => p.source !== 'web_merchant').length})`]] as [typeof priceTab, string][]).map(([tab, label]) => (
                <button
                  key={tab}
                  onClick={() => setPriceTab(tab)}
                  className={`flex-1 text-sm px-3 py-1.5 rounded font-medium transition-colors ${
                    priceTab === tab
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {aggLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-16 bg-white dark:bg-slate-800 rounded-xl animate-pulse border border-slate-200 dark:border-slate-700" />
                ))}
              </div>
            ) : filteredPrices.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center border border-slate-200 dark:border-slate-700">
                <Globe className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  {priceTab === 'web' ? 'Prix marchands web non disponibles (clé API non configurée)' : 'Aucun prix local trouvé pour ce produit.'}
                </p>
                <button onClick={handleRefresh} className="mt-3 text-sm text-blue-600 hover:underline">
                  Réessayer
                </button>
              </div>
            ) : (
              <div className="space-y-2" role="list" aria-label="Liste des prix">
                {filteredPrices.map((p, idx) => {
                  const isBest = p.price === bestPrice;
                  const isWorst = p.price === worstPrice && filteredPrices.length > 1;
                  const savingVsWorst = worstPrice && worstPrice > p.price
                    ? Math.round(((worstPrice - p.price) / worstPrice) * 100)
                    : 0;
                  return (
                    <div
                      key={p.id}
                      role="listitem"
                      className={`bg-white dark:bg-slate-800 rounded-xl p-4 border shadow-sm flex items-center justify-between gap-4 transition-all ${
                        isBest ? 'border-green-300 dark:border-green-700' : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-sm font-bold text-slate-400 w-5 flex-shrink-0">{idx + 1}</span>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-white truncate">{p.merchant}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <SourceBadge source={p.source} />
                            {p.isPromo && (
                              <span className="text-xs px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded font-medium">
                                Promo
                              </span>
                            )}
                            {isBest && (
                              <span className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded font-medium">
                                <Star className="w-3 h-3" /> Meilleur
                              </span>
                            )}
                            {savingVsWorst > 0 && isBest && (
                              <span className="text-xs text-green-600 dark:text-green-400 font-medium">-{savingVsWorst}%</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 flex items-center gap-3">
                        <div>
                          <p className={`text-xl font-bold ${isBest ? 'text-green-600 dark:text-green-400' : isWorst ? 'text-red-500 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                            {p.price.toFixed(2)} €
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">
                            {new Date(p.observedAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        {p.url && (
                          <a
                            href={p.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
                            aria-label={`Voir sur ${p.merchant}`}
                          >
                            <Globe className="w-3.5 h-3.5" />
                            Voir
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Avertissements sources */}
            {aggWarnings.length > 0 && (
              <div className="mt-3 space-y-1">
                {aggWarnings.map((w, i) => (
                  <p key={i} className="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    {w}
                  </p>
                ))}
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
                    {tf === '7d' && '7j'}{tf === '30d' && '30j'}{tf === '90d' && '90j'}{tf === '365d' && '1an'}
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
                <h3 className="font-bold text-lg mb-1">Soyez alerté d'une baisse de prix</h3>
                <p className="text-blue-100 text-sm">Définissez un seuil et recevez une notification dès que le prix baisse.</p>
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
