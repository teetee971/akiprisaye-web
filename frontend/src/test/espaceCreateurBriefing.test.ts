import { describe, expect, it } from 'vitest';
import { buildCreatorBriefing } from '../pages/EspaceCreateur';
import type { InterestStats, TerritoryInterestStat, TerritoryStats } from '../hooks/useVisitorStats';

function makeTerritory(overrides: Partial<TerritoryStats> = {}): TerritoryStats {
  return {
    code: 'GP',
    name: 'Guadeloupe',
    flag: '🇬🇵',
    online: 2,
    totalVisits: 200,
    topInterests: [],
    ...overrides,
  };
}

function makeInterest(overrides: Partial<InterestStats> = {}): InterestStats {
  return {
    key: 'comparateur',
    name: 'Comparateur de prix',
    emoji: '🛒',
    description: 'Comparer les prix entre enseignes',
    online: 3,
    totalViews: 500,
    ...overrides,
  };
}

function makeTerritoryHistoricalInterest(overrides: Partial<TerritoryInterestStat> = {}): TerritoryInterestStat {
  return {
    territory: 'GP',
    interest: 'comparateur',
    name: 'Comparateur de prix',
    emoji: '🛒',
    totalViews: 400,
    ...overrides,
  };
}

describe('buildCreatorBriefing', () => {
  it('avoids repeating the same territory focus when live and historical interests match', () => {
    const briefing = buildCreatorBriefing({
      topTerritory: makeTerritory(),
      topInterest: makeInterest(),
      topTerritoryHistoricalInterest: makeTerritoryHistoricalInterest(),
    });

    expect(briefing).toContain('Le foyer d’attention principal est 🛒 comparateur de prix');
    expect(briefing).toContain('ce besoin confirme aussi le meilleur signal historique sur ce territoire');
    expect(briefing).not.toContain('tandis que le meilleur signal historique sur ce territoire reste 🛒 comparateur de prix');
  });

  it('keeps the historical detail wording when live and historical interests differ', () => {
    const briefing = buildCreatorBriefing({
      topTerritory: makeTerritory(),
      topInterest: makeInterest({ key: 'comparateur', name: 'Comparateur de prix', emoji: '🛒' }),
      topTerritoryHistoricalInterest: makeTerritoryHistoricalInterest({ interest: 'observatoire', name: 'Observatoire des prix', emoji: '📊' }),
    });

    expect(briefing).toContain('tandis que le meilleur signal historique sur ce territoire reste 📊 observatoire des prix');
  });
});
