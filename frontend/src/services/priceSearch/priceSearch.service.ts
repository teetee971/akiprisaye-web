/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { computeMedian, normalizeObservation, normalizePriceValue } from './priceNormalizer';
import { computePriceConfidence } from './priceConfidence';
import { normalizeTerritoryCode } from './normalizeTerritoryCode';
import { queryProviders } from '../../providers';
import { fnv1a32, track } from '../../telemetry';
import type {
  PriceInterval,
  PriceSearchInput,
  PriceSearchResult,
  PriceSearchStatus,
  TerritoryCode,
} from './price.types';

const DEFAULT_TERRITORY: TerritoryCode = 'fr';
const PROVIDER_TIMEOUT_MS = 5000;

const CACHE_FRESH_MS = 2 * 60 * 1000;
const CACHE_STALE_MS = 10 * 60 * 1000;

type CacheRecord = {
  cachedAt: number;
  result: PriceSearchResult;
};

const searchCache = new Map<string, CacheRecord>();

function getMode(input: PriceSearchInput): 'ean' | 'query' | 'mixed' {
  if (input.barcode && input.query) return 'mixed';
  if (input.barcode) return 'ean';
  return 'query';
}

function buildCacheKey(input: PriceSearchInput, territory: TerritoryCode): string {
  const barcodeHash = input.barcode ? fnv1a32(input.barcode) : '';
  const queryHash = input.query ? fnv1a32(input.query.trim().toLowerCase()) : '';
  return `${territory}:${getMode(input)}:${barcodeHash}:${queryHash}`;
}

function trackSearchEvent(kind: 'search_start' | 'cache_hit' | 'cache_miss' | 'cache_stale_used' | 'search_result' | 'error', input: PriceSearchInput, territory: TerritoryCode, payload: Partial<PriceSearchResult> & { durationMs?: number | null; meta?: Record<string, string | number> } = {}): void {
  const mode = getMode(input);
  track({
    kind,
    territory,
    mode,
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

export async function searchProductPrices(input: PriceSearchInput): Promise<PriceSearchResult> {
  const territory = normalizeTerritoryCode(input.territory ?? DEFAULT_TERRITORY);
  const normalizedInput: PriceSearchInput = {
    ...input,
    territory,
  };
  const queryUsed = input.barcode || input.query || 'recherche libre';
  const startedAt = performance.now();
  const cacheKey = buildCacheKey(normalizedInput, territory);
  const cached = searchCache.get(cacheKey);

  trackSearchEvent('search_start', normalizedInput, territory);

  if (cached) {
    const ageMs = Date.now() - cached.cachedAt;
    if (ageMs <= CACHE_FRESH_MS) {
      trackSearchEvent('cache_hit', normalizedInput, territory, {
        status: cached.result.status,
        sourcesUsed: cached.result.sourcesUsed,
        warnings: cached.result.warnings,
        durationMs: Math.round(performance.now() - startedAt),
      });
      trackSearchEvent('search_result', normalizedInput, territory, {
        status: cached.result.status,
        sourcesUsed: cached.result.sourcesUsed,
        warnings: cached.result.warnings,
        durationMs: Math.round(performance.now() - startedAt),
        meta: { cache: 1 },
      });
      return {
        ...cached.result,
        metadata: {
          ...cached.result.metadata,
          queriedAt: new Date().toISOString(),
        },
      };
    }

    if (ageMs <= CACHE_STALE_MS) {
      trackSearchEvent('cache_stale_used', normalizedInput, territory, {
        status: cached.result.status,
        sourcesUsed: cached.result.sourcesUsed,
        warnings: cached.result.warnings,
        durationMs: Math.round(performance.now() - startedAt),
      });
    }
  } else {
    trackSearchEvent('cache_miss', normalizedInput, territory);
  }

  try {
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

    const liveResult: PriceSearchResult = {
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

    searchCache.set(cacheKey, { cachedAt: Date.now(), result: liveResult });
    trackSearchEvent('search_result', normalizedInput, territory, {
      status: liveResult.status,
      sourcesUsed: liveResult.sourcesUsed,
      warnings: liveResult.warnings,
      durationMs: Math.round(performance.now() - startedAt),
      meta: { cache: 0 },
    });

    return liveResult;
  } catch (error) {
    const fallback = searchCache.get(cacheKey);
    if (fallback && Date.now() - fallback.cachedAt <= CACHE_STALE_MS) {
      const staleResult: PriceSearchResult = {
        ...fallback.result,
        status: fallback.result.status === 'OK' ? 'PARTIAL' : fallback.result.status,
        warnings: Array.from(new Set([...fallback.result.warnings, 'Résultat de secours issu du cache local.'])),
        metadata: {
          ...fallback.result.metadata,
          queriedAt: new Date().toISOString(),
          territoryMessage: territoryMessage(territory),
        },
      };
      trackSearchEvent('cache_stale_used', normalizedInput, territory, {
        status: staleResult.status,
        sourcesUsed: staleResult.sourcesUsed,
        warnings: staleResult.warnings,
        durationMs: Math.round(performance.now() - startedAt),
        meta: { reason: 'provider_failure' },
      });
      trackSearchEvent('search_result', normalizedInput, territory, {
        status: staleResult.status,
        sourcesUsed: staleResult.sourcesUsed,
        warnings: staleResult.warnings,
        durationMs: Math.round(performance.now() - startedAt),
        meta: { stale: 1 },
      });
      trackSearchEvent('error', normalizedInput, territory, {
        status: 'UNAVAILABLE',
        durationMs: Math.round(performance.now() - startedAt),
        meta: { message: 'provider_failure_with_stale' },
      });
      return staleResult;
    }

    trackSearchEvent('error', normalizedInput, territory, {
      status: 'UNAVAILABLE',
      durationMs: Math.round(performance.now() - startedAt),
      meta: { message: 'provider_failure_no_stale' },
    });

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
