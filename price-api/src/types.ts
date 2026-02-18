export const TERRITORIES = ['fr', 'gp', 'mq'] as const;
export const RETAILERS = ['carrefour', 'leclerc', 'intermarche', 'superu'] as const;
export const SOURCES = ['manual', 'partner_api', 'open_data', 'import'] as const;
export const UNITS = ['unit', 'kg', 'l'] as const;

export type Territory = (typeof TERRITORIES)[number];
export type Retailer = (typeof RETAILERS)[number];
export type Source = (typeof SOURCES)[number];
export type Unit = (typeof UNITS)[number];

export interface Env {
  PRICE_DB: D1Database;
  ADMIN_API_KEY: string;
  ALLOWED_ORIGINS?: string;
  AGG_WINDOW_DAYS?: string;
  CACHE_TTL_SECONDS?: string;
  POST_RATE_LIMIT_PER_MIN?: string;
}

export interface PriceObservationInput {
  ean: string;
  territory: Territory;
  retailer: Retailer;
  price: number;
  currency?: string;
  unit?: Unit;
  pricePerUnit?: number;
  observedAt: string;
  source: Source;
  storeRef?: string;
  metadata?: Record<string, unknown>;
}

export interface PriceAggregateRow {
  key: string;
  ean: string;
  territory: Territory;
  retailer: Retailer;
  last_price_cents: number | null;
  last_observed_at: string | null;
  min_price_cents: number | null;
  max_price_cents: number | null;
  median_price_cents: number | null;
  count_obs: number;
  updated_at: string;
}

export interface PriceObservationRow {
  id: string;
  ean: string;
  territory: Territory;
  retailer: Retailer;
  price_cents: number;
  currency: string;
  unit: string | null;
  price_per_unit_cents: number | null;
  observed_at: string;
  source: Source;
  store_ref: string | null;
  metadata_json: string | null;
  created_at: string;
}
