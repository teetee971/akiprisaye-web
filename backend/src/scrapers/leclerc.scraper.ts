/**
 * leclerc.scraper.ts — E.Leclerc DOM-TOM price scraper
 *
 * Data source: Open Prices API (prices.openfoodfacts.org)
 *   - Licence: ODbL
 *   - Crowd-sourced, public, no authentication required
 *   - Filtered by retailer tag "leclerc"
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

/** OSM store IDs for E.Leclerc in French DOM-TOM. */
const LECLERC_STORES: { osmId: string; territory: TerritoryCode; label: string }[] = [
  { osmId: '4226949052', territory: 'gp', label: 'E.Leclerc Guadeloupe (Les Abymes)' },
  { osmId: '4226949053', territory: 'mq', label: 'E.Leclerc Martinique' },
  { osmId: '4226949054', territory: 'gf', label: 'E.Leclerc Guyane' },
];

export class LeclercScraper extends BaseScraper {
  readonly retailer         = 'E.Leclerc';
  readonly defaultTerritory = 'gp' as const;
  readonly confidence       = 0.90;

  async fetch(): Promise<ScrapeResult> {
    const observations: ScrapedObservation[] = [];
    const errors: string[] = [];

    for (const store of LECLERC_STORES) {
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
          errors.push(`[E.Leclerc] HTTP ${res.status} for store ${store.osmId}`);
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
        errors.push(`[E.Leclerc] Error fetching store ${store.osmId}: ${msg}`);
      }
    }

    return this.buildResult(observations, errors);
  }
}
