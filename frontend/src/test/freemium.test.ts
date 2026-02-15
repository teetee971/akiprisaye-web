import { beforeEach, describe, expect, it } from 'vitest';
import { __test_resetGuestQuota, consumeGuestQuota, getGuestQuotaStatus, shouldTriggerPaywall } from '../services/freemium';

describe('guest quota', () => {
  beforeEach(() => {
    localStorage.clear();
    __test_resetGuestQuota();
  });

  it('resets quota when day changes', () => {
    const first = consumeGuestQuota();
    expect(first.used).toBe(1);

    localStorage.setItem('akp:guestQuota', JSON.stringify({ day: '2000-01-01', searchesUsed: 5 }));
    const status = getGuestQuotaStatus();

    expect(status.used).toBe(0);
    expect(status.remaining).toBe(5);
  });
});

describe('paywall trigger', () => {
  it('triggers on quota exhaustion and pro feature', () => {
    expect(shouldTriggerPaywall(false, null)).toBe(true);
    expect(shouldTriggerPaywall(true, 'pro_feature')).toBe(true);
    expect(shouldTriggerPaywall(true, null)).toBe(false);
  });
});
