import { describe, expect, it } from 'vitest';
import { filterActiveAlerts } from '../services/alertsService';

describe('filterActiveAlerts', () => {
  it('filters active alerts by territory', () => {
    const alerts = filterActiveAlerts({ territory: 'gp', now: new Date('2026-02-13T10:00:00.000Z') });
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts.every((a) => !a.territory || a.territory === 'gp')).toBe(true);
  });
});
