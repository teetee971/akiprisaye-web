/**
 * anomaly-detector.service.ts
 *
 * Detects price anomalies: values that are statistically suspicious and
 * should be reviewed before they reach the UI or alerts.
 *
 * Anomaly types:
 *   - Price below floor (< 0.10€) — likely OCR or parse error
 *   - Price above ceiling (≥ 999€) — likely wrong unit or corrupt data
 *   - Sudden increase vs previous observation (≥ +15%)
 *   - Sudden decrease vs previous observation (≤ -15%)
 *
 * This service is intentionally descriptive, NOT accusatory.
 * It flags for review, not for legal action.
 */

import type { PipelinePriceAlert } from './alert-engine.service.js';
import type { MergedObservation }  from './deal-detector.service.js';

// ── Thresholds ────────────────────────────────────────────────────────────────

export const ANOMALY_FLOOR_EUR   = 0.10;
export const ANOMALY_CEILING_EUR = 999;
export const INCREASE_THRESHOLD  = 0.15;   // +15%
export const DECREASE_THRESHOLD  = -0.15;  // -15%

function slugify(name: string, territory: string): string {
  return [name, territory]
    .join('-')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Detect structural anomalies (floor/ceiling) from a single list of
 * observations.  No historical data is required.
 */
export function detectAnomalies(observations: MergedObservation[]): PipelinePriceAlert[] {
  const seen = new Set<string>();
  const alerts: PipelinePriceAlert[] = [];

  for (const obs of observations) {
    const isFloor   = obs.price < ANOMALY_FLOOR_EUR;
    const isCeiling = obs.price >= ANOMALY_CEILING_EUR;

    if (!isFloor && !isCeiling) continue;

    const slug = slugify(obs.name, obs.territory);
    const id   = `anomaly-${slug}-${obs.retailer.toLowerCase()}`;
    if (seen.has(id)) continue;
    seen.add(id);

    alerts.push({
      id,
      type:         'anomaly',
      product:      obs.name,
      retailer:     obs.retailer,
      territory:    obs.territory,
      currentPrice: obs.price,
      severity:     'high',
      alertScore:   100,   // always flag anomalies at maximum priority
      createdAt:    new Date().toISOString(),
    });
  }

  return alerts;
}

/**
 * Detect temporal anomalies by comparing the latest observation for each
 * (product + retailer + territory) triple against its historical median.
 *
 * @param current  Most recent observations
 * @param previous Previous snapshot (older observations for the same scope)
 */
export function detectTemporalAnomalies(
  current:  MergedObservation[],
  previous: MergedObservation[],
): PipelinePriceAlert[] {
  // Build lookup: key → previous price
  const prevMap = new Map<string, number>();
  for (const obs of previous) {
    const key = `${obs.name.toLowerCase()}|${obs.retailer.toLowerCase()}|${obs.territory.toLowerCase()}`;
    prevMap.set(key, obs.price);
  }

  const alerts: PipelinePriceAlert[] = [];
  const seen   = new Set<string>();

  for (const obs of current) {
    const key     = `${obs.name.toLowerCase()}|${obs.retailer.toLowerCase()}|${obs.territory.toLowerCase()}`;
    const prevPrice = prevMap.get(key);
    if (prevPrice === undefined) continue;

    const delta        = obs.price - prevPrice;
    const deltaPercent = delta / prevPrice;

    if (Math.abs(deltaPercent) < Math.abs(DECREASE_THRESHOLD)) continue;

    const id = `${deltaPercent >= 0 ? 'increase' : 'drop'}-${key.replace(/\|/g, '-')}`;
    if (seen.has(id)) continue;
    seen.add(id);

    const type: PipelinePriceAlert['type'] = deltaPercent >= INCREASE_THRESHOLD ? 'increase' : 'drop';
    const severity: PipelinePriceAlert['severity'] =
      Math.abs(deltaPercent) >= 0.30 ? 'high' :
      Math.abs(deltaPercent) >= 0.20 ? 'medium' : 'low';

    const alertScore = +(Math.abs(deltaPercent) * 100).toFixed(1);

    alerts.push({
      id,
      type,
      product:       obs.name,
      retailer:      obs.retailer,
      territory:     obs.territory,
      currentPrice:  obs.price,
      previousPrice: prevPrice,
      deltaValue:    +delta.toFixed(2),
      deltaPercent:  +(deltaPercent * 100).toFixed(1),
      severity,
      alertScore,
      createdAt:     new Date().toISOString(),
    });
  }

  return alerts.sort((a, b) => b.alertScore - a.alertScore);
}
