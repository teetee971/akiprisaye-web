/**
 * Water Consumption Service
 * Calculateur de consommation et économies d'eau
 * 
 * Estime la consommation d'eau et propose des économies
 */

import type {
  WaterConsumptionProfile,
  WaterConsumptionEstimate,
  Territory,
} from '../types/waterComparison';
import { getWaterPricing, calculateAnnualCost } from './waterPricingServiceExtended';

/**
 * Average water consumption values (liters per usage)
 */
const CONSUMPTION_VALUES = {
  SHOWER: 60, // liters per shower
  BATH: 150, // liters per bath
  TOILET_FLUSH: 9, // liters per flush (average)
  DISHWASHER: 15, // liters per cycle
  WASHING_MACHINE: 50, // liters per cycle
  COOKING_DRINKING: 10, // liters per person per day
  GARDEN_SMALL: 50, // liters per watering session
  POOL_EVAPORATION: 10, // liters per day (small pool)
};

/**
 * Estimate daily water consumption
 */
function estimateDailyConsumption(profile: WaterConsumptionProfile): number {
  let dailyLiters = 0;

  // Personal hygiene
  dailyLiters += (profile.showers / 7) * CONSUMPTION_VALUES.SHOWER;
  dailyLiters += (profile.baths / 7) * CONSUMPTION_VALUES.BATH;

  // Toilet (estimate 5 flushes per person per day)
  dailyLiters += profile.householdSize * 5 * CONSUMPTION_VALUES.TOILET_FLUSH;

  // Cooking and drinking
  dailyLiters += profile.householdSize * CONSUMPTION_VALUES.COOKING_DRINKING;

  // Dishwasher (estimate 1 cycle per day if present)
  if (profile.dishwasher) {
    dailyLiters += CONSUMPTION_VALUES.DISHWASHER;
  }

  // Washing machine (estimate 3 cycles per week)
  if (profile.washingMachine) {
    dailyLiters += (3 / 7) * CONSUMPTION_VALUES.WASHING_MACHINE;
  }

  // Garden (estimate 3 waterings per week in season)
  if (profile.garden) {
    dailyLiters += (3 / 7) * CONSUMPTION_VALUES.GARDEN_SMALL;
  }

  // Pool evaporation
  if (profile.pool) {
    dailyLiters += CONSUMPTION_VALUES.POOL_EVAPORATION;
  }

  return dailyLiters;
}

/**
 * Calculate water savings recommendations
 */
