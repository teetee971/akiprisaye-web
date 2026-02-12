/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { computeMedian, normalizeObservation, normalizePriceValue } from './priceNormalizer';
import { computePriceConfidence } from './priceConfidence';
import { normalizeTerritoryCode } from './normalizeTerritoryCode';
import { queryProviders } from '../../providers';
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

export async function searchProductPrices(input: PriceSearchInput): Promise<PriceSearchResult> {
  const territory = normalizeTerritoryCode(input.territory ?? DEFAULT_TERRITORY);
  const normalizedInput: PriceSearchInput = {
    ...input,
    territory,
  };
  const queryUsed = input.barcode || input.query || 'recherche libre';

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
  } catch (error) {
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
