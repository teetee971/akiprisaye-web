import { describe, expect, it } from 'vitest';
import { getDistanceKm, isOpenNow } from '../src/utils/storeUtils';

describe('storeUtils', () => {
  it('computes distance in km', () => {
    const distance = getDistanceKm(
      { lat: 16.2217, lon: -61.5308 },
      { lat: 16.2394, lon: -61.5064 }
    );

    expect(distance).toBeGreaterThan(3);
    expect(distance).toBeLessThan(4);
  });

  it('returns open status for opening range', () => {
    const status = isOpenNow(
      { mon: ['08:00-18:00'] },
      new Date('2024-01-15T14:00:00Z'),
      'America/Guadeloupe'
    );

    expect(status.open).toBe(true);
    expect(status.label).toContain("jusqu'à 18:00");
  });

  it('returns closed status out of range', () => {
    const status = isOpenNow(
      { mon: ['08:00-12:00'] },
      new Date('2024-01-15T18:00:00Z'),
      'America/Guadeloupe'
    );

    expect(status.open).toBe(false);
  });
});
