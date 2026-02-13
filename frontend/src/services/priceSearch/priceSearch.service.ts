/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { computeMedian, normalizeObservation, normalizePriceValue } from './priceNormalizer';
import { computePriceConfidence } from './priceConfidence';
import { normalizeTerritoryCode } from './normalizeTerritoryCode';
import { queryProviders } from '../../providers';
import { buildCacheKey, getCache, purgeExpiredCache, setCache } from '../../providers/cache';
import { track } from '../../telemetry';
import type {
  PriceInterval,
  PriceSearchInput,
  PriceSearchResult,
  PriceSearchStatus,
  TerritoryCode,
} from './price.types';

const DEFAULT_TERRITORY: TerritoryCode = 'fr';
const PROVIDER_TIMEOUT_MS = 5000;

function getMode(input: PriceSearchInput): 'ean' | 'query' | 'mixed' {
  if (input.barcode && input.query) return 'mixed';
  if (input.barcode) return 'ean';
  return 'query';
}

function trackSearchEvent(
  kind: 'search_start' | 'cache_hit' | 'cache_miss' | 'cache_stale_used' | 'search_result' | 'error',
  input: PriceSearchInput,
  territory: TerritoryCode,
  payload: Partial<PriceSearchResult> & {
    durationMs?: number | null;
    meta?: Record<string, string | number>;
  } = {}
): void {
  track({
    kind,
    territory,
    mode: getMode(input),
    queryLen: input.query?.trim().length ?? 0,
    eanLen: input.barcode?.trim().length ?? 0,
    durationMs: payload.durationMs ?? null,
    status: payload.status ?? null,
    sourcesUsed: payload.sourcesUsed ?? [],
    warningsCount: payload.warnings?.length ?? 0,
    meta: payload.meta,
  });
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = globalThis.setTimeout(() => {
      reject(new Error('timeout'));
    }, timeoutMs);
    promise
      .then((value) => resolve(value))
      .catch(reject)
      .finally(() => globalThis.clearTimeout(timeoutId));
    signal.addEventListener('abort', () => {
      globalThis.clearTimeout(timeoutId);
      reject(new Error('aborted'));
    });
  });
}

function territoryMessage(territory: TerritoryCode): string | undefined {
  if (territory === 'fr') return undefined;
  return 'Données DOM en cours d’enrichissement. Les prix affichés restent indicatifs.';
}

function buildSearchCacheKey(input: PriceSearchInput, territory: TerritoryCode): string {
  const mode = input.barcode ? 'ean' : 'query';
  return buildCacheKey({
    territory,
    mode,
    ean: input.barcode,
    query: input.query,
  });
}

function shouldCacheResult(result: PriceSearchResult): boolean {
  return result.status === 'OK' || result.status === 'PARTIAL';
}

function areResultsDifferent(a: PriceSearchResult, b: PriceSearchResult): boolean {
  return JSON.stringify(a) !== JSON.stringify(b);
}

async function fetchLiveResult(
  normalizedInput: PriceSearchInput,
  territory: TerritoryCode,
  queryUsed: string
): Promise<PriceSearchResult> {
  const controller = new AbortController();
  const providerResults = await withTimeout(
    queryProviders(normalizedInput, controller.signal),
    PROVIDER_TIMEOUT_MS,
    controller.signal
  );

  const observations = providerResults
    .flatMap((result) => result.observations)
    .map(normalizeObservation);

  const warnings = providerResults.flatMap((result) => result.warnings);

  const sourcesUsed = Array.from(
    new Set(
      providerResults
        .filter((result) => result.observations.length > 0)
        .map((result) => result.source)
    )
  );

  const priceValues = observations.map((obs) => obs.price);
  const interval: PriceInterval = {
    min: priceValues.length > 0 ? normalizePriceValue(Math.min(...priceValues)) : null,
    median: computeMedian(priceValues),
    max: priceValues.length > 0 ? normalizePriceValue(Math.max(...priceValues)) : null,
    currency: 'EUR',
    priceCount: priceValues.length,
  };

  const confidence = computePriceConfidence({
    territoryMatch: observations.some(
      (obs) => normalizeTerritoryCode(obs.territory) === territory
    ),
    observations,
  });

  const productName =
    providerResults
      .map((result) => result.productName)
      .find(Boolean) ?? undefined;

  if (observations.length === 0) {
    warnings.push('Données insuffisantes pour établir une fourchette de prix fiable.');
  }

  const hasUnavailableProvider = providerResults.some((result) => result.status === 'UNAVAILABLE');

  const status: PriceSearchStatus =
    observations.length === 0
      ? 'NO_DATA'
      : confidence < 50 || warnings.length > 0 || hasUnavailableProvider
        ? 'PARTIAL'
        : 'OK';

  return {
    status,
    intervals: observations.length > 0 ? [interval] : [],
    confidence,
    observations,
    warnings,
    sourcesUsed,
    territory,
    productName,
    metadata: {
      queriedAt: new Date().toISOString(),
      queryUsed,
      territoryMessage: territoryMessage(territory),
    },
  };
}

