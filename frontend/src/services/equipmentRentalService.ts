/**
 * Equipment Rental Comparison Service v1.0.0
 *
 * - Lecture seule des données
 * - Comparaison multi-loueurs par territoire et catégorie
 * - "Observer, pas vendre" : transparence sur les écarts
 */

import type {
  EquipmentRentalComparisonResult,
  EquipmentRentalPricePoint,
  EquipmentRentalRanking,
  EquipmentRentalAggregation,
  EquipmentRentalMetadata,
  EquipmentRentalFilter,
  EquipmentCategory,
} from '../types/equipmentRental';
import type { Territory } from '../types/priceAlerts';

/**
 * Compare les prix de location de matériaux pour un territoire et une catégorie donnés
 */
export function compareEquipmentRentals(
  territory: Territory,
  category: EquipmentCategory,
  prices: EquipmentRentalPricePoint[]
): EquipmentRentalComparisonResult | null {
  if (!prices || prices.length === 0) return null;

  const filtered = prices.filter((p) => p.territory === territory && p.category === category);
  if (filtered.length === 0) return null;

  const aggregation = calculateAggregation(filtered, territory, category);
  const ranked = rankAgencies(filtered, aggregation.pricing.averageDailyRate);
  const metadata = buildMetadata(filtered);

  return {
    territory,
    category,
    agencies: ranked,
    aggregation,
    comparisonDate: new Date().toISOString(),
    metadata,
  };
}

/** Filtre les prix selon les critères fournis */
export function filterEquipmentRentals(
  prices: EquipmentRentalPricePoint[],
  filter: EquipmentRentalFilter
): EquipmentRentalPricePoint[] {
  let result = [...prices];
  if (filter.territory) result = result.filter((p) => p.territory === filter.territory);
  if (filter.category) result = result.filter((p) => p.category === filter.category);
  if (filter.maxDailyRate != null)
    result = result.filter((p) => p.pricing.dailyRate <= filter.maxDailyRate!);
  if (filter.deliveryRequired) result = result.filter((p) => p.conditions.deliveryAvailable);
  if (filter.localAgencyOnly) result = result.filter((p) => p.isLocalAgency);
  if (filter.verifiedOnly) result = result.filter((p) => p.verified);
  return result;
}

// ─── Internal helpers ────────────────────────────────────────────────────────

function calculateAggregation(
  prices: EquipmentRentalPricePoint[],
  territory: Territory,
  category: EquipmentCategory
): EquipmentRentalAggregation {
  const rates = prices.map((p) => p.pricing.dailyRate).sort((a, b) => a - b);
  const min = rates[0];
  const max = rates[rates.length - 1];
  const average = rates.reduce((s, r) => s + r, 0) / rates.length;
  const median = rates[Math.floor(rates.length / 2)];
  const range = max - min;
  const rangePercentage = max > 0 ? (range / max) * 100 : 0;

  const dates = prices.map((p) => p.observationDate).sort();

  return {
    territory,
    category,
    agencyCount: prices.length,
    pricing: {
      averageDailyRate: Math.round(average * 100) / 100,
      minDailyRate: min,
      maxDailyRate: max,
      priceRange: Math.round(range * 100) / 100,
      priceRangePercentage: Math.round(rangePercentage * 10) / 10,
      medianDailyRate: Math.round(median * 100) / 100,
    },
    observationPeriod: {
      from: dates[0],
      to: dates[dates.length - 1],
    },
    totalObservations: prices.length,
    lastUpdate: new Date().toISOString(),
    localAgencyCount: prices.filter((p) => p.isLocalAgency).length,
    nationalAgencyCount: prices.filter((p) => !p.isLocalAgency).length,
  };
}

function rankAgencies(
  prices: EquipmentRentalPricePoint[],
  average: number
): EquipmentRentalRanking[] {
  const sorted = [...prices].sort((a, b) => a.pricing.dailyRate - b.pricing.dailyRate);
  const cheapest = sorted[0]?.pricing.dailyRate ?? 0;

  return sorted.map((price, idx) => {
    const absDiffCheapest = price.pricing.dailyRate - cheapest;
    const pctDiffCheapest = cheapest > 0 ? (absDiffCheapest / cheapest) * 100 : 0;
    const absDiffAverage = price.pricing.dailyRate - average;
    const pctDiffAverage = average > 0 ? (absDiffAverage / average) * 100 : 0;

    let priceCategory: EquipmentRentalRanking['priceCategory'];
    if (idx === 0) {
      priceCategory = 'cheapest';
    } else if (pctDiffCheapest < 10) {
      priceCategory = 'below_average';
    } else if (Math.abs(pctDiffAverage) <= 10) {
      priceCategory = 'average';
    } else if (idx === sorted.length - 1) {
      priceCategory = 'most_expensive';
    } else {
      priceCategory = 'above_average';
    }

    return {
      rank: idx + 1,
      rentalPrice: price,
      absoluteDifferenceFromCheapest: Math.round(absDiffCheapest * 100) / 100,
      percentageDifferenceFromCheapest: Math.round(pctDiffCheapest * 10) / 10,
      absoluteDifferenceFromAverage: Math.round(absDiffAverage * 100) / 100,
      percentageDifferenceFromAverage: Math.round(pctDiffAverage * 10) / 10,
      priceCategory,
    };
  });
}

function buildMetadata(prices: EquipmentRentalPricePoint[]): EquipmentRentalMetadata {
  const dates = prices.map((p) => p.observationDate).sort();
  return {
    methodology: 'v1.0.0',
    aggregationMethod: 'mean',
    dataQuality: {
      totalAgencies: prices.length,
      agenciesWithData: prices.length,
      coveragePercentage: 100,
      oldestObservation: dates[0],
      newestObservation: dates[dates.length - 1],
    },
    limitations: [
      'Prix indicatifs — peuvent varier selon la saison et la disponibilité du matériel',
      'Vérifiez les tarifs directement auprès du loueur',
      "Des frais de livraison, de carburant ou de caution peuvent s'ajouter",
    ],
    disclaimer:
      'Observer, pas vendre : Ces données sont fournies à titre informatif et citoyen. ' +
      "Aucun lien d'affiliation. Contactez directement les loueurs pour confirmer les tarifs.",
  };
}

/** Catégories avec leur libellé et emoji français */
export const EQUIPMENT_CATEGORY_LABELS: Record<
  EquipmentCategory,
  { label: string; emoji: string }
> = {
  btp: { label: 'BTP & Construction', emoji: '🏗️' },
  outillage: { label: 'Outillage électroportatif', emoji: '🔧' },
  levage: { label: 'Levage & Manutention', emoji: '🏋️' },
  terrassement: { label: 'Terrassement & Travaux', emoji: '🚜' },
  evenementiel: { label: 'Événementiel', emoji: '🎪' },
  jardinage: { label: 'Jardinage & Espaces verts', emoji: '🌿' },
  nettoyage: { label: 'Nettoyage & Entretien', emoji: '🧹' },
  demenagement: { label: 'Déménagement & Transport', emoji: '📦' },
  agriculture: { label: 'Agriculture', emoji: '🌱' },
};
