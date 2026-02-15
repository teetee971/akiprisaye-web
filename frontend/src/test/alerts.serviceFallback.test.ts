import { afterEach, describe, expect, it, vi } from 'vitest';
import { getAlerts } from '../services/alertsService';

describe('alertsService fallback', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns local fallback when API fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'));

    const result = await getAlerts({ territory: 'gp', onlyActive: true });

    expect(result.metadata.source).toBe('fallback');
    expect(result.alerts.length).toBeGreaterThan(0);
    expect(result.alerts.every((alert) => alert.territory === 'gp')).toBe(true);
  });
});
