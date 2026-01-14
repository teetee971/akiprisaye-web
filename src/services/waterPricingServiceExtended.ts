/**
 * Water Pricing Service Extended
 * Extension du service de comparaison des prix de l'eau
 * 
 * Fournit des fonctions avancées pour la comparaison et l'analyse des prix
 */

import type {
  WaterPricing,
  Territory,
  WaterAvailabilityDatabase,
} from '../types/waterComparison';

/**
 * Load water availability database
 */
async function loadDatabase(): Promise<WaterAvailabilityDatabase> {
  try {
    const response = await fetch('/data/water-availability.json');
    if (!response.ok) {
      throw new Error('Failed to load water availability data');
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading water availability database:', error);
    return {
      metadata: {
        generated_at: new Date().toISOString(),
        source: 'A KI PRI SA YÉ',
        note: 'Error loading data',
      },
      providers: [],
      current_status: [],
      cut_history: [],
      pricing: [],
      quality: [],
      leaks: [],
    };
  }
}

/**
 * Get water pricing for a territory
 */
export async function getWaterPricing(
  territory: Territory,
  commune?: string
): Promise<WaterPricing[]> {
  const db = await loadDatabase();

  let pricing = db.pricing.filter((p) => p.territory === territory);

  if (commune) {
    pricing = pricing.filter(
      (p) => p.commune?.toLowerCase() === commune.toLowerCase()
    );
  }

  return pricing;
}

/**
 * Calculate annual cost for water consumption
 */
export function calculateAnnualCost(
  pricing: WaterPricing,
  consumptionM3: number
): number {
  const { pricePerM3, sanitationPerM3 = 0, subscriptionAnnual } = pricing.pricing;

  const waterCost = consumptionM3 * pricePerM3;
  const sanitationCost = consumptionM3 * sanitationPerM3;
  const totalCost = subscriptionAnnual + waterCost + sanitationCost;

  return Math.round(totalCost * 100) / 100;
}

/**
 * Compare water pricing across providers
 */
export function comparePricing(pricings: WaterPricing[]): {
  cheapest: WaterPricing | null;
  mostExpensive: WaterPricing | null;
  average: number;
  median: number;
} {
  if (pricings.length === 0) {
    return {
      cheapest: null,
      mostExpensive: null,
      average: 0,
      median: 0,
    };
  }

  // Use a standard consumption of 120m³/year for comparison
  const standardConsumption = 120;

  const costs = pricings.map((p) => ({
    pricing: p,
    cost: calculateAnnualCost(p, standardConsumption),
  }));

  costs.sort((a, b) => a.cost - b.cost);

  const average =
    costs.reduce((sum, c) => sum + c.cost, 0) / costs.length;

  const median =
    costs.length % 2 === 0
      ? (costs[costs.length / 2 - 1].cost + costs[costs.length / 2].cost) / 2
      : costs[Math.floor(costs.length / 2)].cost;

  return {
    cheapest: costs[0]?.pricing || null,
    mostExpensive: costs[costs.length - 1]?.pricing || null,
    average: Math.round(average * 100) / 100,
    median: Math.round(median * 100) / 100,
  };
}

/**
 * Get price evolution (mock data for now - would need historical database)
 */
export async function getPriceEvolution(
  provider: string,
  territory: Territory,
  years: number = 3
): Promise<Array<{ year: number; pricePerM3: number }>> {
  // In a real implementation, this would query historical data
  // For now, return mock evolution data
  const currentYear = new Date().getFullYear();
  const db = await loadDatabase();

  const currentPricing = db.pricing.find(
    (p) => p.provider === provider && p.territory === territory
  );

  if (!currentPricing) {
    return [];
  }

  const currentPrice = currentPricing.pricing.pricePerM3;

  // Generate mock historical data with slight variations
  const evolution: Array<{ year: number; pricePerM3: number }> = [];

  for (let i = years - 1; i >= 0; i--) {
    const year = currentYear - i;
    // Simulate gradual price increase (2-5% per year)
    const yearlyIncrease = 1 + (Math.random() * 0.03 + 0.02);
    const price = currentPrice / Math.pow(yearlyIncrease, i);

    evolution.push({
      year,
      pricePerM3: Math.round(price * 100) / 100,
    });
  }

  return evolution;
}

/**
 * Compare territory pricing to reference territory (Guadeloupe)
 * Note: Using Guadeloupe as reference since this tool is DOM-TOM focused
 */
export async function compareTerritoryToReference(
  territory: Territory,
  consumptionM3: number = 120
): Promise<{
  territoryAverage: number;
  referenceAverage: number;
  difference: number;
  percentageDifference: number;
}> {
  const db = await loadDatabase();

  const territoryPricing = db.pricing.filter((p) => p.territory === territory);
  const referencePricing = db.pricing.filter((p) => p.territory === 'GP'); // Using GP as DOM reference

  if (territoryPricing.length === 0 || referencePricing.length === 0) {
    return {
      territoryAverage: 0,
      referenceAverage: 0,
      difference: 0,
      percentageDifference: 0,
    };
  }

  const territoryCosts = territoryPricing.map((p) =>
    calculateAnnualCost(p, consumptionM3)
  );
  const referenceCosts = referencePricing.map((p) =>
    calculateAnnualCost(p, consumptionM3)
  );

  const territoryAverage =
    territoryCosts.reduce((sum, cost) => sum + cost, 0) /
    territoryCosts.length;
  const referenceAverage =
    referenceCosts.reduce((sum, cost) => sum + cost, 0) / referenceCosts.length;

  const difference = territoryAverage - referenceAverage;
  const percentageDifference =
    referenceAverage > 0 ? (difference / referenceAverage) * 100 : 0;

  return {
    territoryAverage: Math.round(territoryAverage * 100) / 100,
    referenceAverage: Math.round(referenceAverage * 100) / 100,
    difference: Math.round(difference * 100) / 100,
    percentageDifference: Math.round(percentageDifference * 100) / 100,
  };
}

/**
 * Get all available territories with pricing data
 */
export async function getAvailableTerritories(): Promise<Territory[]> {
  const db = await loadDatabase();
  const territories = new Set<Territory>();

  db.pricing.forEach((p) => territories.add(p.territory));

  return Array.from(territories).sort();
}
