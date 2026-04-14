export const TERRITORIES = ['fr', 'gp', 'mq'] as const;
export const RETAILERS = ['carrefour', 'leclerc', 'intermarché', 'intermarche', 'superu', 'auchan', 'match', 'autre'] as const;

export type Territory = (typeof TERRITORIES)[number];
export type Retailer = (typeof RETAILERS)[number] | string;
export type Currency = 'EUR';
export type PriceStatus = 'OK' | 'NO_DATA' | 'PARTIAL' | 'UNAVAILABLE';
export type ImportJobStatus = 'queued' | 'running' | 'success' | 'partial' | 'failed';
export type ImportRowStatus = 'ok' | 'invalid' | 'error';

export interface Env {
  PRICE_DB: D1Database;
  PRICE_ADMIN_TOKEN: string;
  ALLOWED_ORIGINS?: string;
  CASHIER_HASH_SALT?: string;
  PRICE_IMPORTS: R2Bucket;
  PAYPAL_CLIENT_ID: string;
  PAYPAL_CLIENT_SECRET: string;
  PAYPAL_WEBHOOK_ID: string;
  PAYPAL_ENV: 'sandbox' | 'live';
  /** PayPal plan ID for the PREMIUM_MONTHLY subscription tier. */
  PAYPAL_PREMIUM_PLAN_ID?: string;
  /** PayPal plan ID for the PRO_MONTHLY subscription tier. */
  PAYPAL_PRO_PLAN_ID?: string;
  /** Secret used to verify HS256 JWT tokens for user subscription lookups. */
  JWT_SECRET?: string;
}

export type ReceiptJobStatus = 'created' | 'processing' | 'completed' | 'failed';

export interface ReceiptJobRecord {
  id: string;
  status: ReceiptJobStatus;
  territory: string;
  createdAt: string;
  cashierLabelRaw?: string | null;
  cashierHash?: string | null;
  cashierOperatorId?: string | null;
}

export interface ProductRecord {
  ean: string;
  product_name: string | null;
  brand: string | null;
  quantity: string | null;
  ingredients_text: string | null;
  created_at: string;
  updated_at: string;
}

export interface PriceAggregateRecord {
  ean: string;
  territory: Territory;
  retailer: string;
  currency: Currency;
  unit: string | null;
  last_price_cents: number | null;
  min_price_cents: number | null;
  max_price_cents: number | null;
  median_price_cents: number | null;
  count_observations: number;
  last_observed_at: string | null;
  updated_at: string;
}

export interface PriceObservationRecord {
  id: string;
  ean: string;
  territory: Territory;
  retailer: string;
  store_id: string | null;
  store_name: string | null;
  price_cents: number;
  currency: Currency;
  unit: string | null;
  observed_at: string;
  source: string;
  confidence: number;
  metadata_json: string | null;
  created_at: string;
}

export interface ImportJobRecord {
  id: string;
  filename: string;
  r2_key: string;
  territory: Territory;
  status: ImportJobStatus;
  total_rows: number;
  success_rows: number;
  error_rows: number;
  created_at: string;
  finished_at: string | null;
}

export interface ImportRowRecord {
  id: string;
  job_id: string;
  row_number: number;
  ean: string | null;
  retailer: string | null;
  territory: string | null;
  price_cents: number | null;
  status: ImportRowStatus;
  error_message: string | null;
  created_at: string;
}

export interface SubscriptionRecord {
  id: number;
  user_id: string;
  plan: string;
  status: string;
  paypal_subscription_id: string | null;
  payer_id: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiResponseBase {
  status: PriceStatus;
  timestamp: string;
}

export interface PriceAggregateView {
  territory: Territory;
  retailer: string;
  currency: Currency;
  unit: string | null;
  stats: {
    lastPrice: number | null;
    minPrice: number | null;
    maxPrice: number | null;
    medianPrice: number | null;
    count: number;
    lastObservedAt: string | null;
  };
  updatedAt: string;
}

export interface PriceObservationView {
  id: string;
  territory: Territory;
  retailer: string;
  storeId: string | null;
  storeName: string | null;
  price: number;
  currency: Currency;
  unit: string | null;
  observedAt: string;
  source: string;
  confidence: number;
  metadata: Record<string, unknown> | null;
}

export interface PricesResponse extends ApiResponseBase {
  ean: string;
  territory?: Territory;
  retailers: string[];
  aggregates: PriceAggregateView[];
  recentObservations: PriceObservationView[];
  meta: {
    etag: string;
    updatedAt: string | null;
  };
}

export interface ProductResponse extends ApiResponseBase {
  product: {
    ean: string;
    productName: string | null;
    brand: string | null;
    quantity: string | null;
    ingredientsText: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
  aggregates: PriceAggregateView[];
}

export interface InsertObservationInput {
  ean: string;
  territory: Territory;
  retailer: string;
  storeId?: string;
  storeName?: string;
  price: number;
  currency: Currency;
  unit?: string;
  observedAt?: string;
  source: string;
  confidence?: number;
  metadata?: Record<string, unknown>;
}

export interface InsertObservationCentsInput {
  ean: string;
  territory: Territory;
  retailer: string;
  storeId?: string;
  storeName?: string;
  priceCents: number;
  currency: Currency;
  unit?: string;
  observedAt?: string;
  source: string;
  confidence?: number;
  metadata?: Record<string, unknown>;
}
