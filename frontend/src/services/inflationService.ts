/**
 * Inflation Service
 * Calculates real inflation from observatoire JSON snapshots
 */

import type {
  InflationMetrics,
  TerritoryInflation,
  CategoryInflation,
  PurchasingPowerIndex,
} from '../types/inflation';
import {
  loadObservatoireData,
  calculatePriceChange,
  calculateStatistics,
  type ObservatoireSnapshot,
} from './observatoireDataLoader';

const TERRITORY_MAP: Array<{ code: string; name: string; key: string }> = [
  { code: 'GP', name: 'Guadeloupe', key: 'guadeloupe' },
  { code: 'MQ', name: 'Martinique', key: 'martinique' },
  { code: 'GF', name: 'Guyane', key: 'guyane' },
  { code: 'RE', name: 'La Réunion', key: 'la_réunion' },
  { code: 'YT', name: 'Mayotte', key: 'mayotte' },
  { code: 'MF', name: 'Saint-Martin', key: 'saint_martin' },
  { code: 'BL', name: 'Saint-Barthélemy', key: 'saint_barthelemy' },
  { code: 'PM', name: 'Saint-Pierre-et-Miquelon', key: 'saint_pierre_et_miquelon' },
];

// Metropole reference key used to compute gap
const METROPOLE_KEY = 'hexagone';

/**
 * Compute overall inflation rate from two snapshots.
 * Returns the mean price change across all matched products.
 */
