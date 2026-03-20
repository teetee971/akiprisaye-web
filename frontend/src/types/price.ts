export type PriceSourceId = 'open_food_facts' | 'open_prices' | 'internal' | 'mock';

export interface PriceObservation {
  retailer: string;
  territory: string;
  price: number;
  currency: 'EUR';
  observedAt: string;
  source: PriceSourceId;
}
