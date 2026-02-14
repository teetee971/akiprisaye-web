import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import ReportPriceModal from '../components/prices/ReportPriceModal';
import {
  getFavorites,
  getHistory,
  getReportsByBarcode,
  isFavorite,
  pushHistory,
  toggleFavorite,
} from '../services/localStore';
import { searchProductPrices } from '../services/priceSearch/priceSearch.service';
import type { PriceSearchResult, TerritoryCode } from '../services/priceSearch/price.types';
import type { LocalPriceReport, LocalProductItem } from '../types/localProduct';
import type { ScanData, ScanHubResult } from '../types/scanHubResult';
import { safeLocalStorage } from '../utils/safeLocalStorage';

const FALLBACK_IMAGE = '/images/product-fallback.svg';
const LazyPriceInsightsPanel = lazy(() => import('../components/search/PriceInsightsPanel'));
const LazyBarcodeScanner = lazy(() => import('../components/BarcodeScanner'));

interface ProductSnapshot {
  barcode?: string;
  name?: string | null;
  brand?: string | null;
  imageUrl?: string | null;
  imageFrontUrl?: string | null;
  imageNormalizedUrl?: string | null;
  imageSmallUrl?: string | null;
}

const TERRITORIES: { code: TerritoryCode; label: string }[] = [
  { code: 'fr', label: 'France (métropole)' },
  { code: 'gp', label: 'Guadeloupe' },
  { code: 'mq', label: 'Martinique' },
  { code: 'gf', label: 'Guyane' },
  { code: 're', label: 'La Réunion' },
  { code: 'yt', label: 'Mayotte' },
  { code: 'pm', label: 'Saint-Pierre-et-Miquelon' },
  { code: 'bl', label: 'Saint-Barthélemy' },
  { code: 'mf', label: 'Saint-Martin' },
];

const getTerritoryLabel = (code?: string) =>
  TERRITORIES.find((item) => item.code === code)?.label ?? 'Territoire non précisé';

const resolveProductImage = (product?: ProductSnapshot | null) =>
  product?.imageFrontUrl ||
  product?.imageUrl ||
  product?.imageNormalizedUrl ||
  product?.imageSmallUrl ||
  FALLBACK_IMAGE;

const formatCurrency = (value: number | null | undefined) =>
  typeof value === 'number' ? `${value.toFixed(2)}€` : '—';

