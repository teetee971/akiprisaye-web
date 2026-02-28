export type TerritoryCode = 'FR' | 'GP' | 'MQ' | 'GF' | 'RE' | 'YT';

export interface PriceObservation {
  id?: string;
  productId?: string;
  productName?: string;
  territory: TerritoryCode;
  source: string;
  price: number;
  currency?: string;
  unit?: string;
  observedAt: string;
  retailer?: string;
  metadata?: Record<string, unknown>;
}
