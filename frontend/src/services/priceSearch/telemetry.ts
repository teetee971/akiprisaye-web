import type { PriceSearchResult } from './price.types';

type PriceSearchTelemetryEvent =
  | {
      type: 'search_start';
      payload: {
        territory: string;
        hasBarcode: boolean;
        hasQuery: boolean;
        cacheKey: string;
      };
    }
  | {
      type: 'search_result';
      payload: {
        territory: string;
        status: PriceSearchResult['status'];
        confidence: number;
        sourceCount: number;
        warningCount: number;
        cacheHit: boolean;
      };
    }
  | {
      type: 'error';
      payload: {
        territory: string;
        cacheHit: boolean;
        reason: 'live_fetch_failed';
      };
    };

const TELEMETRY_EVENT_NAME = 'price-search-telemetry';

function dispatchTelemetry(event: PriceSearchTelemetryEvent): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(TELEMETRY_EVENT_NAME, {
      detail: {
        ...event,
        timestamp: new Date().toISOString(),
      },
    })
  );
}

export function trackSearchStart(
  payload: Extract<PriceSearchTelemetryEvent, { type: 'search_start' }>['payload']
): void {
  dispatchTelemetry({ type: 'search_start', payload });
}

export function trackSearchResult(
  payload: Extract<PriceSearchTelemetryEvent, { type: 'search_result' }>['payload']
): void {
  dispatchTelemetry({ type: 'search_result', payload });
}

export function trackSearchError(
  payload: Extract<PriceSearchTelemetryEvent, { type: 'error' }>['payload']
): void {
  dispatchTelemetry({ type: 'error', payload });
}

export { TELEMETRY_EVENT_NAME };
