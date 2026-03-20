export type TerritoryCode =
  | 'GP' | 'MQ' | 'GF' | 'RE' | 'YT' | 'PM' | 'BL' | 'MF' | 'NC' | 'PF' | 'WF';

export type PriceSourceId = 'open_food_facts' | 'open_prices' | 'internal' | 'mock';

export interface Product {
  id: string;
  name: string;
  barcode: string;
  image?: string;
  brand?: string;
  category?: string;
}

export interface PriceObservation {
  retailer: string;
  territory: string;
  price: number;
  currency: 'EUR';
  observedAt: string;
  source: PriceSourceId;
}

export interface CompareSummary {
  min: number | null;
  max: number | null;
  average: number | null;
  savings: number | null;
  count: number;
}