const formatRelativeDate = (value?: string) => {
  if (!value) return 'Date inconnue';
  const observedAt = new Date(value);
  if (Number.isNaN(observedAt.getTime())) return 'Date inconnue';
  const days = Math.floor((Date.now() - observedAt.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'aujourd’hui';
  if (days === 1) return 'il y a 1 jour';
  return `il y a ${days} jours`;
};

const getPriceBadge = (interval?: ScanData['prices'][number]) => {
  if (!interval || interval.median === null || interval.min === null || interval.max === null) {
    return { label: 'Prix indisponible', tone: 'text-slate-200 bg-slate-800 border-slate-700' };
  }
  const spread = interval.max - interval.min || 1;
  const normalized = (interval.median - interval.min) / spread;
  if (normalized <= 0.35) {
    return { label: 'Bon prix', tone: 'text-emerald-100 bg-emerald-600/20 border-emerald-500/40' };
  }
  if (normalized <= 0.7) {
    return { label: 'Prix moyen', tone: 'text-amber-100 bg-amber-600/20 border-amber-500/40' };
  }
  return { label: 'Prix élevé', tone: 'text-rose-100 bg-rose-600/20 border-rose-500/40' };
};

function ResultSkeleton() {
  return (
    <div
      className="bg-slate-900/70 border border-slate-700 rounded-2xl p-6 animate-pulse space-y-4"
      role="status"
      aria-live="polite"
    >
      <div className="h-5 bg-slate-800 rounded w-2/3" />
      <div className="h-4 bg-slate-800 rounded w-1/2" />
      <div className="grid grid-cols-3 gap-3">
        <div className="h-16 bg-slate-800 rounded" />
        <div className="h-16 bg-slate-800 rounded" />
        <div className="h-16 bg-slate-800 rounded" />
      </div>
    </div>
  );
}

function SafeFallback({
  title,
  message,
  actions,
  onReturnToHub,
}: {
  title: string;
  message: string;
  actions: Array<{ label: string; onClick: () => void }>;
  onReturnToHub: () => void;
}) {
  return (
    <div className="bg-slate-900/70 border border-slate-700 rounded-2xl p-6 space-y-4" role="status" aria-live="polite">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm text-slate-300">{message}</p>
      <div className="flex flex-col md:flex-row gap-3 text-sm">
        {actions.map((action) => (
          <button key={action.label} type="button" onClick={action.onClick} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold">
            {action.label}
          </button>
        ))}
        <button type="button" onClick={onReturnToHub} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg">
          🏠 Retour au ScanHub
        </button>
      </div>
    </div>
  );
}

function PriceSearchResults({
  result,
  product,
  barcode,
  territory,
  onReset,
  onScanTicket,
  onReturnToHub,
  onToggleFavorite,
  favorite,
  reports,
  onOpenReport,
  onOpenReports,
}: {
  result: ScanHubResult | null;
  product?: ProductSnapshot | null;
  barcode: string;
  territory: TerritoryCode;
  onReset: () => void;
  onScanTicket: () => void;
  onReturnToHub: () => void;
  onToggleFavorite: () => void;
  favorite: boolean;
  reports: LocalPriceReport[];
  onOpenReport: () => void;
  onOpenReports: () => void;
}) {
  if (!result || result.status === 'LOADING') return <ResultSkeleton />;

  if (result.status === 'NO_DATA') {
    return (
      <SafeFallback
        title="Produit trouvé, mais pas encore de prix dans ce territoire."
        message="Nous enrichissons les observations en continu."
        actions={[{ label: '🔄 Nouvelle recherche', onClick: onReset }, { label: '📷 Scanner un ticket', onClick: onScanTicket }]}
        onReturnToHub={onReturnToHub}
      />
    );
  }

  if (result.status === 'UNAVAILABLE') {
    return (
      <SafeFallback
        title="Impossible de récupérer les données, réessayez."
        message="Le service est momentanément indisponible."
        actions={[{ label: '🔄 Réessayer', onClick: onReset }]}
        onReturnToHub={onReturnToHub}
      />
    );
  }

  const data = result.status === 'PARTIAL' ? result.data : result.data;
  const interval = data.prices?.[0];
  const badge = getPriceBadge(interval);
  const latestObservation = [...(data.observations ?? [])].sort(
    (a, b) => new Date(b.observedAt ?? 0).getTime() - new Date(a.observedAt ?? 0).getTime()
  )[0];
  const imageUrl = resolveProductImage(product);

  return (
    <section className="space-y-4">
      <article className="bg-slate-900/70 border border-slate-700 rounded-2xl p-6 space-y-4" tabIndex={-1}>
        <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-start">
          <div className="w-full max-w-[140px] aspect-square rounded-xl bg-slate-950 overflow-hidden border border-slate-700">
            <img
              src={imageUrl}
              alt={data.productName || product?.name || 'Produit'}
              loading="lazy"
              decoding="async"
              width={140}
              height={140}
              className="w-full h-full object-contain"
              onError={(event) => {
                event.currentTarget.src = FALLBACK_IMAGE;
              }}
            />
          </div>
          <div>
            <h2 className="text-2xl font-semibold">{data.productName || product?.name || 'Produit analysé'}</h2>
            <p className="text-sm text-slate-300">{data.brand || product?.brand || 'Marque non renseignée'}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={`text-sm border rounded-lg px-3 py-1 ${badge.tone}`}>{badge.label}</span>
              <span className="text-sm text-slate-200 bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-1">
                Prix médian: <strong>{formatCurrency(interval?.median)}</strong>
              </span>
              <span className="text-sm text-emerald-200 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-1">
                📍 {getTerritoryLabel(data.territory)}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-3">
              Dernière observation: {formatRelativeDate(latestObservation?.observedAt)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onToggleFavorite} className={`px-3 py-2 rounded-lg text-sm font-semibold border ${favorite ? 'bg-amber-400/20 border-amber-400 text-amber-200' : 'bg-slate-900 border-slate-700 text-slate-300'}`}>
            {favorite ? '⭐ Favori' : '☆ Favori'}
          </button>
          <button type="button" onClick={onOpenReport} className="px-3 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700">Signaler un prix</button>
          <button type="button" onClick={onReset} className="px-3 py-2 rounded-lg text-sm font-semibold bg-slate-800 hover:bg-slate-700">Nouvelle recherche</button>
        </div>
      </article>

      <section className="bg-slate-900/70 border border-slate-700 rounded-2xl p-5">
        <h3 className="font-semibold">Vos signalements (local)</h3>
        {reports.length === 0 ? (
          <p className="text-sm text-slate-400 mt-2">Aucun signalement pour ce produit.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {reports.slice(0, 3).map((report) => (
              <li key={report.id} className="bg-slate-950 rounded-lg p-3">
                <p className="text-slate-100">{report.price.toFixed(2)}€ • {report.unit ?? 'unit'} • {formatRelativeDate(report.observedAt)}</p>
                <p className="text-xs text-slate-400">{report.store || 'Magasin non précisé'} • {report.city || territory.toUpperCase()}</p>
              </li>
            ))}
          </ul>
        )}
        {reports.length > 3 && (
          <button type="button" onClick={onOpenReports} className="mt-3 text-sm text-blue-300 hover:text-blue-200">
            Voir tous les signalements
          </button>
        )}
      </section>

      <Suspense fallback={<ResultSkeleton />}>
        <LazyPriceInsightsPanel result={data as ScanData} />
      </Suspense>
    </section>
  );
}


function normalizeObservationSource(source: string): 'open_food_facts' | 'open_prices' | 'user_report' {
  if (source === 'open_food_facts' || source === 'open_prices' || source === 'user_report') {
    return source;
  }
  return 'open_prices';
}

function formatCachedLabel(cachedAt: string) {
  const cachedDate = new Date(cachedAt);
  return Number.isNaN(cachedDate.getTime()) ? 'Date inconnue' : cachedDate.toLocaleString('fr-FR');
}

export default function RechercheProduits() {
  const navigate = useNavigate();
  const params = useMemo(
    () => new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search),
    []
  );

  const [query, setQuery] = useState(params.get('q') ?? '');
  const [barcode, setBarcode] = useState(params.get('ean') ?? '');
  const [territory, setTerritory] = useState<TerritoryCode>('fr');
  const [result, setResult] = useState<ScanHubResult | null>(null);
  const [product, setProduct] = useState<ProductSnapshot | null>(null);
  const [productState, setProductState] = useState<'idle' | 'not_found' | 'error'>('idle');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [showAllReports, setShowAllReports] = useState(false);
  const [highlightResult, setHighlightResult] = useState(false);
  const [hasAutoSearched, setHasAutoSearched] = useState(false);
  const [favorites, setFavorites] = useState<LocalProductItem[]>(() => getFavorites());
  const [history, setHistory] = useState<LocalProductItem[]>(() => getHistory());
  const [reports, setReports] = useState<LocalPriceReport[]>([]);

  const resultAnchorRef = useRef<HTMLDivElement>(null);
  const hasSearchInput = Boolean(barcode.trim() || query.trim());
  const canSearch = hasSearchInput && !loading;

  const buildCacheKey = useCallback(
    (input?: { query?: string; barcode?: string; territory?: TerritoryCode }) => {
      const normalizedQuery = (input?.query ?? query).trim().toLowerCase();
      const normalizedBarcode = (input?.barcode ?? barcode).trim();
      const normalizedTerritory = input?.territory ?? territory;
      return `scanhub:price-search:${normalizedTerritory}:${normalizedBarcode || 'no-barcode'}:${normalizedQuery || 'no-query'}`;
    },
    [barcode, query, territory]
  );

  const readCache = useCallback(
    (input?: { query?: string; barcode?: string; territory?: TerritoryCode }) => {
      const raw = safeLocalStorage.getItem(buildCacheKey(input));
      if (!raw) return null;
      try {
        return JSON.parse(raw) as { cachedAt: string; payload: ScanHubResult };
      } catch {
        return null;
      }
    },
    [buildCacheKey]
  );

  const writeCache = useCallback(
    (payload: ScanHubResult, input?: { query?: string; barcode?: string; territory?: TerritoryCode }) => {
      safeLocalStorage.setItem(
        buildCacheKey(input),
        JSON.stringify({ cachedAt: new Date().toISOString(), payload })
      );
    },
    [buildCacheKey]
  );

  const fetchProduct = useCallback(async (ean: string) => {
    try {
      const response = await fetch(`/api/product?barcode=${encodeURIComponent(ean)}`);
      if (response.status === 404) {
        setProduct(null);
        setProductState('not_found');
        return;
      }
      if (!response.ok) throw new Error('product_fetch_failed');
      const payload = (await response.json()) as { product?: ProductSnapshot };
      setProduct(payload.product ?? null);
      setProductState('idle');
    } catch {
      setProductState('error');
    }
  }, []);

  const runSearch = useCallback(
    async (input?: { query?: string; barcode?: string; territory?: TerritoryCode }) => {
      const nextQuery = input?.query ?? query;
      const nextBarcode = input?.barcode ?? barcode;
      const nextTerritory = input?.territory ?? territory;
      const trimmedQuery = nextQuery.trim();
      const trimmedBarcode = nextBarcode.trim();

      setLoading(true);
      setError(null);
      setCachedAt(null);
      setResult({ status: 'LOADING' });
      setQuery(nextQuery);
      setBarcode(nextBarcode);
      setTerritory(nextTerritory);

      if (trimmedBarcode) {
        void fetchProduct(trimmedBarcode);
      } else {
        setProduct(null);
        setProductState('idle');
      }

      try {
        const response = await searchProductPrices({
          barcode: trimmedBarcode || undefined,
          query: trimmedQuery || undefined,
          territory: nextTerritory,
        });
        const mapped = mapPriceSearchResult(response);
        setResult(mapped);
        writeCache(mapped, {
          query: trimmedQuery,
          barcode: trimmedBarcode,
          territory: nextTerritory,
        });
      } catch (searchError) {
        console.warn('Price search failed', searchError);
        setError('Impossible de récupérer les données, réessayez.');
      } finally {
        setLoading(false);
      }
    },
    [barcode, fetchProduct, query, territory, writeCache]
  );

  useEffect(() => {
    if (hasAutoSearched) return;
    if (!barcode.trim() && !query.trim()) return;
    const cached = readCache({ query, barcode, territory });
    if (cached?.payload) {
      setResult(cached.payload);
      setCachedAt(cached.cachedAt);
    }
    void runSearch();
    setHasAutoSearched(true);
  }, [barcode, hasAutoSearched, query, readCache, runSearch, territory]);

  useEffect(() => {
    if (!barcode.trim()) {
      setReports([]);
      return;
    }
    setReports(getReportsByBarcode(barcode.trim()));
  }, [barcode]);

  useEffect(() => {
    if (!product || !barcode.trim()) return;
    const interval = result && 'data' in result ? result.data.prices?.[0] : undefined;
    const entry: LocalProductItem = {
      barcode: barcode.trim(),
      title: product.name || 'Produit',
      brand: product.brand || undefined,
      imageUrl: resolveProductImage(product),
      territory,
      median: interval?.median ?? undefined,
      lastPrice: interval?.max ?? undefined,
      lastSeenAt: new Date().toISOString(),
    };
    setHistory(pushHistory(entry));
  }, [barcode, product, result, territory]);

  useEffect(() => {
    if (loading || (!result && !error)) return;
    resultAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setHighlightResult(true);
    const timeoutId = window.setTimeout(() => setHighlightResult(false), 900);
    return () => window.clearTimeout(timeoutId);
  }, [loading, result, error]);

  const handleReset = () => {
    setResult(null);
    setError(null);
    setProduct(null);
    setProductState('idle');
    setQuery('');
    setBarcode('');
    setCachedAt(null);
    setReports([]);
  };

  const currentFavorite = barcode.trim() ? isFavorite(barcode.trim()) : false;

  const toggleCurrentFavorite = () => {
    if (!barcode.trim() || !product) return;
    const interval = result && 'data' in result ? result.data.prices?.[0] : undefined;
    const item: LocalProductItem = {
      barcode: barcode.trim(),
      title:
        product.name ||
        (result?.status === 'OK'
          ? (result as { data?: ScanData }).data?.productName || 'Produit'
          : 'Produit'),
      brand: product.brand || undefined,
      imageUrl: resolveProductImage(product),
      territory,
      median: interval?.median ?? undefined,
      lastPrice: interval?.max ?? undefined,
      lastSeenAt: new Date().toISOString(),
    };
    setFavorites(toggleFavorite(item));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-10">
      <Helmet>
        <title>Recherche produits & prix réels</title>
      </Helmet>

      <div className="max-w-4xl mx-auto space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold">Recherche produits & prix réels</h1>
          <p className="text-slate-300">Saisissez un produit ou scannez un code-barres pour voir les observations locales.</p>
          <Link to="/mes-listes" className="text-sm text-blue-300 hover:text-blue-200">→ Ouvrir Mes listes</Link>
        </header>

        <section className="bg-slate-900/70 border border-slate-700 rounded-2xl p-6">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (canSearch) void runSearch();
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="space-y-2 text-sm">
                <span className="text-slate-300">Code-barres (EAN)</span>
                <input
                  value={barcode}
                  onChange={(event) => setBarcode(event.target.value)}
                  placeholder="Scannez ou collez un EAN"
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-3 text-white"
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
              </label>
              <label className="space-y-2 text-sm">
                <span className="text-slate-300">Nom produit</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Ex : riz, lait, eau..."
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-3 text-white"
                />
              </label>
            </div>
            <label className="space-y-2 text-sm block">
              <span className="text-slate-300">Territoire</span>
              <select
                value={territory}
                onChange={(event) => setTerritory(event.target.value as TerritoryCode)}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-3 text-white"
              >
                {TERRITORIES.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={!canSearch}
                className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-400 rounded-lg font-semibold"
              >
                {loading ? 'Recherche en cours...' : 'Rechercher'}
              </button>
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-semibold"
              >
                📷 Scanner
              </button>
              {(hasSearchInput || result || error) && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-semibold"
                >
                  Effacer
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900/70 border border-slate-700 rounded-2xl p-4">
            <h2 className="font-semibold">Récents</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {history.slice(0, 5).map((item) => (
                <li key={`recent-${item.barcode}`}>
                  <button type="button" className="text-left w-full text-blue-300 hover:text-blue-200" onClick={() => void runSearch({ barcode: item.barcode, query: '' })}>
                    {item.title} <span className="text-slate-400">({item.barcode})</span>
                  </button>
                </li>
              ))}
              {history.length === 0 && <li className="text-slate-400">Aucun produit récent.</li>}
            </ul>
          </div>

          <div className="bg-slate-900/70 border border-slate-700 rounded-2xl p-4">
            <h2 className="font-semibold">Favoris</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {favorites.map((item) => (
                <li key={`fav-${item.barcode}`}>
                  <button type="button" className="text-left w-full text-amber-300 hover:text-amber-200" onClick={() => void runSearch({ barcode: item.barcode, query: '' })}>
                    {item.title} <span className="text-slate-400">({item.barcode})</span>
                  </button>
                </li>
              ))}
              {favorites.length === 0 && <li className="text-slate-400">Aucun favori.</li>}
            </ul>
          </div>
        </section>

        <div ref={resultAnchorRef} className={highlightResult ? 'ring-2 ring-blue-400 rounded-2xl transition' : ''}>
          {productState === 'not_found' && (
            <div className="bg-amber-900/20 border border-amber-700 rounded-2xl p-4 text-sm text-amber-200 mb-4">
              Produit introuvable dans la base Open Food Facts pour ce code-barres.
            </div>
          )}
          {productState === 'error' && (
            <div className="bg-slate-900/70 border border-slate-700 rounded-2xl p-4 text-sm text-slate-200 mb-4">
              Impossible de récupérer les informations produit pour le moment.
            </div>
          )}
          {loading && <ResultSkeleton />}
          {!loading && error && (
            <div className="bg-red-900/30 border border-red-700 rounded-2xl p-6 text-center">
              <p className="text-red-200">{error}</p>
            </div>
          )}
          {!loading && !error && result && (
            <PriceSearchResults
              result={result}
              product={product}
              barcode={barcode.trim()}
              territory={territory}
              onReset={handleReset}
              onScanTicket={() => navigate('/scan')}
              onReturnToHub={() => navigate('/scanner')}
              onToggleFavorite={toggleCurrentFavorite}
              favorite={currentFavorite}
              reports={reports}
              onOpenReport={() => setIsReportOpen(true)}
              onOpenReports={() => setShowAllReports(true)}
            />
          )}
        </div>

        {cachedAt && !loading && (
          <div className="bg-emerald-900/20 border border-emerald-700 rounded-2xl p-4 text-sm text-emerald-200">
            Résultat affiché depuis le cache local ({formatCachedLabel(cachedAt)}).
          </div>
        )}
      </div>

      {isScannerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 p-4 overflow-auto">
          <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-700 rounded-2xl p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold">Scanner un code-barres</h2>
              <button
                type="button"
                onClick={() => setIsScannerOpen(false)}
                className="px-3 py-1 bg-slate-800 rounded-lg"
              >
                Fermer
              </button>
            </div>
            <Suspense fallback={<ResultSkeleton />}>
              <LazyBarcodeScanner
                onScan={(code) => {
                  setIsScannerOpen(false);
                  void runSearch({ barcode: code, query: '' });
                }}
                onClose={() => setIsScannerOpen(false)}
              />
            </Suspense>
          </div>
        </div>
      )}

      <ReportPriceModal
        isOpen={isReportOpen}
        barcode={barcode.trim()}
        territory={territory}
        onClose={() => setIsReportOpen(false)}
        onSaved={() => {
          setReports(getReportsByBarcode(barcode.trim()));
        }}
      />

      {showAllReports && (
        <div className="fixed inset-0 z-50 bg-black/60 p-4 overflow-auto">
          <div className="max-w-lg mx-auto bg-slate-900 border border-slate-700 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Tous vos signalements</h2>
              <button type="button" onClick={() => setShowAllReports(false)} className="px-3 py-1 bg-slate-800 rounded-lg">Fermer</button>
            </div>
            <ul className="space-y-2 text-sm">
              {reports.map((report) => (
                <li key={report.id} className="bg-slate-950 rounded-lg p-3">
                  <p>{report.price.toFixed(2)}€ • {report.unit ?? 'unit'} • {report.observedAt}</p>
                  <p className="text-xs text-slate-400">{report.store || 'Magasin non précisé'} • {report.city || 'Ville non précisée'}</p>
                </li>
              ))}
              {reports.length === 0 && <li className="text-slate-400">Aucun signalement.</li>}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function mapPriceSearchResult(input: PriceSearchResult): ScanHubResult {
  if (input.status === 'NO_DATA') return { status: 'NO_DATA', reason: input.warnings?.[0] };
  if (input.status === 'UNAVAILABLE') return { status: 'UNAVAILABLE', service: 'prix-reels' };

  const data: ScanData = {
    productName: input.productName,
    prices: input.intervals,
    territory: input.territory,
    confidence: input.confidence,
    sourcesUsed: input.sourcesUsed,
    warnings: input.warnings,
    territoryMessage: input.metadata.territoryMessage,
    observations: input.observations.map((observation) => ({
      source: normalizeObservationSource(observation.source),
      price: observation.price,
      observedAt: observation.observedAt,
      normalizedLabel: observation.normalizedLabel,
    })),
  };

  if (input.status === 'PARTIAL') return { status: 'PARTIAL', data };
  return { status: 'OK', data };
}
