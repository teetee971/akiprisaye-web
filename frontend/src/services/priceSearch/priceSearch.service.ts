/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { findLocalPriceOverrides, type RetailerId } from '../../data/price_overrides';
import { computeMedian, normalizeObservation, normalizePriceValue } from './priceNormalizer';
import { computePriceConfidence } from './priceConfidence';
import { normalizeTerritoryCode } from './normalizeTerritoryCode';
import { runPriceProviders } from '../../providers';
import { buildCacheKey, getCache, purgeExpiredCache, setCache } from '../../providers/cache';
import { trackSearchError, trackSearchResult, trackSearchStart } from './telemetry';
import type {
  PriceInterval,
  PriceObservation,
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

function mapStoreToRetailerId(storeId?: string): RetailerId | undefined {
  const normalized = (storeId ?? '').trim().toLowerCase();
  switch (normalized) {
    case 'carrefour':
      return 'carrefour';
    case 'leclerc':
    case 'e.leclerc':
    case 'e-leclerc':
      return 'leclerc';
    case 'intermarche':
    case 'intermarché':
      return 'intermarche';
    case 'superu':
    case 'super u':
      return 'superu';
    default:
      return undefined;
  }
}

function computeInterval(observations: ReturnType<typeof normalizeObservation>[]): PriceInterval {
  const priceValues = observations.map((obs) => obs.price);
  return {
    min: priceValues.length > 0 ? normalizePriceValue(Math.min(...priceValues)) : null,
    median: computeMedian(priceValues),
    max: priceValues.length > 0 ? normalizePriceValue(Math.max(...priceValues)) : null,
    currency: 'EUR',
    priceCount: priceValues.length,
  };
}

function buildLocalOverrideObservations(
  input: PriceSearchInput,
  territory: TerritoryCode
): PriceObservation[] {
  if (!input.barcode) {
    return [];
  }

  const retailer = mapStoreToRetailerId(input.storeId);
  const localEntries = findLocalPriceOverrides(input.barcode, territory, retailer);

  return localEntries.map((entry) => {
    const price = entry.price ?? Number.NaN;

    return {
      source: 'local_override',
      barcode: entry.ean,
      price,
      currency: entry.currency,
      unit: entry.unit,
      observedAt: entry.observedAt,
      territory,
      metadata: {
        retailer: entry.retailer,
        territory,
        note: entry.sourceNote ?? 'Catalogue interne (prix).',
        priceStatus: entry.price === null ? 'missing' : 'available',
      },
    };
  });
}

function shouldUseLocalOverride(
  status: PriceSearchStatus,
  observationsCount: number,
  hasUnavailableProvider: boolean
): boolean {
  return observationsCount === 0 || status === 'NO_DATA' || status === 'UNAVAILABLE' || hasUnavailableProvider;
}

async function fetchLiveResult(
  normalizedInput: PriceSearchInput,
  territory: TerritoryCode,
  queryUsed: string
): Promise<PriceSearchResult> {
  const controller = new AbortController();
  const providerResults = await withTimeout(
    runPriceProviders(normalizedInput, controller.signal),
    PROVIDER_TIMEOUT_MS,
    controller.signal
  );

  const providerObservations = providerResults
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

  const confidence = computePriceConfidence({
    territoryMatch: providerObservations.some(
      (obs) => normalizeTerritoryCode(obs.territory) === territory
    ),
    observations: providerObservations,
  });

  const productName =
    providerResults
      .map((result) => result.productName)
      .find(Boolean) ?? undefined;

  const hasUnavailableProvider = providerResults.some((result) => result.status === 'UNAVAILABLE');

  const providerStatus: PriceSearchStatus =
    providerObservations.length === 0
      ? 'NO_DATA'
      : confidence < 50 || warnings.length > 0 || hasUnavailableProvider
        ? 'PARTIAL'
        : 'OK';

  const useLocalOverride = shouldUseLocalOverride(providerStatus, providerObservations.length, hasUnavailableProvider);
  const localOverrides = useLocalOverride ? buildLocalOverrideObservations(normalizedInput, territory) : [];
  const normalizedLocalOverrides = localOverrides.map(normalizeObservation);

  if (providerObservations.length === 0 && normalizedLocalOverrides.length === 0) {
    warnings.push('Données insuffisantes pour établir une fourchette de prix fiable.');
  }

  const observations = providerObservations.length > 0 ? providerObservations : normalizedLocalOverrides;
  const localOverrideFound = normalizedLocalOverrides.length > 0;
  const status: PriceSearchStatus =
    providerObservations.length > 0
      ? providerStatus
      : localOverrideFound
        ? 'PARTIAL'
        : 'NO_DATA';

  const finalWarnings = [...warnings];
  if (localOverrideFound) {
    finalWarnings.push('Source: Catalogue interne (prix).');
  }

  const finalSourcesUsed = localOverrideFound
    ? Array.from(new Set([...sourcesUsed, 'local_override']))
    : sourcesUsed;

  return {
    status,
    intervals: observations.length > 0 ? [computeInterval(observations)] : [],
    confidence,
    observations,
    warnings: finalWarnings,
    sourcesUsed: finalSourcesUsed,
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
  trackSearchStart({
    territory,
    hasBarcode: Boolean((normalizedInput.barcode ?? '').trim()),
    hasQuery: Boolean((normalizedInput.query ?? '').trim()),
    cacheKey,
  });

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

    trackSearchResult({
      territory,
      status: cached.value.status,
      confidence: cached.value.confidence,
      sourceCount: cached.value.sourcesUsed.length,
      warningCount: cached.value.warnings.length,
      cacheHit: true,
    });
    return cached.value;
  }

  if (cached && !hasSearchTerm) {
    trackSearchResult({
      territory,
      status: cached.value.status,
      confidence: cached.value.confidence,
      sourceCount: cached.value.sourcesUsed.length,
      warningCount: cached.value.warnings.length,
      cacheHit: true,
    });
    return cached.value;
  }

  try {
    const liveResult = await fetchLiveResult(normalizedInput, territory, queryUsed);
    if (shouldCacheResult(liveResult)) {
      setCache(cacheKey, liveResult);
    }
    trackSearchResult({
      territory,
      status: liveResult.status,
      confidence: liveResult.confidence,
      sourceCount: liveResult.sourcesUsed.length,
      warningCount: liveResult.warnings.length,
      cacheHit: false,
    });
    return liveResult;
  } catch {
    if (cached) {
      trackSearchError({
        territory,
        cacheHit: true,
        reason: 'live_fetch_failed',
      });
      trackSearchResult({
        territory,
        status: cached.value.status,
        confidence: cached.value.confidence,
        sourceCount: cached.value.sourcesUsed.length,
        warningCount: cached.value.warnings.length,
        cacheHit: true,
      });
      return cached.value;
    }

    const localOverrides = buildLocalOverrideObservations(normalizedInput, territory).map(normalizeObservation);
    if (localOverrides.length > 0) {
      const localResult: PriceSearchResult = {
        status: 'PARTIAL',
        intervals: [computeInterval(localOverrides)],
        confidence: 20,
        observations: localOverrides,
        warnings: ['Service indisponible pour le moment.', 'Source: Catalogue interne (prix).'],
        sourcesUsed: ['local_override'],
        territory,
        metadata: {
          queriedAt: new Date().toISOString(),
          queryUsed,
          territoryMessage: territoryMessage(territory),
        },
      };

      trackSearchError({ territory, cacheHit: false, reason: 'live_fetch_failed' });
      trackSearchResult({
        territory,
        status: localResult.status,
        confidence: localResult.confidence,
        sourceCount: localResult.sourcesUsed.length,
        warningCount: localResult.warnings.length,
        cacheHit: false,
      });

      return localResult;
    }

    const unavailableResult: PriceSearchResult = {
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

    trackSearchError({
      territory,
      cacheHit: false,
      reason: 'live_fetch_failed',
    });
    trackSearchResult({
      territory,
      status: unavailableResult.status,
      confidence: unavailableResult.confidence,
      sourceCount: unavailableResult.sourcesUsed.length,
      warningCount: unavailableResult.warnings.length,
      cacheHit: false,
    });

    return unavailableResult;
  }
}
