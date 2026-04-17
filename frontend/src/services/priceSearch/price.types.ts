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
  | 'data_gouv'
  | 'leclerc_catalog'
  | 'macave_leclerc'
  | 'leclerc_jardin'
  | 'leclerc_hightech'
  | 'leclerc_electromenager'
  | 'leclerc_parapharmacie'
  | 'leclerc_secondevie'
  | 'ecologite_guadeloupe'
  | 'huit_a_huit_guadeloupe'
  | 'supeco_guyane'
  | 'carrefour_milenis_guadeloupe'
  | 'connexion_guadeloupe'
  | 'calameo_catalog'
  | 'courses_u'
  | 'intermarche'
  | 'leader_price';

export type PriceSearchStatus = 'OK' | 'NO_DATA' | 'UNAVAILABLE' | 'PARTIAL';

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
  storeId?: string;
  serviceMode?: 'inStore' | 'drive' | 'delivery';
  metadata?: Record<string, string>;
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
