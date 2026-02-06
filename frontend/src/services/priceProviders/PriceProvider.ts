import type { ProductPrice } from '../../types/ProductPrice';

export interface PriceProvider {
  search(query: string): Promise<ProductPrice[]>;
}
