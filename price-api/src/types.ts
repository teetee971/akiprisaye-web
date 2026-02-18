export const TERRITORIES = ['fr', 'gp', 'mq'] as const;
export const RETAILERS = ['carrefour', 'leclerc', 'intermarché', 'superu'] as const;

export type Territory = (typeof TERRITORIES)[number];
export type Retailer = (typeof RETAILERS)[number] | string;
export type Currency = 'EUR';
export type PriceStatus = 'OK' | 'NO_DATA' | 'PARTIAL' | 'UNAVAILABLE';

export interface Env {
  PRICE_DB: D1Database;
  PRICE_ADMIN_TOKEN: string;
  RECEIPT_BUCKET: R2Bucket;
  RECEIPT_USER_TOKEN?: string;
  RECEIPT_AUTOCONFIRM?: string;
  OCR_PROVIDER?: 'google' | 'azure' | 'aws' | 'mindee' | 'dummy';
  OCR_API_KEY?: string;
  OCR_ENDPOINT?: string;
  ALLOWED_ORIGINS?: string;
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

export interface ReceiptJobRecord {
  id: string;
  territory: Territory;
  status: 'queued' | 'running' | 'success' | 'partial' | 'failed';
  created_at: string;
  completed_at: string | null;
  images_count: number;
  source_type: 'receipt' | 'invoice' | 'quote';
  retailer: string | null;
  store_name: string | null;
  observed_at: string | null;
  totals_json: string | null;
  pii_redaction_json: string | null;
  confidence: number;
  error: string | null;
}

export interface ReceiptItemRecord {
  id: string;
  job_id: string;
  line_index: number;
  product_label: string;
  quantity: number | null;
  unit_price_cents: number | null;
  line_total_cents: number | null;
  ean: string | null;
  brand: string | null;
  category: string | null;
  confidence: number;
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
