import { describe, expect, it } from 'vitest';
import { PLAN_DEFINITIONS } from '../billing/plans';

function shouldAllowMultiTerritory(
  plan: keyof typeof PLAN_DEFINITIONS,
  selectedTerritories: string[]
) {
  const def = PLAN_DEFINITIONS[plan];
  return selectedTerritories.length <= def.quotas.maxTerritories && def.features.MULTI_TERRITORY;
}

describe('decision engine', () => {
  it('blocks multi territory on FREE', () => {
    expect(shouldAllowMultiTerritory('FREE', ['Guadeloupe', 'Martinique'])).toBe(false);
  });

  it('allows multi territory on PRO with small selection', () => {
    expect(shouldAllowMultiTerritory('PRO', ['Guadeloupe', 'Martinique'])).toBe(true);
  });
});
