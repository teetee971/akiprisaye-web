/**
 * carrefour.scraper.ts — Carrefour DOM-TOM price scraper
 *
 * Data source: Open Prices API (prices.openfoodfacts.org/api/v1/prices)
 *   - Licence: ODbL (Open Data Commons Open Database Licence)
 *   - Crowd-sourced, public, no authentication required
 *   - Filtered by: location_osm_id for Carrefour stores in DOM-TOM
 *
 * Confidence: 0.90 — structured API response with known schema
 *
 * Guard-rails inherited from BaseScraper:
 *   MAX_PRODUCTS_PER_SOURCE = 100
 *   REQUEST_DELAY_MS = 1500
 *   FETCH_TIMEOUT_MS = 10000
 *   MAX_RETRIES = 2
 */

import {
  BaseScraper,
  type ScrapeResult,
  type ScrapedObservation,
  type TerritoryCode,
  sleep,
  REQUEST_DELAY_MS,
} from './base.scraper.js';

// ── Constants ─────────────────────────────────────────────────────────────────

const OPENPRICES_API = 'https://prices.openfoodfacts.org/api/v1/prices';

/** Explicit User-Agent so the API can identify this client. */
const USER_AGENT = 'akiprisaye-web/1.0 (https://teetee971.github.io/akiprisaye-web; contact via GitHub)';

/**
 * OSM (OpenStreetMap) location IDs for Carrefour stores in French DOM-TOM.
 * These are stable, permanent IDs from the public OpenStreetMap database.
 *
 * Each ID maps to a physical store and a territory.
 * Extend this list as new stores are confirmed.
 */
const CARREFOUR_STORES: { osmId: string; territory: TerritoryCode; label: string }[] = [
  { osmId: '2709085079', territory: 'gp', label: 'Carrefour Guadeloupe' },
  { osmId: '2709085080', territory: 'mq', label: 'Carrefour Martinique' },
];

// ── Scraper ───────────────────────────────────────────────────────────────────

export class CarrefourScraper extends BaseScraper {
  readonly retailer        = 'Carrefour';
  readonly defaultTerritory = 'gp' as const;
  readonly confidence       = 0.90;

  async fetch(): Promise<ScrapeResult> {
    const observations: ScrapedObservation[] = [];
    const errors: string[] = [];

    for (const store of CARREFOUR_STORES) {
      try {
        const url = new URL(OPENPRICES_API);
        url.searchParams.set('location_osm_id', store.osmId);
        url.searchParams.set('page_size', '50');
        url.searchParams.set('order_by', '-date');

        const res = await fetch(url.toString(), {
          headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
          signal: AbortSignal.timeout(10_000),
        });

        if (!res.ok) {
          errors.push(`[Carrefour] HTTP ${res.status} for store ${store.osmId}`);
          continue;
        }

        const data = await res.json() as { items?: unknown[] };
        const items: unknown[] = data?.items ?? [];

        for (const item of items) {
          const i = item as Record<string, unknown>;
          const raw: Partial<ScrapedObservation> = {
            source:      'scraper',
            retailer:    this.retailer,
            territory:   store.territory,
            name:        typeof i.product_name === 'string' ? i.product_name : undefined,
            brand:       typeof i.product_brand === 'string' ? i.product_brand : undefined,
            price:       typeof i.price === 'number' ? i.price : parseFloat(String(i.price ?? '')),
            currency:    'EUR',
            observedAt:  typeof i.date === 'string' ? i.date : new Date().toISOString(),
            confidence:  this.confidence,
            ...(typeof i.product_code === 'string' && { productId: i.product_code }),
          };
          observations.push(...this.filterValid([raw], errors));
        }

        // Polite delay between store fetches
        await sleep(REQUEST_DELAY_MS);

      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`[Carrefour] Error fetching store ${store.osmId}: ${msg}`);
      }
    }

    return this.buildResult(observations, errors);
  }
}
