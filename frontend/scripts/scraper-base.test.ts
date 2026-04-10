import { describe, expect, it } from 'vitest';
import {
  validateObservation,
} from '../../backend/src/scrapers/base.scraper.js';

describe('validateObservation', () => {
  const base = {
    source: 'scraper' as const,
    retailer: 'E.Leclerc',
    territory: 'gp' as const,
    name: 'Nutella 400g',
    price: 3.49,
    currency: 'EUR' as const,
    observedAt: new Date().toISOString(),
    confidence: 0.9,
  };

  it('accepts a valid observation', () => {
    const result = validateObservation(base);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.name).toBe('Nutella 400g');
      expect(result.data.price).toBe(3.49);
      expect(result.data.territory).toBe('gp');
      expect(result.data.currency).toBe('EUR');
    }
  });

  it('rounds price to 2 decimal places', () => {
    const result = validateObservation({ ...base, price: 3.4999 });
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.data.price).toBe(3.5);
  });

  it('trims whitespace from name', () => {
    const result = validateObservation({ ...base, name: '  Nutella 400g  ' });
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.data.name).toBe('Nutella 400g');
  });

  it('rejects observation with missing name', () => {
    const result = validateObservation({ ...base, name: undefined });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toMatch(/name/i);
  });

  it('rejects observation with name shorter than 2 characters', () => {
    const result = validateObservation({ ...base, name: 'A' });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toMatch(/name/i);
  });

  it('rejects observation with zero price', () => {
    const result = validateObservation({ ...base, price: 0 });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toMatch(/price/i);
  });

  it('rejects observation with negative price', () => {
    const result = validateObservation({ ...base, price: -1.5 });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toMatch(/price/i);
  });

  it('rejects observation with price below minimum threshold (< 0.05)', () => {
    const result = validateObservation({ ...base, price: 0.01 });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toMatch(/range/i);
  });

  it('rejects observation with price above maximum threshold (> 9999)', () => {
    const result = validateObservation({ ...base, price: 10_000 });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toMatch(/range/i);
  });

  it('rejects observation with NaN price', () => {
    const result = validateObservation({ ...base, price: NaN });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toMatch(/price/i);
  });

  it('rejects observation with missing territory', () => {
    const result = validateObservation({ ...base, territory: undefined });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toMatch(/territory/i);
  });

  it('rejects observation with a non-http URL', () => {
    const result = validateObservation({ ...base, url: 'ftp://bad.example/product' });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toMatch(/url/i);
  });

  it('accepts observation with a valid https URL', () => {
    const result = validateObservation({ ...base, url: 'https://leclerc.fr/produit/nutella' });
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.data.url).toBe('https://leclerc.fr/produit/nutella');
  });

  it('uses default confidence 0.75 when not provided', () => {
    const result = validateObservation({ ...base, confidence: undefined });
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.data.confidence).toBe(0.75);
  });

  it('uses default retailer "unknown" when not provided', () => {
    const result = validateObservation({ ...base, retailer: undefined });
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.data.retailer).toBe('unknown');
  });

  it('accepts all supported territory codes including yt (Mayotte)', () => {
    const territories = ['gp', 'mq', 'gf', 're', 'yt'] as const;
    for (const territory of territories) {
      const result = validateObservation({ ...base, territory });
      expect(result.valid).toBe(true);
    }
  });

  it('includes optional brand when provided', () => {
    const result = validateObservation({ ...base, brand: 'Ferrero' });
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.data.brand).toBe('Ferrero');
  });

  it('omits brand field when not provided', () => {
    const result = validateObservation({ ...base, brand: undefined });
    expect(result.valid).toBe(true);
    if (result.valid) expect('brand' in result.data).toBe(false);
  });

  it('includes optional productId when provided', () => {
    const result = validateObservation({ ...base, productId: '3017620422003' });
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.data.productId).toBe('3017620422003');
  });

  it('omits productId field when not provided', () => {
    const result = validateObservation({ ...base, productId: undefined });
    expect(result.valid).toBe(true);
    if (result.valid) expect('productId' in result.data).toBe(false);
  });
});
