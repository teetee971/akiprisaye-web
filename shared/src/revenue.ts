export interface RevenueMetric {
  url: string;
  productName?: string;
  retailer?: string;
  pageViews: number;
  affiliateClicks: number;
  ctr: number;
  estimatedRevenue: number;
  avgPrice?: number;
  bestPrice?: number;
}

export type RevenueActionType = 'BOOST_CTA' | 'BOOST_RETAILER' | 'TEST_VARIANT' | 'PRIORITIZE_PAGE';

export interface RevenueAction {
  type: RevenueActionType;
  priority: 'high' | 'medium' | 'low';
  url: string;
  reason: string;
}

// ── Pipeline types ────────────────────────────────────────────────────────────

/**
 * A single raw price observation as produced by any data provider.
 * This is the canonical shared format used by fetch → normalize → score scripts.
 */
export interface ProductObservation {
  /** Unique product identifier (barcode when available, slugified name otherwise) */
  productId: string;
  /** Display name of the product */
  name: string;
  /** Brand name when known */
  brand?: string;
  /** Canonical retailer name (normalised to match RETAILER_URLS keys) */
  retailer: string;
  /** ISO 3166-1 alpha-2 territory code (lowercase) */
  territory: 'gp' | 'mq' | 'gf' | 're';
  /** Price in euros */
  price: number;
  currency: 'EUR';
  /** ISO 8601 datetime string */
  observedAt: string;
  /** Where this observation was sourced from */
  source: 'openfoodfacts' | 'openprices' | 'catalog' | 'internal' | 'scraper';
  /**
   * Data quality confidence (0–1).
   * Guidance:
   *   0.95 — live official API response
   *   0.90 — structured catalogue / known feed
   *   0.75 — well-formed HTML parse
   *   0.50 — heuristic / approximate extraction
   */
  confidence?: number;
  /** Product page URL at the retailer (optional) */
  url?: string;
  /** Unit description (e.g. "1 L", "500 g") */
  unit?: string;
}

/**
 * Scored product record produced by compute-product-scores.mjs.
 * globalScore = deltaScore*0.35 + clickScore*0.30 + demandScore*0.20 + recencyScore*0.15
 */
export interface ScoredProduct {
  productId: string;
  name: string;
  territory: string;
  bestRetailer: string;
  bestPrice: number;
  worstPrice: number;
  /** worstPrice - bestPrice */
  delta: number;
  /** Raw retailer click count from localStorage export (0 when unavailable) */
  clicks: number;
  /** 0–100: proportion of territories with price data */
  demandScore: number;
  /** 0–100: time-decay score (100 = observed today) */
  recencyScore: number;
  /** Composite weighted score */
  globalScore: number;
}

/**
 * A fully generated social content asset for one product × territory.
 */
export interface ContentAsset {
  productId: string;
  territory: string;
  title: string;
  tiktok: string;
  whatsapp: string;
  facebook: string;
  /** URL-friendly slug for the SEO page */
  seoSlug: string;
}

// ── Scraper layer types ───────────────────────────────────────────────────────

/**
 * Result returned by every scraper implementation.
 * Errors are captured per-observation and per-source so that one broken
 * source never crashes the whole pipeline.
 */
export interface ScrapeResult {
  observations: ProductObservation[];
  /** Non-fatal messages collected during the fetch (timeouts, parse errors…) */
  errors: string[];
  /** ISO timestamp of when the scrape completed */
  fetchedAt: string;
  /** Source identifier matching the scraper's `retailer` property */
  source: string;
}

// ── Pipeline alert types ──────────────────────────────────────────────────────

/**
 * A pipeline-generated price alert (different from user-subscribed alerts
 * stored in Prisma). These are stateless JSON artifacts produced by
 * scripts/generate-alerts.mjs and committed as CI artifacts.
 */
export interface PipelinePriceAlert {
  /** Unique alert identifier (deterministic: `${type}-${productId}-${territory}`) */
  id: string;
  /** Alert category */
  type: 'deal' | 'drop' | 'increase' | 'anomaly';
  /** Display product name */
  product: string;
  /** Canonical retailer name */
  retailer: string;
  /** ISO territory code */
  territory: string;
  /** Most recently observed price */
  currentPrice: number;
  /** Previous price (null if no history) */
  previousPrice?: number;
  /** Absolute price change (currentPrice − previousPrice) */
  deltaValue?: number;
  /** Relative price change as a percentage */
  deltaPercent?: number;
  /** Spread between best and worst retailer in the same territory */
  spread?: number;
  /** 'low' | 'medium' | 'high' */
  severity: 'low' | 'medium' | 'high';
  /**
   * Business priority score (0–100) used for sorting/filtering.
   *   alertScore = spread*0.4 + spreadPercent*0.3 + demand*0.2 + recency*0.1
   */
  alertScore: number;
  /** Retailer product URL (validated against allowlist before inclusion) */
  url?: string;
  /** ISO 8601 timestamp */
  createdAt: string;
  /** Pre-formatted social content ready for WhatsApp / Facebook / TikTok */
  social?: {
    whatsapp: string;
    facebook: string;
    tiktokHook: string;
  };
}
