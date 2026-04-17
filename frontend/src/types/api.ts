export type {
  CompareProduct,
  PriceObservationRow,
  CompareSummary,
  CompareResponse,
  CompareParams,
} from './compare';

export type SignalStatus = 'buy' | 'wait' | 'neutral';

export interface SignalResult {
  status: SignalStatus;
  label: string;
  reason: string;
}

export interface HistoryPoint {
  date: string;
  price: number;
}
