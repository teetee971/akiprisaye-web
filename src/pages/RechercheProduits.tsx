import { useEffect, useMemo, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { searchProductPrices } from '../services/priceSearch/priceSearch.service';
import type { PriceSearchResult, TerritoryCode } from '../services/priceSearch/price.types';
import type { ScanData, ScanHubResult } from '../types/scanHubResult';
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
  onReset,
  onScanTicket,
  onReturnToHub,
}: {
  result: ScanData;
  onReset: () => void;
  onScanTicket: () => void;
  onReturnToHub: () => void;
}) {
  const formatRange = (value: number | null) => (value === null ? '—' : `${value.toFixed(2)}€`);

  const interval = result.prices?.[0];
  const confidence = result.confidence ?? 0;
  const observations = interval?.priceCount ?? 0;
  const territoryLabel = getTerritoryLabel(result.territory);

  return (
    <section className="space-y-4">
      <div className="bg-slate-900/70 border border-slate-700 rounded-2xl p-6 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold">
              {result.productName || 'Produit analysé'}
            </h2>
            <p className="text-sm text-slate-400">
              Confiance: {confidence}/100 • Sources: {result.sourcesUsed?.length ?? 0}
            </p>
          </div>
          <div className="text-sm text-blue-200 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-1">
            Badge prix observé
          </div>
        </div>

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
            <p className="text-xl font-semibold">{observations}</p>
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
  onReset,
  onScanTicket,
  onReturnToHub,
}: {
  result: ScanHubResult | null;
  onReset: () => void;
  onScanTicket: () => void;
  onReturnToHub: () => void;
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
          onReset={onReset}
          onScanTicket={onScanTicket}
          onReturnToHub={onReturnToHub}
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
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [barcode, setBarcode] = useState(params.get('ean') ?? '');
  const [territory, setTerritory] = useState<TerritoryCode>('fr');
  const [result, setResult] = useState<ScanHubResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAutoSearched, setHasAutoSearched] = useState(false);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const hasSearchInput = Boolean(barcode.trim() || query.trim());
  const canSearch = hasSearchInput && !loading;
  const shouldShowReset = hasSearchInput || Boolean(result) || Boolean(error);

  const buildCacheKey = useCallback(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const normalizedBarcode = barcode.trim();
    return `scanhub:price-search:${territory}:${normalizedBarcode || 'no-barcode'}:${normalizedQuery || 'no-query'}`;
  }, [barcode, query, territory]);

  const readCache = useCallback(() => {
    const key = buildCacheKey();
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
    (payload: ScanHubResult) => {
      const key = buildCacheKey();
      const cachedPayload = JSON.stringify({
        cachedAt: new Date().toISOString(),
        payload,
      });
      safeLocalStorage.setItem(key, cachedPayload);
    },
    [buildCacheKey]
  );

  const handleSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setCachedAt(null);

    try {
      const response = await searchProductPrices({
        barcode: barcode.trim() || undefined,
        query: query.trim() || undefined,
        territory,
      });
      const mapped = mapPriceSearchResult(response);
      setResult(mapped);
      writeCache(mapped);
    } catch (err: any) {
      console.error('Price search error:', err);
      setError('Impossible de récupérer les prix pour le moment.');
    } finally {
      setLoading(false);
    }
  }, [barcode, query, territory]);

  useEffect(() => {
    if (hasAutoSearched) {
      return;
    }
    if (!barcode.trim() && !query.trim()) {
      return;
    }
    const cached = readCache();
    if (cached?.payload) {
      setResult(cached.payload);
      setCachedAt(cached.cachedAt);
    }
    void handleSearch();
    setHasAutoSearched(true);
  }, [barcode, query, handleSearch, hasAutoSearched, readCache]);

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
                placeholder="Ex: 3229820129488"
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
                placeholder="Ex: Lait demi-écrémé"
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
            onReset={handleReset}
            onScanTicket={() => navigate('/scan')}
            onReturnToHub={() => navigate('/scanner')}
          />
        )}
        {!loading && result && (
          <PriceSearchResults
            result={result}
            onReset={handleReset}
            onScanTicket={() => navigate('/scan')}
            onReturnToHub={() => navigate('/scanner')}
          />
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
