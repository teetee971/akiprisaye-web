export interface LocalProductItem {
  barcode: string;
  title: string;
  brand?: string;
  imageUrl?: string;
  territory?: string;
  lastPrice?: number;
  median?: number;
  lastSeenAt: string;
}

export interface LocalPriceReport {
  id: string;
  barcode: string;
  territory: string;
  source: 'user_report';
  price: number;
  currency: 'EUR';
  unit?: 'unit' | 'kg' | 'l';
  store?: string;
  city?: string;
  observedAt: string;
  createdAt: string;
  note?: string;
}
