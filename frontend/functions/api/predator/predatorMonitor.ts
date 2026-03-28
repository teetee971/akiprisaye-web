import { jsonResponse, methodGuard } from '../../_lib/http';

export interface PredatorTarget {
  id: string;
  name: string;
  url: string;
  cssSelector: string;
  referencePrice: number;
}

export interface PredatorAlert {
  id: string;
  targetId: string;
  targetName: string;
  targetUrl: string;
  observedPrice: number;
  referencePrice: number;
  deltaPercent: number;
  severity: 'medium' | 'high';
  scannedAt: string;
  message: string;
}

const THRESHOLD_PERCENT = 5;

const TARGET_URLS: PredatorTarget[] = [
  {
    id: 'local-hyper',
    name: 'Hyper Local Nord',
    url: 'https://competitor.example/hyper-nord',
    cssSelector: '.pricing-card[data-sku="riz-1kg"] .price',
    referencePrice: 2.4,
  },
  {
    id: 'fuel-central',
    name: 'Station Centrale',
    url: 'https://competitor.example/fuel/centrale',
    cssSelector: '[data-fuel="sp95"] .price',
    referencePrice: 1.95,
  },
];

const round = (value: number): number => Math.round(value * 100) / 100;

const simulateFetchBySelector = async (target: PredatorTarget): Promise<number> => {
  const seed = `${target.url}:${target.cssSelector}`;
  const checksum = Array.from(seed).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const trend = ((checksum % 13) - 6) / 100;
  const observedPrice = target.referencePrice * (1 + trend);
  await new Promise((resolve) => setTimeout(resolve, 80));
  return round(observedPrice);
};

const buildAlert = (target: PredatorTarget, observedPrice: number): PredatorAlert | null => {
  const deltaPercent = ((observedPrice - target.referencePrice) / target.referencePrice) * 100;
  if (Math.abs(deltaPercent) <= THRESHOLD_PERCENT) return null;

  const severity: PredatorAlert['severity'] = Math.abs(deltaPercent) > 10 ? 'high' : 'medium';
  const direction = deltaPercent > 0 ? 'hausse' : 'baisse';

  return {
    id: `${target.id}-${Date.now()}`,
    targetId: target.id,
    targetName: target.name,
    targetUrl: target.url,
    observedPrice,
    referencePrice: target.referencePrice,
    deltaPercent: round(deltaPercent),
    severity,
    scannedAt: new Date().toISOString(),
    message: `${target.name}: ${direction} de ${Math.abs(deltaPercent).toFixed(1)}% détectée.`,
  };
};

const monitorTargets = async (): Promise<PredatorAlert[]> => {
  const checks = await Promise.all(
    TARGET_URLS.map(async (target) => {
      const observedPrice = await simulateFetchBySelector(target);
      return buildAlert(target, observedPrice);
    }),
  );

  return checks.filter((alert): alert is PredatorAlert => Boolean(alert));
};

export const onRequestGet: PagesFunction = async ({ request }) => {
  const blocked = methodGuard(request, ['GET']);
  if (blocked) return blocked;

  const alerts = await monitorTargets();

  return jsonResponse({
    ok: true,
    radar: 'active',
    thresholdPercent: THRESHOLD_PERCENT,
    monitoredTargets: TARGET_URLS,
    alerts,
    scannedAt: new Date().toISOString(),
  });
};
