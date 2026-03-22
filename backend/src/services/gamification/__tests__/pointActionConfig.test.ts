/**
 * Non-regression test: PointAction enum vs POINTS_CONFIG
 *
 * Ensures that POINTS_CONFIG covers every PointAction value exactly —
 * no missing entries, no extra keys — so adding or removing an enum value
 * in schema.prisma immediately surfaces as a test failure.
 */

import { PointAction } from '@prisma/client';
import { POINTS_CONFIG } from '../pointsService.js';

describe('PointAction integrity', () => {
  it('POINTS_CONFIG keys match PointAction enum values exactly', () => {
    const enumValues = Object.values(PointAction).sort();
    const configKeys = Object.keys(POINTS_CONFIG).sort();
    expect(configKeys).toEqual(enumValues);
  });

  it('LEVEL_UP awards positive points', () => {
    expect(POINTS_CONFIG.LEVEL_UP).toBeGreaterThan(0);
  });

  it('PRICE_REPORT awards positive points', () => {
    expect(POINTS_CONFIG.PRICE_REPORT).toBeGreaterThan(0);
  });

  it('PRICE_VERIFY awards positive points', () => {
    expect(POINTS_CONFIG.PRICE_VERIFY).toBeGreaterThan(0);
  });

  it('all non-badge actions award positive points', () => {
    for (const [action, points] of Object.entries(POINTS_CONFIG)) {
      if (action !== 'BADGE_EARNED') {
        expect(points).toBeGreaterThan(0);
      } else {
        expect(points).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
