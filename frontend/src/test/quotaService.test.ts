import { beforeEach, describe, expect, it } from 'vitest';
import { assertQuotaOrThrow, getRefreshUsage, QuotaExceededError } from '../billing/quotaService';

describe('quotaService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('increments usage for current day', () => {
    const date = new Date('2026-01-01T10:00:00Z');
    assertQuotaOrThrow('refreshPerDay', 2, date);
    expect(getRefreshUsage(date).used).toBe(1);
  });

  it('resets usage by date key', () => {
    const d1 = new Date('2026-01-01T10:00:00Z');
    const d2 = new Date('2026-01-02T10:00:00Z');
    assertQuotaOrThrow('refreshPerDay', 2, d1);
    expect(getRefreshUsage(d2).used).toBe(0);
  });

  it('throws when limit is reached', () => {
    const date = new Date('2026-01-01T10:00:00Z');
    assertQuotaOrThrow('refreshPerDay', 1, date);
    expect(() => assertQuotaOrThrow('refreshPerDay', 1, date)).toThrow(QuotaExceededError);
  });
});
