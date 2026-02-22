import { describe, expect, it } from 'vitest';
import { normalizePrice } from '../normalization';

describe('normalizePrice', () => {
  it('normalizes kg from grams', () => {
    const result = normalizePrice({ price: 3, unit: 'kg', quantityValue: 500, quantityUnit: 'g' });
    expect(result.pricePerUnit).toBeCloseTo(6, 4);
    expect(result.normalizedLabel).toContain('€/kg');
  });

  it('normalizes liters from ml', () => {
    const result = normalizePrice({ price: 2.4, unit: 'l', quantityValue: 750, quantityUnit: 'ml' });
    expect(result.pricePerUnit).toBeCloseTo(3.2, 4);
    expect(result.normalizedLabel).toContain('€/L');
  });

  it('falls back to unit price when quantity data is missing', () => {
    const result = normalizePrice({ price: 1.99 });
    expect(result.pricePerUnit).toBeCloseTo(1.99, 4);
    expect(result.normalizedLabel).toContain('€/unité');
  });
});
