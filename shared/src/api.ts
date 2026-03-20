import type { Product, PriceObservation, CompareSummary } from './price.js';

export interface CompareResponse {
  product: Product;
  territory: string;
  retailerFilter: string | null;
  observations: PriceObservation[];
  summary: CompareSummary;
}

export interface ProductsResponse {
  products: Product[];
}

export interface HistoryPoint {
  date: string;
  price: number;
}

export interface HistoryResponse {
  history: HistoryPoint[];
}

export type SignalStatus = 'buy' | 'wait' | 'neutral';

export interface SignalResponse {
  status: SignalStatus;
  label: string;
  reason: string;
}
