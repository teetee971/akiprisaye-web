import { describe, expect, it } from 'vitest';
import { getAlerts } from '../services/alertsService';

describe('alertsService onlyActive filter', () => {
  it('returns only active alerts when onlyActive=true', async () => {
    const { alerts } = await getAlerts({ territory: 'gp', onlyActive: true });

    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts.every((alert) => alert.status === 'active')).toBe(true);
  });

  it('keeps resolved alerts when onlyActive=false', async () => {
    const { alerts } = await getAlerts({ territory: 'gp', onlyActive: false });
    expect(alerts.some((alert) => alert.status === 'resolved')).toBe(true);
  });
});
