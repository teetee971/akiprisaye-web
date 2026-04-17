import { describe, expect, it } from 'vitest';
import { computeObservationStatus, normalizeObservation } from '../services/observationsService';

describe('observations normalization', () => {
  it('normalizes an observation payload', () => {
    const normalized = normalizeObservation({
      barcode: '123',
      territory: 'gp',
      price: 1.2,
      observedAt: '2026-02-12',
      storeName: 'Test store',
    });
    expect(normalized.currency).toBe('EUR');
    expect(normalized.storeName).toBe('Test store');
    expect(normalized.id).toContain('123-gp');
  });

  it('computes NO_DATA/PARTIAL/OK status', () => {
    expect(computeObservationStatus([])).toBe('NO_DATA');
    expect(
      computeObservationStatus([
        normalizeObservation({ barcode: '1', territory: 'gp', price: 1, observedAt: '2026-01-01' }),
      ])
    ).toBe('PARTIAL');
    expect(
      computeObservationStatus([
        normalizeObservation({ barcode: '1', territory: 'gp', price: 1, observedAt: '2026-01-01' }),
        normalizeObservation({
          barcode: '1',
          territory: 'gp',
          price: 1.1,
          observedAt: '2026-01-02',
        }),
      ])
    ).toBe('OK');
  });
});
