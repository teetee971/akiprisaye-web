export interface PriceObservation {
  source: string;
  price: number;
  currency: string;
  unit?: string;
  observedAt: string;
  territory?: string;
  metadata?: Record<string, unknown>;
}

export interface ShoppingListItem {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  qty: number;
  unit?: string;
  territory?: string;

  imageUrl?: string;
  imageThumbUrl?: string;

  createdAt: string;
  updatedAt: string;
  priceHistory: PriceObservation[];
}

export type RecommendationVerdict = 'BUY_NOW' | 'WAIT' | 'WATCH';

export interface Recommendation {
  itemId: string;
  verdict: RecommendationVerdict;
  confidence: number;
  reason: string;
  nextCheckAt: string;
}
