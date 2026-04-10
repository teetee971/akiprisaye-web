/**
 * base.scraper.ts — Abstract base class for all price scrapers.
 *
 * Design principles:
 *   - Every scraper must return a ScrapeResult (never throw globally)
 *   - Errors are collected per-fetch and returned alongside observations
 *   - Confidence values must be set per observation (never assume 1.0)
 *   - Respects rate-limiting constants defined here
 *   - No login, no session bypass, no anti-bot circumvention
 *
 * Guard-rails enforced at this level:
 *   MAX_PRODUCTS_PER_SOURCE — caps output to prevent runaway fetches
 *   REQUEST_DELAY_MS        — minimum gap between HTTP requests
 *   MAX_RETRIES             — maximum retry attempts per request
 *   FETCH_TIMEOUT_MS        — hard timeout per individual request
 */

// ── Guard-rail constants (shared by all scrapers) ─────────────────────────────

/** Maximum number of product observations returned per scraper run. */
export const MAX_PRODUCTS_PER_SOURCE = 100;

/** Minimum delay between consecutive HTTP requests (ms). */
export const REQUEST_DELAY_MS = 1_500;

/** Maximum number of retries on transient network errors. */
export const MAX_RETRIES = 2;

/** Hard timeout per individual HTTP request (ms). */
export const FETCH_TIMEOUT_MS = 10_000;

// ── Types ─────────────────────────────────────────────────────────────────────

/** ISO 3166-1 alpha-2 territory codes supported by the platform. */
export type TerritoryCode = 'gp' | 'mq' | 'gf' | 're' | 'yt';

/** Source label for observations produced by scrapers. */
export type ScraperSource = 'scraper';

/**
 * Minimal product observation shape returned by scrapers.
 * Aligns with shared/src/revenue.ts ProductObservation.
 */
export interface ScrapedObservation {
  productId?: string;
  source: ScraperSource;
  retailer: string;
  territory: TerritoryCode;
  name: string;
  brand?: string;
  unit?: string;
  price: number;
  currency: 'EUR';
  url?: string;
  observedAt: string;
  /**
   * Data quality confidence (0–1).
   *   0.95 — live official API
   *   0.90 — structured catalogue
   *   0.75 — clean HTML parse
   *   0.50 — heuristic / approximate
   */
  confidence: number;
}

/**
 * Standardised result envelope returned by every scraper.
 * Never throws — all errors are captured in the `errors` array.
 */
export interface ScrapeResult {
  observations: ScrapedObservation[];
  errors: string[];
  fetchedAt: string;
  source: string;
}

// ── Validation helpers ────────────────────────────────────────────────────────

/**
 * Validate a single scraped observation.  Returns null (with a reason string)
 * when the observation should be discarded.
 */
export function validateObservation(
  obs: Partial<ScrapedObservation>,
): { valid: true; data: ScrapedObservation } | { valid: false; reason: string } {
  if (!obs.name || obs.name.trim().length < 2) {
    return { valid: false, reason: `name too short or missing: "${obs.name}"` };
  }
  if (typeof obs.price !== 'number' || isNaN(obs.price) || obs.price <= 0) {
    return { valid: false, reason: `invalid price: ${obs.price} for "${obs.name}"` };
  }
  if (obs.price < 0.05 || obs.price > 9_999) {
    return { valid: false, reason: `price out of realistic range: ${obs.price}€ for "${obs.name}"` };
  }
  if (obs.url && !/^https?:\/\//i.test(obs.url)) {
    return { valid: false, reason: `invalid URL: "${obs.url}"` };
  }
  if (!obs.territory) {
    return { valid: false, reason: `missing territory for "${obs.name}"` };
  }
  return {
    valid: true,
    data: {
      source:      'scraper',
      name:        obs.name.trim(),
      retailer:    obs.retailer ?? 'unknown',
      territory:   obs.territory as TerritoryCode,
      price:       Math.round(obs.price * 100) / 100,
      currency:    'EUR',
      observedAt:  obs.observedAt ?? new Date().toISOString(),
      confidence:  obs.confidence ?? 0.75,
      ...(obs.productId && { productId: obs.productId }),
      ...(obs.brand     && { brand: obs.brand }),
      ...(obs.unit      && { unit: obs.unit }),
      ...(obs.url       && { url: obs.url }),
    },
  };
}

// ── Sleep helper ──────────────────────────────────────────────────────────────

/** Non-blocking delay in milliseconds. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Fetch with timeout + retry ────────────────────────────────────────────────

/**
 * Fetch a URL with a hard timeout and limited retries.
 * Returns null (not throw) on final failure, logging to the errors array.
 */
export async function safeFetch(
  url: string,
  options: RequestInit = {},
  errors: string[],
  retries = MAX_RETRIES,
): Promise<Response | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) return res;
      errors.push(`HTTP ${res.status} for ${url} (attempt ${attempt + 1})`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Fetch error for ${url} (attempt ${attempt + 1}): ${msg}`);
    }
    if (attempt < retries) await sleep(REQUEST_DELAY_MS);
  }
  return null;
}

// ── Abstract base class ───────────────────────────────────────────────────────

/**
 * Every price scraper must extend this class.
 *
 * Contract:
 *   - `retailer` must match the canonical name in RETAILER_ALIASES
 *   - `fetch()` must never throw; catch all errors and push to the errors array
 *   - `fetch()` must respect MAX_PRODUCTS_PER_SOURCE and REQUEST_DELAY_MS
 *   - `fetch()` must set confidence on every observation
 */
export abstract class BaseScraper {
  /** Canonical retailer name (must match RETAILER_ALIASES in fetch-price-data.mjs) */
  abstract readonly retailer: string;

  /** Default territory for this scraper instance */
  abstract readonly defaultTerritory: TerritoryCode;

  /** Confidence level for observations produced by this scraper */
  abstract readonly confidence: number;

  /**
   * Fetch price observations.
   * Must return a ScrapeResult — never throw globally.
   */
  abstract fetch(): Promise<ScrapeResult>;

  /** Build a consistent result envelope */
  protected buildResult(
    observations: ScrapedObservation[],
    errors: string[],
  ): ScrapeResult {
    return {
      observations: observations.slice(0, MAX_PRODUCTS_PER_SOURCE),
      errors,
      fetchedAt: new Date().toISOString(),
      source: this.retailer,
    };
  }

  /** Validate and filter a list of raw observations */
  protected filterValid(
    raw: Partial<ScrapedObservation>[],
    errors: string[],
  ): ScrapedObservation[] {
    const valid: ScrapedObservation[] = [];
    for (const obs of raw) {
      const result = validateObservation(obs);
      if (result.valid) {
        valid.push(result.data);
      } else {
        errors.push(`[${this.retailer}] Discarded — ${result.reason}`);
      }
    }
    return valid;
  }
}
