import { emitUpgradePrompt } from './upgradePrompt';

const keyForDate = (date = new Date()) =>
  `akiprisaye_quota_refresh_${date.toISOString().slice(0, 10).replace(/-/g, '')}`;

export class QuotaExceededError extends Error {}

export function getRefreshUsage(date = new Date()) {
  const key = keyForDate(date);
  const used = Number(window.localStorage.getItem(key) ?? '0');
  return { key, used: Number.isFinite(used) ? used : 0 };
}

export function assertQuotaOrThrow(quotaName: 'refreshPerDay', limit: number, date = new Date()) {
  const { key, used } = getRefreshUsage(date);
  if (used >= limit) {
    emitUpgradePrompt({
      quotaName,
      message: 'Quota quotidien atteint. Passez à PRO pour continuer.',
    });
    throw new QuotaExceededError('Quota refreshPerDay dépassé');
  }
  window.localStorage.setItem(key, String(used + 1));
}
