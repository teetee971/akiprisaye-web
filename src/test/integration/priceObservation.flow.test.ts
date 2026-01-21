import { test, expect } from 'vitest';
import { normalizePriceObservation } from '../../services/priceSearch/adapters/normalizePriceObservation';
import { aggregateObservations } from '../../services/priceAggregationService';

const raw = {
  price: 2.5,
  unit: 'kg',
  product_name: 'Riz blanc',
  observed_at: '2025-01-01T10:00:00.000Z',
};

test('PriceObservation traverse search → aggregation sans divergence', () => {
  const observation = normalizePriceObservation(raw, {
    territory: 'GP',
    source: 'open_prices',
    fallbackLabel: 'Riz',
  });

  expect(observation).not.toBeNull();
  const aggregation = aggregateObservations([observation!]);

  expect(aggregation).not.toBeNull();
  expect(aggregation?.observations[0]).toEqual(
    expect.objectContaining({
      territory: observation?.territory,
      price: observation?.price,
    })
  );
});
