/**
 * alert-engine.service.ts — Pipeline alert engine
 *
 * Orchestrates deal detection + anomaly detection.
 * This is the stateless, filesystem-based counterpart to the Prisma-backed
 * user-alert system in backend/src/services/alerts/.
 *
 * Usage (from generate-alerts.mjs):
 *   import { runAlertEngine } from './alert-engine.service.js';
 *   const result = await runAlertEngine(mergedObservations);
 */

import { detectDeals, DEAL_SPREAD_THRESHOLD_EUR }   from './deal-detector.service.js';
import { detectAnomalies, detectTemporalAnomalies } from './anomaly-detector.service.js';
import type { MergedObservation }                   from './deal-detector.service.js';

// ── Pipeline alert type ───────────────────────────────────────────────────────
// Self-contained here so backend/* imports don't need to reach into shared/src.
// Kept in sync with shared/src/revenue.ts PipelinePriceAlert.

export interface PipelinePriceAlert {
  id: string;
  type: 'deal' | 'drop' | 'increase' | 'anomaly';
  product: string;
  retailer: string;
  territory: string;
  currentPrice: number;
  previousPrice?: number;
  deltaValue?: number;
  deltaPercent?: number;
  spread?: number;
  severity: 'low' | 'medium' | 'high';
  alertScore: number;
  url?: string;
  createdAt: string;
  social?: {
    whatsapp: string;
    facebook: string;
    tiktokHook: string;
  };
}

// ── Engine result ─────────────────────────────────────────────────────────────

export interface AlertEngineResult {
  deals:     PipelinePriceAlert[];
  drops:     PipelinePriceAlert[];
  increases: PipelinePriceAlert[];
  anomalies: PipelinePriceAlert[];
  all:       PipelinePriceAlert[];
  stats: {
    totalAlerts: number;
    highSeverity: number;
    mediumSeverity: number;
    lowSeverity: number;
    generatedAt: string;
  };
}

// ── Engine ────────────────────────────────────────────────────────────────────

/**
 * Run the full alert pipeline on a list of merged observations.
 *
 * @param current   Latest merged observations
 * @param previous  Previous snapshot (optional — enables temporal anomalies)
 */
export function runAlertEngine(
  current:  MergedObservation[],
  previous: MergedObservation[] = [],
): AlertEngineResult {
  const deals      = detectDeals(current);
  const anomalies  = detectAnomalies(current);
  const temporal   = detectTemporalAnomalies(current, previous);
  const drops      = temporal.filter((a) => a.type === 'drop');
  const increases  = temporal.filter((a) => a.type === 'increase');

  // Deduplicate across all alert types by id
  const seen = new Set<string>();
  const all: PipelinePriceAlert[] = [];
  for (const alert of [...anomalies, ...deals, ...drops, ...increases]) {
    if (seen.has(alert.id)) continue;
    seen.add(alert.id);
    all.push(alert);
  }

  // Sort: anomalies first, then by alertScore descending
  all.sort((a, b) => {
    if (a.type === 'anomaly' && b.type !== 'anomaly') return -1;
    if (b.type === 'anomaly' && a.type !== 'anomaly') return 1;
    return b.alertScore - a.alertScore;
  });

  const highSeverity   = all.filter((a) => a.severity === 'high').length;
  const mediumSeverity = all.filter((a) => a.severity === 'medium').length;
  const lowSeverity    = all.filter((a) => a.severity === 'low').length;

  return {
    deals,
    drops,
    increases,
    anomalies,
    all,
    stats: {
      totalAlerts: all.length,
      highSeverity,
      mediumSeverity,
      lowSeverity,
      generatedAt: new Date().toISOString(),
    },
  };
}

export { DEAL_SPREAD_THRESHOLD_EUR };
