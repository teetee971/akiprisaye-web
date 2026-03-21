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
  source: 'openfoodfacts' | 'openprices' | 'catalog' | 'internal';
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
