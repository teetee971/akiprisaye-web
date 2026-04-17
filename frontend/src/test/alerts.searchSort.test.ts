import { describe, expect, it } from 'vitest';
import { getAlerts } from '../services/alertsService';

describe('alertsService search and sort', () => {
  it('sorts by severity then by publishedAt desc', async () => {
    const { alerts } = await getAlerts({ territory: 'gp' });
    const criticalIndex = alerts.findIndex((a) => a.severity === 'critical');
    const importantIndex = alerts.findIndex((a) => a.severity === 'important');
    const infoIndex = alerts.findIndex((a) => a.severity === 'info');

    expect(criticalIndex).toBeGreaterThanOrEqual(0);
    expect(importantIndex).toBeGreaterThan(criticalIndex);
    expect(infoIndex).toBeGreaterThan(importantIndex);

    const gpCritical = alerts.filter((a) => a.severity === 'critical');
    expect(new Date(gpCritical[0].publishedAt ?? 0).getTime()).toBeGreaterThanOrEqual(
      new Date(gpCritical[1].publishedAt ?? 0).getTime()
    );
  });

  it('matches q against title, brand, productName, ean and lot', async () => {
    expect(
      (await getAlerts({ territory: 'gp', q: 'omega croissance' })).alerts.length
    ).toBeGreaterThan(0);
    expect((await getAlerts({ territory: 'gp', q: 'Omega Baby' })).alerts.length).toBeGreaterThan(
      0
    );
    expect(
      (await getAlerts({ territory: 'gp', q: '3760123456789' })).alerts.length
    ).toBeGreaterThan(0);
    expect((await getAlerts({ territory: 'gp', q: 'L24011A' })).alerts.length).toBeGreaterThan(0);
  });
});
