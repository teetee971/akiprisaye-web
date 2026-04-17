/**
 * Compare API — shared type contracts
 *
 * Aligned with:
 *   GET /api/compare?query=…&territory=…&retailer=…
 *
 * Import from both frontend service and backend to keep contracts in sync.
 */

import type { TerritoryCode } from './PriceObservation';

export type { TerritoryCode };

export type PriceSourceId = 'open_food_facts' | 'open_prices' | 'internal' | 'mock';

// ── Product identity ──────────────────────────────────────────────────────────

export interface CompareProduct {
  id: string;
  name: string;
  barcode: string;
  image?: string;
  brand?: string;
  category?: string;
}

// ── Observed price row ────────────────────────────────────────────────────────

export interface PriceObservationRow {
  retailer: string;
  territory: string;
  price: number;
  currency: 'EUR';
  observedAt: string; // ISO 8601
  source: PriceSourceId;
}

// ── Aggregated summary ────────────────────────────────────────────────────────

export interface CompareSummary {
  min: number | null;
  max: number | null;
  average: number | null;
  savings: number | null;
  count: number;
}

// ── Full response ─────────────────────────────────────────────────────────────

export interface CompareResponse {
  product: CompareProduct;
  territory: string;
  retailerFilter: string | null;
  observations: PriceObservationRow[];
  summary: CompareSummary;
}

// ── Request params ────────────────────────────────────────────────────────────

export interface CompareParams {
  query: string;
  territory: string;
  retailer?: string;
}
