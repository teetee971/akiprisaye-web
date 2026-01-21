export type TerritoryCode =
  | 'FR'
  | 'GP'
  | 'MQ'
  | 'GF'
  | 'RE'
  | 'YT'
  | 'PM'
  | 'BL'
  | 'MF'
  | 'WF'
  | 'PF'
  | 'NC';

export interface PriceObservation {
  id?: string;
  productId: string;
  productLabel: string;
  territory: TerritoryCode;
  price: number;
  observedAt: string; // ISO
  storeLabel?: string;
  currency?: 'EUR';
  sourceType?: 'citizen' | 'open_data' | 'partner';
  confidenceScore?: number;
  observationsCount?: number;
  source?: string;
  unit?: 'unit' | 'kg' | 'l';
  pricePerUnit?: number;
  normalizedLabel?: string;
  barcode?: string;
  brand?: string;
  metadata?: Record<string, string>;
}
