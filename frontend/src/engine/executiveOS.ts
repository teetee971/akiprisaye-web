/**
 * executiveOS.ts — Executive Operating System core (V8)
 *
 * Aggregates all platform signals into a single executive control layer:
 *   traffic · revenue · retention · data quality · stability
 *
 * Outputs:
 *   - platform health score
 *   - KPI summary
 *   - risk register
 *   - decision backlog
 */

import { type PlatformKPI, computePlatformKPIs } from './kpiEngine';
import { type PlatformRisk, detectRisks } from './riskEngine';
import { type Decision, generateDecisions } from './decisionEngine';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PlatformSignals {
  totalProducts: number;
  cashMaxProducts: number;
  indexedPages: number;
  affiliateClicks30d: number;
  conversions30d: number;
  repeatUsers: number;
  totalRetailers: number;
  estimatedMonthlyRev: number;
  lastScrapeOk: boolean;
  lastScrapeAt?: number;
}

export interface ExecutiveSnapshot {
  healthScore: number;
  healthStatus: 'healthy' | 'warning' | 'critical';
  kpis: PlatformKPI[];
  risks: PlatformRisk[];
  decisions: Decision[];
  dimensions: {
    traffic: number;
    revenue: number;
    retention: number;
    data: number;
    stability: number;
  };
  generatedAt: number;
}

// ── Health formula ────────────────────────────────────────────────────────────

/**
 * Compute platform health score 0–100.
 *
 *   health =
 *     traffic   × 0.25
 *     revenue   × 0.30
 *     retention × 0.20
 *     data      × 0.15
 *     stability × 0.10
 */
export function computePlatformHealth(
  signals: PlatformSignals
): ExecutiveSnapshot['dimensions'] & { overall: number } {
  const traffic = Math.min(100, ((signals.affiliateClicks30d ?? 0) / 500) * 100);
  const revenue = Math.min(100, ((signals.cashMaxProducts ?? 0) / 20) * 100);
  const retention = Math.min(100, ((signals.repeatUsers ?? 0) / 200) * 100);
  const data = Math.min(100, ((signals.totalProducts ?? 0) / 100) * 100);
  const stability = signals.lastScrapeOk ? 100 : 30;

  const overall = Math.round(
    traffic * 0.25 + revenue * 0.3 + retention * 0.2 + data * 0.15 + stability * 0.1
  );

  return {
    traffic: Math.round(traffic),
    revenue: Math.round(revenue),
    retention: Math.round(retention),
    data: Math.round(data),
    stability: Math.round(stability),
    overall: Math.min(100, overall),
  };
}

// ── Full snapshot ─────────────────────────────────────────────────────────────

/**
 * Build a complete executive snapshot from platform signals.
 */
export function buildExecutiveSnapshot(signals: PlatformSignals): ExecutiveSnapshot {
  const dims = computePlatformHealth(signals);
  const { overall, ...dimensions } = dims;

  const kpis = computePlatformKPIs(signals);
  const risks = detectRisks(signals, overall);
  const decisions = generateDecisions(signals, risks);

  const status: ExecutiveSnapshot['healthStatus'] =
    overall >= 75 ? 'healthy' : overall >= 45 ? 'warning' : 'critical';

  return {
    healthScore: overall,
    healthStatus: status,
    kpis,
    risks,
    decisions,
    dimensions,
    generatedAt: Date.now(),
  };
}
