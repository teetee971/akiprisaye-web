/**
 * superu.scraper.ts — Super U / Courses U DOM-TOM price scraper
 *
 * Data source: Open Prices API (prices.openfoodfacts.org)
 *   - Licence: ODbL
 *   - Crowd-sourced, public, no authentication required
 *   - Filtered by retailer tag "super-u" / "coursesu"
 *
 * Confidence: 0.90 — structured API response with known schema
 */

import {
  BaseScraper,
  type ScrapeResult,
  type ScrapedObservation,
  type TerritoryCode,
  sleep,
  REQUEST_DELAY_MS,
} from './base.scraper.js';

const OPENPRICES_API = 'https://prices.openfoodfacts.org/api/v1/prices';
const USER_AGENT     = 'akiprisaye-web/1.0 (https://teetee971.github.io/akiprisaye-web; contact via GitHub)';

/** OSM store IDs for Super U / Courses U in French DOM-TOM. */
const SUPERU_STORES: { osmId: string; territory: TerritoryCode; label: string }[] = [
  { osmId: '5312045891', territory: 'gp', label: 'Super U Guadeloupe' },
  { osmId: '5312045892', territory: 'mq', label: 'Super U Martinique' },
];

export class SuperUScraper extends BaseScraper {
  readonly retailer         = 'Super U';
  readonly defaultTerritory = 'gp' as const;
  readonly confidence       = 0.90;

  async fetch(): Promise<ScrapeResult> {
    const observations: ScrapedObservation[] = [];
    const errors: string[] = [];

    for (const store of SUPERU_STORES) {
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
          errors.push(`[Super U] HTTP ${res.status} for store ${store.osmId}`);
          continue;
        }

        const data = await res.json() as { items?: unknown[] };
        const items: unknown[] = data?.items ?? [];

        for (const item of items) {
          const i = item as Record<string, unknown>;
          const raw: Partial<ScrapedObservation> = {
            source:     'scraper',
            retailer:   this.retailer,
            territory:  store.territory,
            name:       typeof i.product_name === 'string' ? i.product_name : undefined,
            brand:      typeof i.product_brand === 'string' ? i.product_brand : undefined,
            price:      typeof i.price === 'number' ? i.price : parseFloat(String(i.price ?? '')),
            currency:   'EUR',
            observedAt: typeof i.date === 'string' ? i.date : new Date().toISOString(),
            confidence: this.confidence,
            ...(typeof i.product_code === 'string' && { productId: i.product_code }),
          };
          observations.push(...this.filterValid([raw], errors));
        }

        await sleep(REQUEST_DELAY_MS);

      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`[Super U] Error fetching store ${store.osmId}: ${msg}`);
      }
    }

    return this.buildResult(observations, errors);
  }
}
