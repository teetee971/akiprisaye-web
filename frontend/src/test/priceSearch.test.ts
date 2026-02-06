import { describe, it, expect } from 'vitest';
import { computeMedian, normalizeObservation } from '../services/priceSearch/priceNormalizer';
import { computePriceConfidence } from '../services/priceSearch/priceConfidence';
import { buildPriceSearchInput, extractBarcode } from '../services/scanHub/scanToPriceBridge';

describe('Price search utilities', () => {
  it('computes the median of price arrays', () => {
    expect(computeMedian([2, 1, 3])).toBe(2);
    expect(computeMedian([2, 4, 6, 8])).toBe(5);
    expect(computeMedian([])).toBeNull();
  });

  it('normalizes price observations and labels', () => {
    const normalized = normalizeObservation({
      source: 'open_prices',
      price: 2.5,
      currency: 'EUR',
      unit: 'kg',
    });

    expect(normalized.price).toBe(2.5);
    expect(normalized.normalizedLabel).toBe('2.50€ / kg');
  });

  it('computes confidence score with multiple sources', () => {
    const score = computePriceConfidence({
      territoryMatch: true,
      observations: [
        {
          source: 'open_prices',
          price: 1,
          currency: 'EUR',
          normalizedLabel: '1.00€',
        },
        {
          source: 'open_food_facts',
          price: 1.2,
          currency: 'EUR',
          normalizedLabel: '1.20€',
        },
      ],
    });

    expect(score).toBeGreaterThan(0);
  });

  it('extracts barcode from scan text', () => {
    expect(extractBarcode('EAN 3229820129488')).toBe('3229820129488');
    expect(extractBarcode('Pas de code ici')).toBeUndefined();
  });

  it('builds price search input with barcode priority', () => {
    const input = buildPriceSearchInput({ text: 'Produit 12345678' });
    expect(input.barcode).toBe('12345678');
    expect(input.query).toBeUndefined();
  });
});
