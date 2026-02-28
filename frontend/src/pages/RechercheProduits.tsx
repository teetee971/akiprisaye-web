/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import FavoritesPanel from '../components/search/FavoritesPanel';
import SearchHistoryPanel from '../components/search/SearchHistoryPanel';
import { useFavorites, type FavoriteItem } from '../hooks/useFavorites';
import { useSearchHistory, type SearchHistoryEntry, type SearchHistoryType } from '../hooks/useSearchHistory';
import { searchProductPrices } from '../services/priceSearch/priceSearch.service';
import type { PriceSearchResult, TerritoryCode } from '../services/priceSearch/price.types';
import type { ScanData, ScanHubResult } from '../types/scanHubResult';
import type { ProductCard } from '../types/productCard';
import { TipsPanel } from '../features/tips/ui/TipsPanel';
import type { TipContext } from '../features/tips';
import { getProductImageFallback } from '../utils/productImageFallback';
import { safeLocalStorage } from '../utils/safeLocalStorage';

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

const buildSearchLabel = (queryValue: string, barcodeValue: string) => {
  if (queryValue && barcodeValue) {
    return `${queryValue} (EAN ${barcodeValue})`;
  }
  if (barcodeValue) {
    return `EAN ${barcodeValue}`;
  }
  return queryValue || 'Recherche';
};

const buildProductFavoriteId = (params: {
  barcode?: string;
  query?: string;
  productName?: string;
}) => {
  const normalizedBarcode = params.barcode?.trim();
  if (normalizedBarcode) {
    return `product:barcode:${normalizedBarcode}`;
  }
  const normalizedQuery = params.query?.trim().toLowerCase();
  if (normalizedQuery) {
    return `product:query:${normalizedQuery}`;
  }
  const normalizedName = params.productName?.trim().toLowerCase() ?? 'unknown';
  return `product:name:${normalizedName}`;
};

interface ApiPriceObservation {
  source?: string;
  price?: number;
  observedAt?: string;
}

interface ApiPricesResponse {
  observations?: ApiPriceObservation[];
}

export function SafeFallback({
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
    <div
      className="bg-slate-900/70 border border-slate-700 rounded-2xl p-6 space-y-4"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl" aria-hidden="true">
          ℹ️
        </div>
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-slate-300 mt-1">{message}</p>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-3 text-sm">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
          >
            {action.label}
          </button>
        ))}
        <button
          type="button"
          onClick={onReturnToHub}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg"
        >
          🏠 Retour au ScanHub
        </button>
      </div>
    </div>
  );
}

export function NoPriceDataState({
  onRetry,
  onScanTicket,
  onReturnToHub,
}: {
  onRetry: () => void;
  onScanTicket: () => void;
  onReturnToHub: () => void;
}) {
  return (
    <SafeFallback
      title="Aucune donnée de prix disponible"
      message="Nous n’avons pas encore suffisamment de données fiables dans votre territoire. Le service continue de s’enrichir automatiquement."
      actions={[
        { label: '🔄 Rechercher un autre produit', onClick: onRetry },
        { label: '📷 Scanner un ticket ou une étiquette', onClick: onScanTicket },
      ]}
      onReturnToHub={onReturnToHub}
    />
  );
}

export function LoadingState() {
  return (
    <div
      className="bg-slate-900/70 border border-slate-700 rounded-2xl p-6 text-center"
      role="status"
      aria-live="polite"
    >
      <p className="text-slate-200">Recherche en cours...</p>
    </div>
  );
}

export function UnknownState({ onReturnToHub }: { onReturnToHub: () => void }) {
  return (
    <SafeFallback
      title="Information indisponible"
      message="Le service fonctionne, mais aucune donnée exploitable n’a été trouvée."
      actions={[{ label: 'Réessayer', onClick: onReturnToHub }]}
      onReturnToHub={onReturnToHub}
    />
  );
}

function formatCachedLabel(cachedAt: string) {
  const cachedDate = new Date(cachedAt);
  if (Number.isNaN(cachedDate.getTime())) {
    return 'Date inconnue';
  }
  return cachedDate.toLocaleString('fr-FR');
}

