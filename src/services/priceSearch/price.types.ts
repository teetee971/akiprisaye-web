/**
 * Price Search – Types
 * Canonical-aligned version
 *
 * IMPORTANT:
 * - TerritoryCode is imported from the canonical model
 * - No lowercase territory codes are allowed here
 * - Normalization MUST occur at system boundaries
 */

import type { PriceInterval } from '@/types/scanHubResult';

export type TerritoryCode =
  | 'fr'
  | 'gp'
  | 'mq'
  | 'gf'
  | 're'
  | 'yt'
  | 'pm'
  | 'bl'
  | 'mf'
  | 'wf'
  | 'pf'
  | 'nc'
  | 'tf';

/* -----------------------------
 * Sources & Status
 * ----------------------------- */

export type PriceSourceId =
  | 'open_food_facts'
  | 'open_prices'
  | 'data_gouv';

export type PriceSearchStatus =
  | 'OK'
  | 'NO_DATA'
  | 'UNAVAILABLE'
  | 'PARTIAL';

/* -----------------------------
 * Core Models
 * ----------------------------- */

export interface PriceObservation {
  source: PriceSourceId;

  productName?: string;
  brand?: string;
  barcode?: string;

  price: number;
  currency: 'EUR';

  unit?: 'unit' | 'kg' | 'l';
  observedAt?: string;

  territory?: TerritoryCode;

  metadata?: Record<string, string>;
}

export interface NormalizedPriceObservation extends PriceObservation {
  pricePerUnit?: number;
  normalizedLabel: string;
}

/* -----------------------------
 * Search Input / Output
 * ----------------------------- */

export interface PriceSearchInput {
  barcode?: string;
  query?: string;
  brand?: string;
  category?: string;
  territory?: TerritoryCode;
}

export type { PriceInterval };

export interface PriceSearchResult {
  status: PriceSearchStatus;

  intervals: PriceInterval[];
  confidence: number;

  observations: NormalizedPriceObservation[];
  warnings: string[];
  sourcesUsed: PriceSourceId[];

  territory: TerritoryCode;
  productName?: string;

  metadata: {
    queriedAt: string;
    queryUsed: string;
    territoryMessage?: string;
  };
}
