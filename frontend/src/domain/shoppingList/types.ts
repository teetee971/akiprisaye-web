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
  unit?: 'unit' | 'kg' | 'l';
  quantityValue?: number;
  quantityUnit?: 'kg' | 'g' | 'l' | 'ml' | 'unit';
  territory?: string;
<<<<<<< HEAD

=======
>>>>>>> origin/main
  imageUrl?: string;
  imageThumbUrl?: string;
  normalized?: {
    pricePerUnit?: number;
    normalizedLabel?: string;
  };
  premium?: {
    score?: number;
    trend7?: 'up' | 'down' | 'flat';
    trend30?: 'up' | 'down' | 'flat';
    alerts?: string[];
  };
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