export function PriceUnavailableState({
  onRetry,
  onReturnToHub,
}: {
  onRetry: () => void;
  onReturnToHub: () => void;
}) {
  return (
    <SafeFallback
      title="Prix momentanément indisponibles"
      message="Le service ne peut pas répondre pour le moment. Vous pouvez réessayer ou revenir au ScanHub."
      actions={[{ label: '🔄 Réessayer', onClick: onRetry }]}
      onReturnToHub={onReturnToHub}
    />
  );
}

export function PartialPriceState({
  result,
  onRetry,
  onReturnToHub,
}: {
  result: Partial<ScanData>;
  onRetry: () => void;
  onReturnToHub: () => void;
}) {
  const interval = result.prices?.[0];
  const formatRange = (value: number | null) => (value === null ? '—' : `${value.toFixed(2)}€`);
  const confidence = result.confidence ?? 0;
  const observations = interval?.priceCount ?? 0;
  const territoryLabel = getTerritoryLabel(result.territory);

  return (
    <div
      className="bg-slate-900/70 border border-slate-700 rounded-2xl p-6 space-y-4"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl" aria-hidden="true">
          🟡
        </div>
        <div>
          <h2 className="text-lg font-semibold">Données partielles</h2>
          <p className="text-sm text-slate-300 mt-1">
            Les prix disponibles sont incomplets ou peu récents. Ils restent indicatifs.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div className="bg-slate-950 rounded-lg p-4">
          <p className="text-xs text-slate-400">Indice de confiance</p>
          <p className="text-xl font-semibold">{confidence}/100</p>
          <div className="h-2 bg-slate-800 rounded-full mt-2">
            <div
              className="h-2 rounded-full bg-amber-400"
              style={{ width: `${Math.min(confidence, 100)}%` }}
            />
          </div>
        </div>
        <div className="bg-slate-950 rounded-lg p-4">
          <p className="text-xs text-slate-400">Observations</p>
          <p className="text-xl font-semibold">{observations}</p>
          <p className="text-xs text-slate-500 mt-1">Sources: {result.sourcesUsed?.length ?? 0}</p>
        </div>
        <div className="bg-slate-950 rounded-lg p-4">
          <p className="text-xs text-slate-400">Territoire</p>
          <p className="text-base font-semibold">{territoryLabel}</p>
          <p className="text-xs text-slate-500 mt-1">Lecture locale</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div className="bg-slate-950 rounded-lg p-4">
          <p className="text-xs text-slate-400">Prix minimum</p>
          <p className="text-xl font-semibold">{formatRange(interval?.min ?? null)}</p>
        </div>
        <div className="bg-slate-950 rounded-lg p-4">
          <p className="text-xs text-slate-400">Prix médian</p>
          <p className="text-xl font-semibold">{formatRange(interval?.median ?? null)}</p>
        </div>
        <div className="bg-slate-950 rounded-lg p-4">
          <p className="text-xs text-slate-400">Prix maximum</p>
          <p className="text-xl font-semibold">{formatRange(interval?.max ?? null)}</p>
        </div>
      </div>
      {result.warnings && result.warnings.length > 0 && (
        <div className="text-xs text-slate-300 bg-slate-950 rounded-lg p-3">
          {result.warnings.join(' ')}
        </div>
      )}
      <div className="flex flex-col md:flex-row gap-3 text-sm">
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
        >
          🔄 Relancer la recherche
        </button>
        <button
          type="button"
          onClick={onReturnToHub}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg"
        >
          🏠 Retour au ScanHub
        </button>
      </div>
    </div>
  );
}

