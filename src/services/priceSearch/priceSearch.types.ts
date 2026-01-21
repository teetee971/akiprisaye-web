import type { PriceObservation, TerritoryCode } from '../../types/PriceObservation';

export type PriceSourceId = 'open_food_facts' | 'open_prices' | 'data_gouv';

export type PriceSearchStatus = 'OK' | 'NO_DATA' | 'UNAVAILABLE' | 'PARTIAL';

export interface PriceSearchInput {
  barcode?: string;
  query?: string;
  brand?: string;
  category?: string;
  territory?: TerritoryCode;
}

export interface PriceInterval {
  min: number | null;
  median: number | null;
  max: number | null;
  currency: 'EUR';
  priceCount: number;
}

export interface PriceSearchResult {
  status: PriceSearchStatus;
  intervals: PriceInterval[];
  confidence: number;
  observations: PriceObservation[];
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
