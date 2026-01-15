export type TerritoryCode = 'GP' | 'MQ' | 'GF' | 'RE' | 'FR';

export type Territory = TerritoryCode | 'YT';

export interface PriceObservation {
  productId: string;
  productLabel: string;
  territory: Territory;
  price: number;
  source: string;
  observedAt: string; // ISO
}
