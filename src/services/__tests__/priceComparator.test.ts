import { describe, expect, it } from 'vitest';
import type { NormalizedPriceObservation } from '../priceSearch/price.types';
import { comparePrices } from '../priceComparator';
import { computePriceInterval } from '../priceSearch/priceInterval';

describe('computePriceInterval', () => {
  it('computes min, median and max using normalized unit prices', () => {
    const observations: NormalizedPriceObservation[] = [
      {
        source: 'data_gouv',
        price: 2.5,
        currency: 'EUR',
        normalizedLabel: '5.00€ / kg',
        pricePerUnit: 5,
        territory: 'fr',
      },
      {
        source: 'data_gouv',
        price: 3,
        currency: 'EUR',
        normalizedLabel: '3.00€',
        territory: 'fr',
      },
      {
        source: 'data_gouv',
        price: 4,
        currency: 'EUR',
        normalizedLabel: '2.00€ / l',
        pricePerUnit: 2,
        territory: 'fr',
      },
    ];

    const interval = computePriceInterval(observations);

    expect(interval.min).toBe(2);
    expect(interval.median).toBe(3);
    expect(interval.max).toBe(5);
    expect(interval.priceCount).toBe(3);
  });

  it('returns nulls when no values are available', () => {
    const interval = computePriceInterval([]);

    expect(interval.min).toBeNull();
    expect(interval.median).toBeNull();
    expect(interval.max).toBeNull();
    expect(interval.priceCount).toBe(0);
  });
});

describe('comparePrices', () => {
  it('returns NO_DATA when no local observation matches', async () => {
    const result = await comparePrices({ query: 'Produit introuvable', territory: 'fr' });

    expect(result.status).toBe('NO_DATA');
    expect(result.interval).toBeNull();
    expect(result.items).toHaveLength(0);
  });
});