export async function searchProductPrices(input: PriceSearchInput): Promise<PriceSearchResult> {
  const territory = normalizeTerritoryCode(input.territory ?? DEFAULT_TERRITORY);
  const normalizedInput: PriceSearchInput = {
    ...input,
    territory,
  };
  const queryUsed = input.barcode || input.query || 'recherche libre';
  const cacheKey = buildSearchCacheKey(normalizedInput, territory);
  const hasSearchTerm = Boolean((normalizedInput.barcode ?? '').trim() || (normalizedInput.query ?? '').trim());
  const startedAt = performance.now();

  trackSearchEvent('search_start', normalizedInput, territory);

  purgeExpiredCache();
  const cached = getCache<PriceSearchResult>(cacheKey);

  if (cached?.isFresh) {
    trackSearchEvent('cache_hit', normalizedInput, territory, {
      status: cached.value.status,
      sourcesUsed: cached.value.sourcesUsed,
      warnings: cached.value.warnings,
      durationMs: Math.round(performance.now() - startedAt),
    });

    if (hasSearchTerm) {
      void fetchLiveResult(normalizedInput, territory, queryUsed)
        .then((liveResult) => {
          if (shouldCacheResult(liveResult) && areResultsDifferent(cached.value, liveResult)) {
            setCache(cacheKey, liveResult);
          }
        })
        .catch(() => {
          // Silent background refresh failure.
        });
    }

    trackSearchEvent('search_result', normalizedInput, territory, {
      status: cached.value.status,
      sourcesUsed: cached.value.sourcesUsed,
      warnings: cached.value.warnings,
      durationMs: Math.round(performance.now() - startedAt),
      meta: { cache: 1 },
    });

    return cached.value;
  }

  trackSearchEvent('cache_miss', normalizedInput, territory);

  if (cached && !hasSearchTerm) {
    trackSearchEvent('cache_stale_used', normalizedInput, territory, {
      status: cached.value.status,
      sourcesUsed: cached.value.sourcesUsed,
      warnings: cached.value.warnings,
      durationMs: Math.round(performance.now() - startedAt),
    });
    trackSearchEvent('search_result', normalizedInput, territory, {
      status: cached.value.status,
      sourcesUsed: cached.value.sourcesUsed,
      warnings: cached.value.warnings,
      durationMs: Math.round(performance.now() - startedAt),
      meta: { stale: 1 },
    });
    return cached.value;
  }

  try {
    const liveResult = await fetchLiveResult(normalizedInput, territory, queryUsed);
    if (shouldCacheResult(liveResult)) {
      setCache(cacheKey, liveResult);
    }

    trackSearchEvent('search_result', normalizedInput, territory, {
      status: liveResult.status,
      sourcesUsed: liveResult.sourcesUsed,
      warnings: liveResult.warnings,
      durationMs: Math.round(performance.now() - startedAt),
      meta: { cache: 0 },
    });

    return liveResult;
  } catch {
    if (cached) {
      trackSearchEvent('cache_stale_used', normalizedInput, territory, {
        status: cached.value.status,
        sourcesUsed: cached.value.sourcesUsed,
        warnings: cached.value.warnings,
        durationMs: Math.round(performance.now() - startedAt),
        meta: { reason: 'provider_failure' },
      });
      trackSearchEvent('search_result', normalizedInput, territory, {
        status: cached.value.status,
        sourcesUsed: cached.value.sourcesUsed,
        warnings: cached.value.warnings,
        durationMs: Math.round(performance.now() - startedAt),
        meta: { stale: 1 },
      });
      trackSearchEvent('error', normalizedInput, territory, {
        status: 'UNAVAILABLE',
        durationMs: Math.round(performance.now() - startedAt),
        meta: { message: 'provider_failure_with_stale' },
      });
      return cached.value;
    }

    const unavailable: PriceSearchResult = {
      status: 'UNAVAILABLE',
      intervals: [],
      confidence: 0,
      observations: [],
      warnings: ['Service indisponible pour le moment.'],
      sourcesUsed: [],
      territory,
      metadata: {
        queriedAt: new Date().toISOString(),
        queryUsed,
        territoryMessage: territoryMessage(territory),
      },
    };

    trackSearchEvent('error', normalizedInput, territory, {
      status: 'UNAVAILABLE',
      durationMs: Math.round(performance.now() - startedAt),
      meta: { message: 'provider_failure_no_stale' },
    });
    trackSearchEvent('search_result', normalizedInput, territory, {
      status: unavailable.status,
      sourcesUsed: unavailable.sourcesUsed,
      warnings: unavailable.warnings,
      durationMs: Math.round(performance.now() - startedAt),
      meta: { cache: 0 },
    });

    return unavailable;
  }
}
