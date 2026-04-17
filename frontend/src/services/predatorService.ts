export interface PredatorTarget {
  id: string;
  name: string;
  url: string;
  cssSelector: string;
  referencePrice: number;
}

export interface PredatorScanResult {
  targetId: string;
  observedPrice: number;
  referencePrice: number;
  deltaPercent: number;
  scannedAt: string;
}

export interface PredatorAlert extends PredatorScanResult {
  id: string;
  targetName: string;
  targetUrl: string;
  severity: 'medium' | 'high';
  message: string;
}

const DEFAULT_THRESHOLD_PERCENT = 5;

export const PREDATOR_TARGETS: PredatorTarget[] = [
  {
    id: 'competitor-hyper-gp',
    name: 'Hyper Antilles',
    url: 'https://competitor.example/hyper-antilles',
    cssSelector: '.product-card[data-ean="3270190200004"] .price',
    referencePrice: 2.35,
  },
  {
    id: 'fuel-station-baie',
    name: 'Station Baie-Mahault',
    url: 'https://competitor.example/fuel/baie-mahault',
    cssSelector: '[data-product="diesel"] .price-value',
    referencePrice: 1.89,
  },
  {
    id: 'pharma-basse-terre',
    name: 'Pharma Basse-Terre',
    url: 'https://competitor.example/pharma-basse-terre',
    cssSelector: '.offer[data-sku="masque-ffp2"] .price',
    referencePrice: 12.5,
  },
];

const round = (value: number): number => Math.round(value * 100) / 100;

const computeDeltaPercent = (localData: number, competitorData: number): number => {
  if (localData <= 0) return 0;
  return ((competitorData - localData) / localData) * 100;
};

/**
 * Simule un fetch concurrent propre et déterministe à partir de l'URL et du sélecteur CSS.
 */
export const simulateFetchPrice = async (target: PredatorTarget): Promise<number> => {
  const seed = `${target.url}|${target.cssSelector}`;
  const hash = Array.from(seed).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const variation = ((hash % 11) - 5) / 100; // de -5% à +5%
  const jitter = (hash % 7) / 1000; // micro variation visuelle
  const simulatedPrice = target.referencePrice * (1 + variation + jitter);

  await new Promise((resolve) => setTimeout(resolve, 120));
  return round(simulatedPrice);
};

const comparePrices = (
  localData: number,
  competitorData: number,
  thresholdPercent = DEFAULT_THRESHOLD_PERCENT
): PredatorScanResult | null => {
  if (!Number.isFinite(localData) || !Number.isFinite(competitorData)) return null;

  const deltaPercent = computeDeltaPercent(localData, competitorData);
  if (Math.abs(deltaPercent) <= thresholdPercent) return null;

  return {
    targetId: 'manual-comparison',
    observedPrice: round(competitorData),
    referencePrice: round(localData),
    deltaPercent: round(deltaPercent),
    scannedAt: new Date().toISOString(),
  };
};

export const buildPredatorAlert = (
  target: PredatorTarget,
  observedPrice: number,
  thresholdPercent = DEFAULT_THRESHOLD_PERCENT
): PredatorAlert | null => {
  const comparison = comparePrices(target.referencePrice, observedPrice, thresholdPercent);
  if (!comparison) return null;

  const severity: PredatorAlert['severity'] =
    Math.abs(comparison.deltaPercent) >= 10 ? 'high' : 'medium';
  const direction = comparison.deltaPercent > 0 ? 'hausse' : 'baisse';

  return {
    ...comparison,
    id: `${target.id}-${Date.now()}`,
    targetId: target.id,
    targetName: target.name,
    targetUrl: target.url,
    severity,
    message: `${target.name}: ${direction} détectée de ${Math.abs(comparison.deltaPercent).toFixed(1)}% (réf. ${target.referencePrice.toFixed(2)}€ → ${observedPrice.toFixed(2)}€).`,
  };
};

export const runPredatorMonitoring = async (
  targets: PredatorTarget[] = PREDATOR_TARGETS,
  thresholdPercent = DEFAULT_THRESHOLD_PERCENT
): Promise<PredatorAlert[]> => {
  const alerts = await Promise.all(
    targets.map(async (target) => {
      const observedPrice = await simulateFetchPrice(target);
      return buildPredatorAlert(target, observedPrice, thresholdPercent);
    })
  );

  return alerts.filter((alert): alert is PredatorAlert => Boolean(alert));
};

export const getPredatorSeedAlerts = (): PredatorAlert[] => [
  {
    id: 'seed-1',
    targetId: 'fuel-station-baie',
    targetName: 'Station Baie-Mahault',
    targetUrl: 'https://competitor.example/fuel/baie-mahault',
    observedPrice: 1.76,
    referencePrice: 1.89,
    deltaPercent: -6.88,
    scannedAt: new Date().toISOString(),
    severity: 'medium',
    message: 'Baisse carburant repérée sur diesel: -6.9% vs base locale.',
  },
];