export function PriceResults({
  result,
  searchQuery,
  searchBarcode,
  onReset,
  onScanTicket,
  onReturnToHub,
  onFavoriteToast,
}: {
  result: ScanData;
  searchQuery?: string;
  searchBarcode?: string;
  onReset: () => void;
  onScanTicket: () => void;
  onReturnToHub: () => void;
  onFavoriteToast?: (message: string) => void;
}) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const formatRange = (value: number | null) => (value === null ? '—' : `${value.toFixed(2)}€`);

  const interval = result.prices?.[0];
  const confidence = result.confidence ?? 0;
  const observations = interval?.priceCount ?? 0;
  const territoryLabel = getTerritoryLabel(result.territory);
  const favoriteId = buildProductFavoriteId({
    barcode: searchBarcode,
    query: searchQuery,
    productName: result.productName,
  });
  const favoriteLabel = searchQuery?.trim() || searchBarcode?.trim()
    ? buildSearchLabel(searchQuery?.trim() ?? '', searchBarcode?.trim() ?? '')
    : result.productName || 'Produit favori';
  const favoriteActive = isFavorite(favoriteId);
  const [productCard, setProductCard] = useState<ProductCard | null>(null);
  const [apiPrices, setApiPrices] = useState<ApiPriceObservation[]>([]);

  useEffect(() => {
    const barcode = searchBarcode?.trim();
    if (!barcode) {
      setProductCard(null);
      setApiPrices([]);
      return;
    }

    const controller = new AbortController();
    const territory = (result.territory ?? 'fr').trim();

    const loadProductCard = async () => {
      try {
        const response = await fetch(`/api/product?barcode=${encodeURIComponent(barcode)}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          setProductCard(null);
          return;
        }
        const payload = (await response.json()) as { product?: ProductCard };
        setProductCard(payload.product ?? null);
      } catch {
        setProductCard(null);
      }
    };

    const loadPrices = async () => {
      try {
        const response = await fetch(
          `/api/prices?barcode=${encodeURIComponent(barcode)}&territory=${encodeURIComponent(territory)}`,
          { signal: controller.signal },
        );
        if (!response.ok) {
          setApiPrices([]);
          return;
        }
        const payload = (await response.json()) as ApiPricesResponse;
        setApiPrices(Array.isArray(payload.observations) ? payload.observations : []);
      } catch {
        setApiPrices([]);
      }
    };

    void Promise.all([loadProductCard(), loadPrices()]);
    return () => controller.abort();
  }, [result.territory, searchBarcode]);

  const productTitle = productCard?.title || result.productName || 'Produit analysé';
  const productImages = productCard?.images ?? [];

  const rawPricedObservations = useMemo(
    () =>
      apiPrices.filter(
        (item): item is ApiPriceObservation & { price: number } =>
          typeof item.price === 'number' && Number.isFinite(item.price) && item.price > 0,
      ),
    [apiPrices],
  );

  const baselineMedian = useMemo(() => {
    if (rawPricedObservations.length === 0) return null;

    const sorted = [...rawPricedObservations].sort((a, b) => a.price - b.price);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 1
      ? sorted[middle].price
      : (sorted[middle - 1].price + sorted[middle].price) / 2;
  }, [rawPricedObservations]);

  const filteredObservations = useMemo(() => {
    if (!baselineMedian) return rawPricedObservations;
    return rawPricedObservations.filter((entry) => entry.price <= baselineMedian * 5);
  }, [baselineMedian, rawPricedObservations]);

  const getFreshnessLabel = useCallback((observedAt?: string) => {
    if (!observedAt) return 'Date non fournie';
    const parsed = new Date(observedAt).getTime();
    if (!Number.isFinite(parsed)) return 'Date non fournie';

    const diffDays = (Date.now() - parsed) / (1000 * 60 * 60 * 24);
    if (diffDays <= 7) return 'Récent';
    if (diffDays <= 30) return 'À vérifier';
    return 'Ancien';
  }, []);

  const latestObservation = useMemo(() => {
    const dated = filteredObservations
      .filter((entry) => entry.observedAt)
      .map((entry) => ({
        ...entry,
        timestamp: new Date(entry.observedAt as string).getTime(),
      }))
      .filter((entry) => Number.isFinite(entry.timestamp))
      .sort((a, b) => b.timestamp - a.timestamp);

    return dated[0] ?? null;
  }, [filteredObservations]);

  const priceSummary = useMemo(() => {
    if (filteredObservations.length === 0) return null;

    const sorted = [...filteredObservations].sort((a, b) => a.price - b.price);
    const middle = Math.floor(sorted.length / 2);
    const median =
      sorted.length % 2 === 1
        ? sorted[middle].price
        : (sorted[middle - 1].price + sorted[middle].price) / 2;

    const latest = latestObservation?.observedAt
      ? new Date(latestObservation.observedAt).toLocaleDateString('fr-FR')
      : 'Date non fournie';

    return {
      min: sorted[0].price,
      max: sorted[sorted.length - 1].price,
      median,
      count: sorted.length,
      latest,
      freshness: getFreshnessLabel(latestObservation?.observedAt),
    };
  }, [filteredObservations, getFreshnessLabel, latestObservation]);

  const recentPriceBadge = useMemo(() => {
    if (!priceSummary || !latestObservation) return null;
    const latest = latestObservation.price;

    if (latest <= priceSummary.median * 0.95) {
      return { label: 'Prix bas', className: 'text-emerald-200 bg-emerald-500/10 border-emerald-500/30' };
    }

    if (latest >= priceSummary.median * 1.05) {
      return { label: 'Prix élevé', className: 'text-rose-200 bg-rose-500/10 border-rose-500/30' };
    }

    return { label: 'Prix moyen', className: 'text-blue-200 bg-blue-500/10 border-blue-500/30' };
  }, [latestObservation, priceSummary]);

  const chartPoints = useMemo(() => {
    const dated = filteredObservations
      .filter((entry) => entry.observedAt)
      .map((entry) => ({ price: entry.price, ts: new Date(entry.observedAt as string).getTime() }))
      .filter((entry) => Number.isFinite(entry.ts))
      .sort((a, b) => a.ts - b.ts);

    if (dated.length < 2) return '';

    const width = 320;
    const height = 80;
    const minPrice = Math.min(...dated.map((entry) => entry.price));
    const maxPrice = Math.max(...dated.map((entry) => entry.price));
    const priceRange = maxPrice - minPrice || 1;

    return dated
      .map((entry, index) => {
        const x = (index / (dated.length - 1)) * width;
        const y = height - ((entry.price - minPrice) / priceRange) * height;
        return `${x},${y}`;
      })
      .join(' ');
  }, [filteredObservations]);

  const tipsContext = useMemo<TipContext>(() => {
    const normalizedQuery = searchQuery?.trim();
    const normalizedProductName = result.productName?.trim();

    return {
      territory: result.territory,
      category: normalizedProductName,
      query: normalizedQuery,
      price: latestObservation?.price,
      interval: priceSummary
        ? {
            min: priceSummary.min,
            median: priceSummary.median,
            max: priceSummary.max,
          }
        : undefined,
      currency: 'EUR',
      unit: 'unit',
      month: new Date().getMonth() + 1,
    };
  }, [latestObservation?.price, priceSummary, result.productName, result.territory, searchQuery]);

  return (
    <section className="space-y-4">
      <div className="bg-slate-900/70 border border-slate-700 rounded-2xl p-6 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold">
              {productTitle}
            </h2>
            <p className="text-sm text-slate-400">
              Confiance: {confidence}/100 • Sources: {result.sourcesUsed?.length ?? 0}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm text-emerald-200 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-1">
              📍 {territoryLabel}
            </div>
            <div className="text-sm text-slate-200 bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-1">
              Prix observés localement
            </div>
            <button
              type="button"
              onClick={() => {
                const message = favoriteActive ? 'Favori retiré' : '⭐ Ajouté aux favoris';
                toggleFavorite({
                  id: favoriteId,
                  label: favoriteLabel || result.productName || 'Produit favori',
                  type: 'product',
                  barcode: searchBarcode?.trim() || undefined,
                  query: searchQuery?.trim() || undefined,
                  productName: result.productName,
                  route:
                    searchBarcode?.trim() || searchQuery?.trim()
                      ? `/recherche-produits?${new URLSearchParams({
                          ...(searchBarcode?.trim() ? { ean: searchBarcode.trim() } : {}),
                          ...(searchQuery?.trim() ? { q: searchQuery.trim() } : {}),
                        }).toString()}`
                      : undefined,
                });
                onFavoriteToast?.(message);
              }}
              className={`px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                favoriteActive
                  ? 'bg-amber-400/20 border-amber-400 text-amber-200'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-amber-200'
              }`}
              aria-pressed={favoriteActive}
            >
              {favoriteActive ? '⭐ Favori' : '☆ Favori'}
            </button>
          </div>
        </div>

        {productImages.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {productImages.map((img) => (
              <img
                key={img.url}
                src={img.url}
                alt={productTitle}
                className="rounded-xl object-cover w-full h-32 bg-slate-800"
                loading="lazy"
                onError={(event) => {
                  event.currentTarget.src = getProductImageFallback({ productName: productTitle });
                }}
              />
            ))}
          </div>
        ) : (
          <img
            src={getProductImageFallback({ productName: productTitle })}
            alt={productTitle}
            className="rounded-xl object-cover w-full h-40 bg-slate-800"
            loading="lazy"
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="bg-slate-950 rounded-lg p-4">
            <p className="text-xs text-slate-400">Indice de confiance</p>
            <p className="text-xl font-semibold">{confidence}/100</p>
            <div className="h-2 bg-slate-800 rounded-full mt-2">
              <div
                className="h-2 rounded-full bg-emerald-400"
                style={{ width: `${Math.min(confidence, 100)}%` }}
              />
            </div>
          </div>
          <div className="bg-slate-950 rounded-lg p-4">
            <p className="text-xs text-slate-400">Observations</p>
            <p className="text-xl font-semibold">{filteredObservations.length || observations}</p>
            <p className="text-xs text-slate-500 mt-1">Prix agrégés</p>
          </div>
          <div className="bg-slate-950 rounded-lg p-4">
            <p className="text-xs text-slate-400">Territoire</p>
            <p className="text-base font-semibold">{territoryLabel}</p>
            <p className="text-xs text-slate-500 mt-1">Données locales</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="bg-slate-950 rounded-lg p-4">
            <p className="text-xs text-slate-400">Prix minimum</p>
            <p className="text-xl font-semibold">{formatRange(interval?.min ?? null)}</p>
          </div>
          <div className="bg-slate-950 rounded-lg p-4">
            <p className="text-xs text-slate-400">Prix médian</p>
            <p className="text-xl font-semibold">{formatRange(interval?.median ?? null)}</p>
          </div>
          <div className="bg-slate-950 rounded-lg p-4">
            <p className="text-xs text-slate-400">Prix maximum</p>
            <p className="text-xl font-semibold">{formatRange(interval?.max ?? null)}</p>
          </div>
        </div>

        {result.territoryMessage && (
          <div className="text-xs text-orange-200 bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
            {result.territoryMessage}
          </div>
        )}

        <div className="text-xs text-slate-400">
          Sources utilisées : {result.sourcesUsed?.join(', ') || 'Aucune'}
        </div>
      </div>

      <div className="bg-slate-900/70 border border-slate-700 rounded-2xl p-6 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-200">Observations de prix réelles</h3>
          <span className="text-xs text-slate-400">Prix observés en {territoryLabel}</span>
          {recentPriceBadge && (
            <span className={`text-xs border rounded-full px-2 py-1 ${recentPriceBadge.className}`}>
              {recentPriceBadge.label}
            </span>
          )}
        </div>

        {priceSummary && (
          <div className="bg-slate-950 rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
              <div>
                <div className="text-xs text-slate-400">Min</div>
                <div className="font-semibold">{priceSummary.min.toFixed(2)} €</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Médiane</div>
                <div className="font-semibold">{priceSummary.median.toFixed(2)} €</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Max</div>
                <div className="font-semibold">{priceSummary.max.toFixed(2)} €</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Observations</div>
                <div className="font-semibold">{priceSummary.count}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Dernier relevé</div>
                <div className="font-semibold">{priceSummary.latest}</div>
                <div className="text-[11px] text-slate-400">{priceSummary.freshness}</div>
              </div>
            </div>

            {chartPoints && (
              <svg viewBox="0 0 320 80" className="w-full h-20" role="img" aria-label="Historique des prix observés">
                <polyline
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="2.5"
                  points={chartPoints}
                />
              </svg>
            )}

            <TipsPanel ctx={tipsContext} />
          </div>
        )}

        {filteredObservations.length > 0 ? (
          <div className="space-y-2">
            {filteredObservations.map((price, index) => {
              const label = price.observedAt
                ? new Date(price.observedAt).toLocaleDateString('fr-FR')
                : 'Date non fournie';

              const freshness = getFreshnessLabel(price.observedAt);

              return (
                <div key={`${price.source ?? 'source'}-${index}`} className="flex items-center justify-between bg-slate-950 p-3 rounded-lg text-sm">
                  <span className="text-slate-300">{price.source ?? 'source inconnue'} • {label} • {freshness}</span>
                  <span className="font-semibold text-white">{typeof price.price === 'number' ? `${price.price.toFixed(2)} €` : '—'}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-400">Aucun prix récent disponible.</p>
        )}
      </div>

      {result.warnings && result.warnings.length > 0 && (
        <div className="bg-slate-900/70 border border-slate-700 rounded-2xl p-6 space-y-2">
          <h3 className="text-sm font-semibold text-slate-200">Informations</h3>
          <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
            {result.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export function PriceSearchResults({
  result,
  searchQuery,
  searchBarcode,
  onReset,
  onScanTicket,
  onReturnToHub,
  onFavoriteToast,
}: {
  result: ScanHubResult | null;
  searchQuery?: string;
  searchBarcode?: string;
  onReset: () => void;
  onScanTicket: () => void;
  onReturnToHub: () => void;
  onFavoriteToast?: (message: string) => void;
}) {
  if (!result) {
    return <LoadingState />;
  }

  switch (result.status) {
    case 'LOADING':
      return <LoadingState />;
    case 'NO_DATA':
      return (
        <NoPriceDataState
          onRetry={onReset}
          onScanTicket={onScanTicket}
          onReturnToHub={onReturnToHub}
        />
      );
    case 'UNAVAILABLE':
      return <PriceUnavailableState onRetry={onReset} onReturnToHub={onReturnToHub} />;
    case 'PARTIAL':
      return (
        <PartialPriceState
          result={result.data}
          onRetry={onReset}
          onReturnToHub={onReturnToHub}
        />
      );
    case 'OK':
      return (
        <PriceResults
          result={result.data}
          searchQuery={searchQuery}
          searchBarcode={searchBarcode}
          onReset={onReset}
          onScanTicket={onScanTicket}
          onReturnToHub={onReturnToHub}
          onFavoriteToast={onFavoriteToast}
        />
      );
    default:
      return <UnknownState onReturnToHub={onReturnToHub} />;
  }
}

export default function RechercheProduits() {
  const params = useMemo(
    () => new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search),
    [],
  );
  const navigate = useNavigate();
  const { history, addEntry, removeEntry, clearHistory } = useSearchHistory();
  const { favorites, removeFavorite } = useFavorites();
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [barcode, setBarcode] = useState(params.get('ean') ?? '');
  const [territory, setTerritory] = useState<TerritoryCode>('fr');
  const [result, setResult] = useState<ScanHubResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAutoSearched, setHasAutoSearched] = useState(false);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const hasSearchInput = Boolean(barcode.trim() || query.trim());
  const canSearch = hasSearchInput && !loading;
  const shouldShowReset = hasSearchInput || Boolean(result) || Boolean(error);
  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 1400);
  }, []);

  const buildCacheKey = useCallback((input?: {
    query?: string;
    barcode?: string;
    territory?: TerritoryCode;
  }) => {
    const normalizedQuery = (input?.query ?? query).trim().toLowerCase();
    const normalizedBarcode = (input?.barcode ?? barcode).trim();
    const normalizedTerritory = input?.territory ?? territory;
    return `scanhub:price-search:${normalizedTerritory}:${normalizedBarcode || 'no-barcode'}:${normalizedQuery || 'no-query'}`;
  }, [barcode, query, territory]);

  const readCache = useCallback((input?: { query?: string; barcode?: string; territory?: TerritoryCode }) => {
    const key = buildCacheKey(input);
    const raw = safeLocalStorage.getItem(key);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as { cachedAt: string; payload: ScanHubResult };
      return parsed;
    } catch {
      return null;
    }
  }, [buildCacheKey]);

  const writeCache = useCallback(
    (payload: ScanHubResult, input?: { query?: string; barcode?: string; territory?: TerritoryCode }) => {
      const key = buildCacheKey(input);
      const cachedPayload = JSON.stringify({
        cachedAt: new Date().toISOString(),
        payload,
      });
      safeLocalStorage.setItem(key, cachedPayload);
    },
    [buildCacheKey]
  );

  const runSearch = useCallback(async (input?: {
    query?: string;
    barcode?: string;
    territory?: TerritoryCode;
    source?: SearchHistoryType;
    label?: string;
    recordHistory?: boolean;
  }) => {
    const nextQuery = input?.query ?? query;
    const nextBarcode = input?.barcode ?? barcode;
    const nextTerritory = input?.territory ?? territory;
    const trimmedQuery = nextQuery.trim();
    const trimmedBarcode = nextBarcode.trim();
    const hasInput = Boolean(trimmedQuery || trimmedBarcode);

    if (input?.source && hasInput && input.recordHistory !== false) {
      addEntry({
        label: input.label ?? buildSearchLabel(trimmedQuery, trimmedBarcode),
        type: input.source,
        query: trimmedQuery || undefined,
        barcode: trimmedBarcode || undefined,
      });
    }

    setQuery(nextQuery);
    setBarcode(nextBarcode);
    setTerritory(nextTerritory);

    setLoading(true);
    setError(null);
    setResult(null);
    setCachedAt(null);

    try {
      const response = await searchProductPrices({
        barcode: trimmedBarcode || undefined,
        query: trimmedQuery || undefined,
        territory: nextTerritory,
      });
      const mapped = mapPriceSearchResult(response);
      setResult(mapped);
      writeCache(mapped, { query: trimmedQuery, barcode: trimmedBarcode, territory: nextTerritory });
    } catch (err: any) {
      console.error('Price search error:', err);
      setError('Impossible de récupérer les prix pour le moment.');
    } finally {
      setLoading(false);
    }
  }, [addEntry, barcode, query, territory, writeCache]);

  const handleSearch = useCallback(async () => {
    const searchType = barcode.trim() ? 'barcode' : 'text';
    return runSearch({ source: searchType });
  }, [barcode, runSearch]);

  useEffect(() => {
    if (hasAutoSearched) {
      return;
    }
    if (!barcode.trim() && !query.trim()) {
      return;
    }
    const cached = readCache({ query, barcode, territory });
    if (cached?.payload) {
      setResult(cached.payload);
      setCachedAt(cached.cachedAt);
    }
    void runSearch({ source: barcode.trim() ? 'barcode' : 'text', recordHistory: false });
    setHasAutoSearched(true);
  }, [barcode, query, hasAutoSearched, readCache, runSearch, territory]);

  const handleReset = () => {
    setResult(null);
    setError(null);
    setQuery('');
    setBarcode('');
    setCachedAt(null);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleReplayHistory = (entry: SearchHistoryEntry) => {
    void runSearch({
      query: entry.query ?? '',
      barcode: entry.barcode ?? '',
      source: entry.type,
      label: entry.label,
    });
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleViewFavorite = (favorite: FavoriteItem) => {
    if (favorite.type === 'comparison' && favorite.route) {
      navigate(favorite.route);
      return;
    }
    if (favorite.barcode || favorite.query) {
      void runSearch({
        query: favorite.query ?? '',
        barcode: favorite.barcode ?? '',
        source: favorite.barcode ? 'barcode' : 'text',
        label: favorite.label,
      });
      return;
    }
    if (favorite.route) {
      navigate(favorite.route);
    }
  };
  const handleRemoveFavorite = (id: string) => {
    removeFavorite(id);
    showToast('Favori retiré');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-10">
      <Helmet>
        <title>Recherche produits & prix réels</title>
        <meta
          name="description"
          content="Recherche multi-sources de prix observés, normalisés et contextualisés pour la France et les DOM."
        />
      </Helmet>

      <div className="max-w-4xl mx-auto space-y-8">
        <header className="space-y-3">
          <p className="text-blue-300 text-sm font-semibold">Module ScanHub • Prix observés</p>
          <h1 className="text-3xl md:text-4xl font-bold">
            Recherche produits & prix réels
          </h1>
          <p className="text-slate-300 max-w-2xl">
            Les prix affichés sont des observations anonymisées issues de sources ouvertes.
            Ils sont présentés sous forme de fourchette pour éviter toute confusion.
          </p>
        </header>

        <section className="bg-slate-900/70 border border-slate-700 rounded-2xl p-6 space-y-4">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (canSearch) {
                void handleSearch();
              }
            }}
          >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-2 text-sm">
              <span className="text-slate-300">Code-barres (EAN)</span>
              <input
                value={barcode}
                onChange={(event) => setBarcode(event.target.value)}
                placeholder="Scannez ou collez un EAN"
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white"
                aria-label="Code-barres"
                inputMode="numeric"
                pattern="[0-9]*"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="text-slate-300">Nom produit</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ex : riz 5kg, lait, eau…"
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white"
                aria-label="Nom produit"
              />
            </label>
          </div>
          <label className="space-y-2 text-sm">
            <span className="text-slate-300">Territoire</span>
            <select
              value={territory}
              onChange={(event) => setTerritory(event.target.value as TerritoryCode)}
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white"
              aria-label="Territoire"
            >
              {TERRITORIES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-col md:flex-row gap-3">
            <button
              type="submit"
              disabled={!canSearch}
              className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-400 rounded-lg font-semibold"
            >
              {loading ? 'Recherche en cours...' : 'Lancer la recherche'}
            </button>
            {shouldShowReset && (
              <button
                type="button"
                onClick={handleReset}
                className="w-full md:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-semibold"
              >
                Effacer
              </button>
            )}
          </div>
          {!hasSearchInput && (
            <p className="text-xs text-slate-400">
              Renseignez un code-barres ou un nom de produit pour lancer la comparaison.
            </p>
          )}
          </form>
        </section>

        {loading && (
          <div className="space-y-2 animate-pulse">
            <div className="h-4 rounded-full bg-slate-800/80" />
            <div className="h-4 rounded-full bg-slate-800/60 w-5/6" />
          </div>
        )}

        <SearchHistoryPanel
          entries={history}
          onReplay={handleReplayHistory}
          onRemove={removeEntry}
          onClear={clearHistory}
        />

        <FavoritesPanel favorites={favorites} onView={handleViewFavorite} onRemove={handleRemoveFavorite} />

        <p className="text-xs text-slate-400">
          🔒 Les données restent sur votre appareil.
        </p>

        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 text-sm text-slate-300 space-y-2">
          <h2 className="font-semibold text-white">Conseils ScanHub</h2>
          <ul className="list-disc list-inside space-y-1 text-slate-300">
            <li>Combinez EAN et nom produit pour améliorer la précision.</li>
            <li>Vérifiez le territoire pour comparer des prix réellement observés localement.</li>
            <li>Un indice de confiance élevé signifie des données plus fiables.</li>
          </ul>
        </section>

        {cachedAt && !loading && (
          <div className="bg-emerald-900/20 border border-emerald-700 rounded-2xl p-4 text-sm text-emerald-200">
            Résultat affiché depuis le cache local ({formatCachedLabel(cachedAt)}).
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-2xl p-6 text-center">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {loading && (
          <PriceSearchResults
            result={{ status: 'LOADING' }}
            searchQuery={query}
            searchBarcode={barcode}
            onReset={handleReset}
            onScanTicket={() => navigate('/scanner')}
            onReturnToHub={() => navigate('/scanner')}
            onFavoriteToast={showToast}
          />
        )}
        {!loading && result && (
          <PriceSearchResults
            result={result}
            searchQuery={query}
            searchBarcode={barcode}
            onReset={handleReset}
            onScanTicket={() => navigate('/scanner')}
            onReturnToHub={() => navigate('/scanner')}
            onFavoriteToast={showToast}
          />
        )}
        {toastMessage && (
          <div
            className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-slate-700 text-slate-100 text-sm px-4 py-2 rounded-full shadow-lg"
            role="status"
            aria-live="polite"
          >
            {toastMessage}
          </div>
        )}
      </div>
    </div>
  );
}

function mapPriceSearchResult(input: PriceSearchResult): ScanHubResult {
  if (input.status === 'NO_DATA') {
    return { status: 'NO_DATA', reason: input.warnings?.[0] };
  }
  if (input.status === 'UNAVAILABLE') {
    return { status: 'UNAVAILABLE', service: 'prix-reels' };
  }
  const data: ScanData = {
    productName: input.productName,
    prices: input.intervals,
    territory: input.territory,
    confidence: input.confidence,
    sourcesUsed: input.sourcesUsed,
    warnings: input.warnings,
    territoryMessage: input.metadata.territoryMessage,
  };
  if (input.status === 'PARTIAL') {
    return { status: 'PARTIAL', data };
  }
  return { status: 'OK', data };
}
