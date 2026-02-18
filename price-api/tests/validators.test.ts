import { describe, expect, it } from 'vitest';
import { adminObservationSchema, adminProductSchema, getPricesQuerySchema } from '../src/validators';

describe('validators', () => {
  it('validates public prices query', () => {
    const result = getPricesQuerySchema.parse({
      ean: '3560070894222',
      territory: 'gp',
      retailer: 'carrefour',
    });

    expect(result.ean).toBe('3560070894222');
  });

  it('rejects invalid ean', () => {
    expect(() => {
      getPricesQuerySchema.parse({ ean: 'abc' });
    }).toThrow();
  });

  it('validates admin product payload', () => {
    const payload = adminProductSchema.parse({
      ean: '3560070894222',
      productName: "Carrefour Classic’ Sirop de cerise / Cerise-Kers 75 cl",
    });

    expect(payload.productName).toContain('Sirop de cerise');
  });

  it('transforms and validates observation payload', () => {
    const payload = adminObservationSchema.parse({
      ean: '3560070894222',
      territory: 'mq',
      retailer: 'Leclerc',
      price: 4.1,
      currency: 'EUR',
      source: 'admin',
      observedAt: '2026-02-18T12:00:00.000Z',
    });

    expect(payload.retailer).toBe('leclerc');
    expect(payload.observedAt).toBe('2026-02-18T12:00:00.000Z');
  });
});
