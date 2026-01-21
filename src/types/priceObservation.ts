export type TerritoryCode = 'FR' | 'GP' | 'MQ' | 'GF' | 'RE' | 'YT';

export type Territory = TerritoryCode;

export interface PriceObservation {
  productId: string;
  productLabel: string;
  territory: Territory;
  price: number;
  observedAt: string; // ISO
  storeLabel?: string;
  currency?: 'EUR';
  sourceType?: 'citizen' | 'open_data' | 'partner';
  confidenceScore?: number;
  observationsCount?: number;
  source?: string;
}
