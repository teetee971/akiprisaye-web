import type {
  PriceObservation,
  PriceSearchInput,
  PriceSourceId,
} from '../services/priceSearch/price.types';

export type ProviderStatus = 'OK' | 'NO_DATA' | 'UNAVAILABLE';

export interface ProviderResult {
  source: PriceSourceId;
  status: ProviderStatus;
  observations: PriceObservation[];
  warnings: string[];
  productName?: string;
}

export interface PriceProvider {
  source: PriceSourceId;
  isEnabled: () => boolean;
  search: (input: PriceSearchInput, signal: AbortSignal) => Promise<ProviderResult>;
}
