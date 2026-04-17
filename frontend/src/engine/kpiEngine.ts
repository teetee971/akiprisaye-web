/**
 * kpiEngine.ts — Platform KPI computation (V8)
 *
 * Computes a deterministic list of business KPIs from platform signals.
 * Each KPI has: id, name, value, unit, trend, impact.
 */

import type { PlatformSignals } from './executiveOS';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PlatformKPI {
  id: string;
  name: string;
  value: number | string;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  impact: 'high' | 'medium' | 'low' | 'info';
}

// ── Core computation ──────────────────────────────────────────────────────────

/**
 * Compute all platform KPIs from raw signals.
 *
 * @param signals  PlatformSignals aggregated from all V1–V7 outputs
 */
export function computePlatformKPIs(signals: PlatformSignals): PlatformKPI[] {
  const ctr =
    signals.affiliateClicks30d > 0 && signals.totalProducts > 0
      ? parseFloat(((signals.affiliateClicks30d / (signals.totalProducts * 10)) * 100).toFixed(1))
      : 0;

  return [
    {
      id: 'total-products',
      name: 'Produits suivis',
      value: signals.totalProducts,
      unit: 'produits',
      trend: 'stable',
      impact: 'info',
    },
    {
      id: 'cash-max-products',
      name: 'Produits cash-max',
      value: signals.cashMaxProducts,
      unit: 'produits',
      trend: 'up',
      impact: 'high',
    },
    {
      id: 'indexed-pages',
      name: 'Pages indexées',
      value: signals.indexedPages,
      unit: 'pages',
      trend: 'up',
      impact: 'high',
    },
    {
      id: 'affiliate-clicks',
      name: 'Clics affiliés (30j)',
      value: signals.affiliateClicks30d,
      unit: 'clics',
      trend: 'up',
      impact: 'high',
    },
    {
      id: 'conversions-30d',
      name: 'Conversions (30j)',
      value: signals.conversions30d,
      unit: 'conversions',
      trend: 'up',
      impact: 'high',
    },
    {
      id: 'landing-ctr',
      name: 'CTR affilié',
      value: ctr,
      unit: '%',
      trend: ctr >= 0.1 ? 'up' : 'down',
      impact: ctr >= 0.1 ? 'high' : 'medium',
    },
    {
      id: 'repeat-users',
      name: 'Utilisateurs récurrents',
      value: signals.repeatUsers,
      unit: 'utilisateurs',
      trend: 'up',
      impact: 'medium',
    },
    {
      id: 'total-retailers',
      name: 'Enseignes couvertes',
      value: signals.totalRetailers,
      unit: 'enseignes',
      trend: 'stable',
      impact: 'info',
    },
    {
      id: 'monthly-rev',
      name: 'Revenu affilié estimé',
      value: parseFloat(signals.estimatedMonthlyRev.toFixed(2)),
      unit: '€/mois',
      trend: 'up',
      impact: 'high',
    },
    {
      id: 'scrape-status',
      name: 'Dernier scraping',
      value: signals.lastScrapeOk ? 'OK' : 'ERREUR',
      unit: '',
      trend: signals.lastScrapeOk ? 'stable' : 'down',
      impact: signals.lastScrapeOk ? 'info' : 'high',
    },
  ];
}
