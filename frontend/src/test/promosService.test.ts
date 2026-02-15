import { describe, expect, it } from 'vitest';
import { getPromos, sortPromos } from '../services/promosService';

describe('promosService', () => {
  it('filters by territory only', () => {
    const promos = getPromos({ territory: 'gp' });
    expect(promos.length).toBeGreaterThan(0);
    expect(promos.every((promo) => promo.territory === 'gp')).toBe(true);
  });

  it('filters by storeId and mode', () => {
    const promos = getPromos({ territory: 'gp', storeId: 'gp-leclerc-bas-du-fort', mode: 'drive' });
    expect(promos.length).toBe(1);
    expect(promos[0]?.storeId).toBe('gp-leclerc-bas-du-fort');
    expect(promos[0]?.mode).toBe('drive');
  });

  it('sorts by discount descending', () => {
    const sorted = sortPromos(getPromos({ territory: 'gp' }), 'discountDesc');
    expect(sorted[0]?.discountPct).toBeGreaterThanOrEqual(sorted[1]?.discountPct ?? 0);
  });

  it('sorts by nearest ending date', () => {
    const sorted = sortPromos(getPromos({ territory: 'gp' }), 'endDateAsc');
    const first = new Date(String(sorted[0]?.validTo)).getTime();
    const second = new Date(String(sorted[1]?.validTo)).getTime();
    expect(first).toBeLessThanOrEqual(second);
  });
});
