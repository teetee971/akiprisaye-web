import { test, expect } from 'vitest';
import { normalizePriceObservation } from '../../services/priceSearch/adapters/normalizePriceObservation';

const raw = {
  price: 1.89,
  territory: 'guadeloupe',
  source: 'ocr',
  unit: 'L',
  date: '2026-01-20',
  product_name: 'Lait demi-écrémé',
};

test('normalisation produit un PriceObservation valide', () => {
  const normalized = normalizePriceObservation(raw, {
    territory: 'GP',
    source: 'open_prices',
    fallbackLabel: 'Lait',
  });

  expect(normalized).toMatchObject({
    price: 1.89,
    territory: 'GP',
    unit: 'l',
  });

  expect(normalized).toHaveProperty('confidenceScore');
});
