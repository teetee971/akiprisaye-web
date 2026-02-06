import type { ProductPrice } from '../../types/ProductPrice';
import { DataGouvProvider } from './DataGouvProvider';
import { OpenFoodFactsProvider } from './OpenFoodFactsProvider';
import type { PriceProvider } from './PriceProvider';

const normalizeKey = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const getProductKey = (product: ProductPrice): string =>
  [product.name, product.brand].filter(Boolean).map(normalizeKey).join('|');

const confidenceRank: Record<ProductPrice['confidence'], number> = {
  high: 3,
  medium: 2,
  low: 1,
};

const shouldReplace = (current: ProductPrice, next: ProductPrice): boolean => {
  if (current.price === undefined && next.price !== undefined) {
    return true;
  }
  if (current.price !== undefined && next.price !== undefined) {
    return confidenceRank[next.confidence] > confidenceRank[current.confidence];
  }
  if (!current.priceRange && next.priceRange) {
    return true;
  }
  return confidenceRank[next.confidence] > confidenceRank[current.confidence];
};

export class PriceAggregator {
  private providers: PriceProvider[] = [new OpenFoodFactsProvider(), new DataGouvProvider()];

  async search(query: string): Promise<ProductPrice[]> {
    const results = await Promise.allSettled(
      this.providers.map((provider) => provider.search(query)),
    );

    const fulfilled = results.filter(
      (result): result is PromiseFulfilledResult<ProductPrice[]> => result.status === 'fulfilled',
    );

    if (fulfilled.length === 0) {
      throw new Error('providers_unavailable');
    }

    const merged = new Map<string, ProductPrice>();

    fulfilled.flatMap((result) => result.value).forEach((product) => {
      const key = getProductKey(product);
      const existing = merged.get(key);
      if (!existing || shouldReplace(existing, product)) {
        merged.set(key, product);
      }
    });

    return Array.from(merged.values());
  }
}