function calculateSavings(
  profile: WaterConsumptionProfile,
  pricePerM3: number
): Array<{
  action: string;
  savingsM3: number;
  savingsEuros: number;
  difficulty: 'easy' | 'medium' | 'hard';
}> {
  const savings: Array<{
    action: string;
    savingsM3: number;
    savingsEuros: number;
    difficulty: 'easy' | 'medium' | 'hard';
  }> = [];

  // Shower efficiency
  if (profile.showers > 0) {
    const annualShowers = (profile.showers * 365) / 7;
    const currentUsage = annualShowers * CONSUMPTION_VALUES.SHOWER;
    const savingsM3 = ((currentUsage * 0.3) / 1000); // 30% reduction with low-flow showerhead

    savings.push({
      action: 'Installer un pommeau de douche économique',
      savingsM3: Math.round(savingsM3 * 100) / 100,
      savingsEuros: Math.round(savingsM3 * pricePerM3 * 100) / 100,
      difficulty: 'easy',
    });
  }

  // Reduce shower duration
  if (profile.showers > 7) {
    const annualShowers = (profile.showers * 365) / 7;
    const savingsM3 = ((annualShowers * 20) / 1000); // Save 20L per shower by reducing duration

    savings.push({
      action: 'Réduire la durée des douches de 2 minutes',
      savingsM3: Math.round(savingsM3 * 100) / 100,
      savingsEuros: Math.round(savingsM3 * pricePerM3 * 100) / 100,
      difficulty: 'easy',
    });
  }

  // Toilet efficiency
  const toiletFlushes = profile.householdSize * 5 * 365;
  const toiletSavingsM3 = ((toiletFlushes * 3) / 1000); // Save 3L per flush with dual flush

  savings.push({
    action: 'Installer une chasse d\'eau double commande',
    savingsM3: Math.round(toiletSavingsM3 * 100) / 100,
    savingsEuros: Math.round(toiletSavingsM3 * pricePerM3 * 100) / 100,
    difficulty: 'medium',
  });

  // Washing machine efficiency
  if (profile.washingMachine) {
    const annualCycles = (3 * 365) / 7;
    const savingsM3 = ((annualCycles * 15) / 1000); // Save 15L per cycle with efficient machine

    savings.push({
      action: 'Utiliser un lave-linge économe en eau (classe A+++)',
      savingsM3: Math.round(savingsM3 * 100) / 100,
      savingsEuros: Math.round(savingsM3 * pricePerM3 * 100) / 100,
      difficulty: 'hard',
    });
  }

  // Dishwasher efficiency
  if (profile.dishwasher) {
    const annualCycles = 365;
    const savingsM3 = ((annualCycles * 5) / 1000); // Save 5L per cycle

    savings.push({
      action: 'Remplacer par un lave-vaisselle économe',
      savingsM3: Math.round(savingsM3 * 100) / 100,
      savingsEuros: Math.round(savingsM3 * pricePerM3 * 100) / 100,
      difficulty: 'hard',
    });
  }

  // Garden efficiency
  if (profile.garden) {
    const annualWaterings = (3 * 365) / 7;
    const savingsM3 = ((annualWaterings * 30) / 1000); // Save 30L per watering with drip irrigation

    savings.push({
      action: 'Installer un système d\'arrosage goutte-à-goutte',
      savingsM3: Math.round(savingsM3 * 100) / 100,
      savingsEuros: Math.round(savingsM3 * pricePerM3 * 100) / 100,
      difficulty: 'medium',
    });

    savings.push({
      action: 'Récupérer l\'eau de pluie pour le jardin',
      savingsM3: Math.round((annualWaterings * 40) / 1000 * 100) / 100,
      savingsEuros: Math.round(((annualWaterings * 40) / 1000) * pricePerM3 * 100) / 100,
      difficulty: 'medium',
    });
  }

  // General leak fixing
  savings.push({
    action: 'Réparer les fuites (robinets, WC)',
    savingsM3: 20, // Estimate 20m³/year from typical household leaks
    savingsEuros: Math.round(20 * pricePerM3 * 100) / 100,
    difficulty: 'easy',
  });

  return savings;
}

/**
 * Estimate water consumption for a household
 */
export async function estimateConsumption(
  profile: WaterConsumptionProfile,
  territory: Territory
): Promise<WaterConsumptionEstimate> {
  // Get pricing for territory
  const pricings = await getWaterPricing(territory);
  const averagePricing =
    pricings.length > 0 ? pricings[0] : null;

  // Calculate consumption
  const dailyLiters = estimateDailyConsumption(profile);
  const dailyM3 = dailyLiters / 1000;
  const monthlyM3 = dailyM3 * 30;
  const annualM3 = dailyM3 * 365;

  // Calculate cost
  const pricePerM3 = averagePricing
    ? averagePricing.pricing.pricePerM3 +
      (averagePricing.pricing.sanitationPerM3 || 0)
    : 5.0; // Default price

  const annualCost = averagePricing
    ? calculateAnnualCost(averagePricing, annualM3)
    : annualM3 * pricePerM3;

  // Calculate savings
  const savings = calculateSavings(profile, pricePerM3);

  return {
    profile,
    territory,
    estimation: {
      dailyM3: Math.round(dailyM3 * 100) / 100,
      monthlyM3: Math.round(monthlyM3 * 100) / 100,
      annualM3: Math.round(annualM3 * 100) / 100,
      annualCost: Math.round(annualCost * 100) / 100,
    },
    savings,
  };
}

/**
 * Calculate total potential savings
 */
export function calculateTotalSavings(
  estimate: WaterConsumptionEstimate
): {
  totalM3: number;
  totalEuros: number;
  percentageReduction: number;
} {
  const totalM3 = estimate.savings.reduce(
    (sum, saving) => sum + saving.savingsM3,
    0
  );
  const totalEuros = estimate.savings.reduce(
    (sum, saving) => sum + saving.savingsEuros,
    0
  );
  const percentageReduction =
    estimate.estimation.annualM3 > 0
      ? (totalM3 / estimate.estimation.annualM3) * 100
      : 0;

  return {
    totalM3: Math.round(totalM3 * 100) / 100,
    totalEuros: Math.round(totalEuros * 100) / 100,
    percentageReduction: Math.round(percentageReduction * 100) / 100,
  };
}

/**
 * Get easy wins (easy difficulty savings)
 */
export function getEasyWins(
  estimate: WaterConsumptionEstimate
): typeof estimate.savings {
  return estimate.savings.filter((s) => s.difficulty === 'easy');
}
