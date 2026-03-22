/**
 * Non-regression test: legacyActionMapper
 *
 * Ensures every LegacyAction maps to the correct canonical PointAction value
 * and that the mapper is exhaustive (no unhandled cases at compile time).
 */

import { PointAction } from '@prisma/client';
import { mapToPointAction, LegacyAction } from '../legacyActionMapper.js';

describe('legacyActionMapper', () => {
  it('LEVEL_UP maps to PointAction.LEVEL_UP', () => {
    expect(mapToPointAction('LEVEL_UP')).toBe(PointAction.LEVEL_UP);
  });

  it('BADGE_UNLOCKED maps to PointAction.BADGE_EARNED', () => {
    expect(mapToPointAction('BADGE_UNLOCKED')).toBe(PointAction.BADGE_EARNED);
  });

  it('SUBMIT_PRICE maps to PointAction.PRICE_REPORT', () => {
    expect(mapToPointAction('SUBMIT_PRICE')).toBe(PointAction.PRICE_REPORT);
  });

  it('VERIFY_PRICE maps to PointAction.PRICE_VERIFY', () => {
    expect(mapToPointAction('VERIFY_PRICE')).toBe(PointAction.PRICE_VERIFY);
  });

  it('all mapped results are valid PointAction enum values', () => {
    const legacyActions: LegacyAction[] = [
      'LEVEL_UP',
      'BADGE_UNLOCKED',
      'SUBMIT_PRICE',
      'VERIFY_PRICE',
    ];
    const validActions = Object.values(PointAction);
    for (const legacy of legacyActions) {
      const mapped = mapToPointAction(legacy);
      expect(validActions).toContain(mapped);
    }
  });
});
