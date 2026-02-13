/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { computeMedian, normalizeObservation, normalizePriceValue } from './priceNormalizer';
import { computePriceConfidence } from './priceConfidence';
import { normalizeTerritoryCode } from './normalizeTerritoryCode';
import { queryProviders } from '../../providers';
import { buildCacheKey, getCache, purgeExpiredCache, setCache } from '../../providers/cache';
import type {
  PriceInterval,
  PriceSearchInput,
  PriceSearchResult,
  PriceSearchStatus,
  TerritoryCode,
} from './price.types';

const DEFAULT_TERRITORY: TerritoryCode = 'fr';
const PROVIDER_TIMEOUT_MS = 5000;

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

  purgeExpiredCache();
  const cached = getCache<PriceSearchResult>(cacheKey);

  if (cached?.isFresh) {
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

    return cached.value;
  }

  if (cached && !hasSearchTerm) {
    return cached.value;
  }

  try {
    const liveResult = await fetchLiveResult(normalizedInput, territory, queryUsed);
    if (shouldCacheResult(liveResult)) {
      setCache(cacheKey, liveResult);
    }
    return liveResult;
  } catch {
    if (cached) {
      return cached.value;
    }

    return {
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
  }
}
