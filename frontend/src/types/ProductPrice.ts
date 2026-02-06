export interface ProductPrice {
  id: string;
  name: string;
  brand?: string;
  category?: string;
  price?: number;
  priceRange?: [number, number];
  currency: 'EUR';
  store?: string;
  region?: 'FR' | 'DOM';
  location?: string;
  lastUpdated: string;
  source: 'openfoodfacts' | 'datagouv' | 'estimate';
  confidence: 'high' | 'medium' | 'low';
}