function computeOverallRate(snapshots: ObservatoireSnapshot[]): number {
  if (snapshots.length < 2) return 0;
  const [older, newer] = snapshots;
  const changes = calculatePriceChange(older, newer);
  if (changes.size === 0) return 0;
  const values = Array.from(changes.values());
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

/**
 * Compute per-category inflation from two snapshots.
 */
function computeCategories(snapshots: ObservatoireSnapshot[]): CategoryInflation[] {
  if (snapshots.length === 0) return [];
  const latestSnapshot = snapshots[snapshots.length - 1];
  const categoryMap = new Map<string, { current: number[]; previous: number[] }>();

  // Collect prices by category from latest snapshot
  latestSnapshot.donnees.forEach((obs) => {
    if (!categoryMap.has(obs.categorie)) {
      categoryMap.set(obs.categorie, { current: [], previous: [] });
    }
    categoryMap.get(obs.categorie)!.current.push(obs.prix);
  });

  // If we have two snapshots, collect previous prices
  if (snapshots.length >= 2) {
    snapshots[0].donnees.forEach((obs) => {
      if (categoryMap.has(obs.categorie)) {
        categoryMap.get(obs.categorie)!.previous.push(obs.prix);
      }
    });
  }

  const result: CategoryInflation[] = [];
  categoryMap.forEach((data, category) => {
    const currentAverage =
      data.current.length > 0
        ? Math.round((data.current.reduce((a, b) => a + b, 0) / data.current.length) * 100) / 100
        : 0;
    const previousAverage =
      data.previous.length > 0
        ? Math.round((data.previous.reduce((a, b) => a + b, 0) / data.previous.length) * 100) / 100
        : currentAverage;
    const inflationRate =
      previousAverage > 0
        ? Math.round(((currentAverage - previousAverage) / previousAverage) * 1000) / 10
        : 0;
    result.push({
      category,
      currentAverage,
      previousAverage,
      inflationRate,
      priceChange: Math.round((currentAverage - previousAverage) * 100) / 100,
      products: [],
    });
  });

  return result;
}

/**
 * Compute metropole vs territory price gap for a given product category.
 */
function computeMetropoleGap(
  territoryStats: ReturnType<typeof calculateStatistics>,
  metropoleStats: ReturnType<typeof calculateStatistics>,
): number {
  if (territoryStats.length === 0 || metropoleStats.length === 0) return 0;
  const territoryAvg =
    territoryStats.reduce((s, p) => s + p.avgPrice, 0) / territoryStats.length;
  const metropoleAvg =
    metropoleStats.reduce((s, p) => s + p.avgPrice, 0) / metropoleStats.length;
  if (metropoleAvg === 0) return 0;
  return Math.round(((territoryAvg - metropoleAvg) / metropoleAvg) * 1000) / 10;
}

export class InflationService {
  /**
   * Calculate inflation metrics for a timeframe using real observatoire snapshots.
   */
  async calculateInflation(timeframe: '1m' | '3m' | '6m' | '1y'): Promise<InflationMetrics> {
    const now = new Date();
    const monthsAgo = timeframe === '1m' ? 1 : timeframe === '3m' ? 3 : timeframe === '6m' ? 6 : 12;
    const comparisonDate = new Date(now);
    comparisonDate.setMonth(comparisonDate.getMonth() - monthsAgo);

    // Build the two month keys to compare (current vs N months ago)
    const toMonthKey = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const currentMonthKey = toMonthKey(now);
    const comparisonMonthKey = toMonthKey(comparisonDate);

    const territories = await this.getTerritoryInflations(currentMonthKey, comparisonMonthKey);

    return {
      territories,
      timeframe,
      referenceDate: comparisonDate.toISOString(),
      comparisonDate: now.toISOString(),
    };
  }

  /**
   * Get category-specific inflation for a territory.
   */
  async getCategoryInflation(category: string, territory: string): Promise<CategoryInflation> {
    const t = TERRITORY_MAP.find(
      (t) => t.code.toLowerCase() === territory.toLowerCase() || t.name.toLowerCase() === territory.toLowerCase(),
    );
    const snapshots = await loadObservatoireData(t?.name ?? territory);
    const allCategories = computeCategories(snapshots);
    const found = allCategories.find((c) => c.category.toLowerCase().includes(category.toLowerCase()));
    if (found) return found;
    // Fallback: compute from all data
    const stats = calculateStatistics(snapshots);
    const relevant = stats.filter((s) => s.category.toLowerCase().includes(category.toLowerCase()));
    const avg = relevant.length > 0 ? relevant.reduce((s, p) => s + p.avgPrice, 0) / relevant.length : 0;
    return { category, currentAverage: avg, previousAverage: avg, inflationRate: 0, priceChange: 0, products: [] };
  }

  /**
   * Compare inflation across all territories.
   */
  async compareTerritories(): Promise<TerritoryInflation[]> {
    return this.getTerritoryInflations();
  }

  /**
   * Calculate purchasing power index based on observatoire data.
   */
  async calculatePurchasingPower(territory: string): Promise<PurchasingPowerIndex> {
    const t = TERRITORY_MAP.find(
      (t) => t.code.toLowerCase() === territory.toLowerCase() || t.name.toLowerCase() === territory.toLowerCase(),
    );
    const snapshots = await loadObservatoireData(t?.name ?? territory);
    const metropoleSnapshots = await loadObservatoireData('Hexagone');

    const categories = computeCategories(snapshots);
    const metropoleStats = calculateStatistics(metropoleSnapshots);

    const affordabilityByCategory = categories.map((cat) => {
      const metropoleCat = metropoleStats.filter((s) =>
        s.category.toLowerCase().includes(cat.category.toLowerCase()),
      );
      const metropoleAvg =
        metropoleCat.length > 0 ? metropoleCat.reduce((s, p) => s + p.avgPrice, 0) / metropoleCat.length : cat.currentAverage;
      const affordability =
        metropoleAvg > 0 ? Math.round((metropoleAvg / Math.max(cat.currentAverage, 0.01)) * 100) : 100;
      return { category: cat.category, affordability: Math.min(affordability, 100) };
    });

    const avgAffordability =
      affordabilityByCategory.length > 0
        ? affordabilityByCategory.reduce((s, c) => s + c.affordability, 0) / affordabilityByCategory.length
        : 95;

    return {
      territory,
      index: Math.round(avgAffordability),
      change: Math.round(avgAffordability - 100),
      categories: affordabilityByCategory,
    };
  }

  /**
   * Get products with biggest price increases from observatoire data.
   */
  async getTopPriceIncreases(limit = 10): Promise<Array<{ product: string; change: number; category: string }>> {
    const results: Array<{ product: string; change: number; category: string }> = [];
    for (const t of TERRITORY_MAP) {
      const snapshots = await loadObservatoireData(t.name);
      if (snapshots.length >= 2) {
        const changes = calculatePriceChange(snapshots[0], snapshots[1]);
        const stats = calculateStatistics([snapshots[1]]);
        changes.forEach((change, key) => {
          if (change > 0) {
            const stat = stats.find((s) => (s.ean ?? s.productName) === key);
            results.push({ product: stat?.productName ?? key, change, category: stat?.category ?? '' });
          }
        });
      }
    }
    return results.sort((a, b) => b.change - a.change).slice(0, limit);
  }

  /**
   * Get products with biggest price decreases from observatoire data.
   */
  async getTopPriceDecreases(limit = 10): Promise<Array<{ product: string; change: number; category: string }>> {
    const results: Array<{ product: string; change: number; category: string }> = [];
    for (const t of TERRITORY_MAP) {
      const snapshots = await loadObservatoireData(t.name);
      if (snapshots.length >= 2) {
        const changes = calculatePriceChange(snapshots[0], snapshots[1]);
        const stats = calculateStatistics([snapshots[1]]);
        changes.forEach((change, key) => {
          if (change < 0) {
            const stat = stats.find((s) => (s.ean ?? s.productName) === key);
            results.push({ product: stat?.productName ?? key, change, category: stat?.category ?? '' });
          }
        });
      }
    }
    return results.sort((a, b) => a.change - b.change).slice(0, limit);
  }

  /**
   * Export inflation report as JSON (CSV/PDF require dedicated libraries).
   */
  async exportInflationReport(_format: 'pdf' | 'excel'): Promise<Blob> {
    const data = await this.calculateInflation('3m');
    const content = JSON.stringify(data, null, 2);
    return new Blob([content], { type: 'application/json' });
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async getTerritoryInflations(
    currentMonthKey?: string,
    comparisonMonthKey?: string,
  ): Promise<TerritoryInflation[]> {
    // Load specific months when provided (period-aware) or fall back to defaults
    const months: string[] | undefined =
      currentMonthKey && comparisonMonthKey
        ? [comparisonMonthKey, currentMonthKey]  // older first so sort works correctly
        : undefined;

    const metropoleSnapshots = await loadObservatoireData('Hexagone', months);
    const metropoleStats = calculateStatistics(metropoleSnapshots);

    const results: TerritoryInflation[] = [];

    for (const t of TERRITORY_MAP) {
      try {
        const snapshots = await loadObservatoireData(t.name, months);
        const overallInflationRate = computeOverallRate(snapshots);
        const categories = computeCategories(snapshots);
        const territoryStats = calculateStatistics(snapshots);
        const comparedToMetropole = computeMetropoleGap(territoryStats, metropoleStats);
        const lastUpdated =
          snapshots.length > 0 ? snapshots[snapshots.length - 1].date_snapshot : new Date().toISOString();

        results.push({
          territory: t.code,
          territoryName: t.name,
          overallInflationRate,
          categories,
          comparedToMetropole,
          lastUpdated,
        });
      } catch {
        // Skip territory on error
      }
    }

    return results;
  }
}

export const inflationService = new InflationService();
