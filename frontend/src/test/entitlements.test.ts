import { describe, expect, it } from 'vitest';
import { PLAN_DEFINITIONS } from '../billing/plans';

describe('entitlements', () => {
  it('enables advanced features for PRO', () => {
    expect(PLAN_DEFINITIONS.PRO.features.PRICE_ALERTS).toBe(true);
    expect(PLAN_DEFINITIONS.FREE.features.PRICE_ALERTS).toBe(false);
  });

  it('keeps API access for institution only', () => {
    expect(PLAN_DEFINITIONS.INSTITUTION.features.API_ACCESS).toBe(true);
    expect(PLAN_DEFINITIONS.BUSINESS.features.API_ACCESS).toBe(false);
  });
});
