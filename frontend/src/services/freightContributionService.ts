/**
 * Freight Contribution Service v1.0.0
 *
 * Gestion des contributions citoyennes pour le fret maritime & colis
 */

import type {
  FreightContribution,
  CarrierStatistics,
  RouteStatistics,
  ReliabilityScore,
  FreightRoute,
} from '../types/freightComparison';
import type { Territory } from '../types/priceAlerts';
import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Soumet une contribution citoyenne
 */
export async function submitContribution(
  contribution: Omit<FreightContribution, 'id' | 'createdAt' | 'verified'>
): Promise<FreightContribution> {
  // Calculer le délai réel si dates disponibles
  let actualDays: number | undefined;
  if (contribution.sendDate && contribution.receivedDate) {
    const sendTime = new Date(contribution.sendDate).getTime();
    const receivedTime = new Date(contribution.receivedDate).getTime();
    actualDays = Math.ceil((receivedTime - sendTime) / (1000 * 60 * 60 * 24));
  }

  // Vérifier si la contribution a une facture
  const verified = !!contribution.invoice;

  const fullContribution: FreightContribution = {
    ...contribution,
    id: `contrib-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    actualDays,
    verified,
    createdAt: new Date().toISOString(),
  };

  // Enregistrer dans Firestore
  if (db) {
    try {
      await setDoc(doc(db, 'freight_contributions', fullContribution.id), fullContribution);
    } catch (error) {
      console.error('Failed to save contribution to Firestore:', error);
    }
  }

  return fullContribution;
}

/**
 * Récupère les contributions pour un transporteur
 */
export async function getContributionsByCarrier(
  carrierCode: string
): Promise<FreightContribution[]> {
  try {
    if (!db) return [];
    const snapshot = await getDocs(
      query(collection(db, 'freight_contributions'), where('carrier', '==', carrierCode))
    );
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<FreightContribution, 'id'>),
    }));
  } catch (error) {
    console.error('Error loading contributions by carrier:', error);
    return [];
  }
}

/**
 * Récupère les contributions pour une route
 */
export async function getContributionsByRoute(
  origin: string,
  destination: string
): Promise<FreightContribution[]> {
  try {
    if (!db) return [];
    const snapshot = await getDocs(
      query(
        collection(db, 'freight_contributions'),
        where('route.origin', '==', origin),
        where('route.destination', '==', destination)
      )
    );
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<FreightContribution, 'id'>),
    }));
  } catch (error) {
    console.error('Error loading contributions by route:', error);
    return [];
  }
}

/**
 * Calcule le score de fiabilité basé sur les contributions
 */
export function calculateReliabilityScore(contributions: FreightContribution[]): ReliabilityScore {
  if (contributions.length === 0) {
    return {
      score: 0,
      basedOnContributions: 0,
      onTimeRate: 0,
      issuesReported: 0,
    };
  }

  // Compter les livraisons à l'heure (status = received)
  const onTimeCount = contributions.filter(
    (c) => c.status === 'received' && c.actualDays !== undefined
  ).length;

  const onTimeRate = onTimeCount / contributions.length;

  // Compter les incidents
  const issuesReported = contributions.filter(
    (c) => c.status === 'lost' || c.status === 'damaged'
  ).length;

  // Calculer le score moyen de satisfaction (1-5)
  const averageRating = contributions.reduce((sum, c) => sum + c.rating, 0) / contributions.length;

  // Score final (0-5)
  const score = averageRating;

  return {
    score,
    basedOnContributions: contributions.length,
    onTimeRate,
    issuesReported,
  };
}

/**
 * Calcule les statistiques pour un transporteur
 */
export async function calculateCarrierStatistics(
  carrierCode: string
): Promise<CarrierStatistics | null> {
  try {
    const contributions = await getContributionsByCarrier(carrierCode);

    if (contributions.length === 0) {
      return null;
    }

    // Prix moyen
    const averagePrice =
      contributions.reduce((sum, c) => sum + c.actualCost, 0) / contributions.length;

    // Délai moyen réel
    const contributionsWithDelay = contributions.filter((c) => c.actualDays !== undefined);
    const averageDelay =
      contributionsWithDelay.length > 0
        ? contributionsWithDelay.reduce((sum, c) => sum + (c.actualDays || 0), 0) /
          contributionsWithDelay.length
        : 0;

    // Calcul variance délai (écart-type des délais réels)
    const averageDelayVariance =
      contributionsWithDelay.length > 1
        ? Math.sqrt(
            contributionsWithDelay.reduce(
              (sum, c) => sum + ((c.actualDays ?? 0) - averageDelay) ** 2,
              0
            ) / contributionsWithDelay.length
          )
        : 0;

    // Taux de livraison à l'heure
    const onTimeRate =
      contributions.filter((c) => c.status === 'received').length / contributions.length;

    // Taux de perte
    const lostRate = contributions.filter((c) => c.status === 'lost').length / contributions.length;

    // Taux de dommage
    const damagedRate =
      contributions.filter((c) => c.status === 'damaged').length / contributions.length;

    // Note moyenne
    const averageRating =
      contributions.reduce((sum, c) => sum + c.rating, 0) / contributions.length;

    return {
      carrier: carrierCode,
      carrierCode,
      totalShipments: contributions.length,
      averagePrice,
      averageDelay,
      averageDelayVariance,
      reliability: {
        onTimeRate,
        lostRate,
        damagedRate,
        averageRating,
      },
      priceTransparency: {
        hiddenFeesReported: 0,
        averageHiddenFees: 0,
        transparencyScore: Math.round(averageRating * 20),
      },
      lastUpdate: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error calculating carrier statistics:', error);
    return null;
  }
}

/**
 * Calcule les statistiques pour une route
 */
export async function calculateRouteStatistics(
  origin: string,
  destination: Territory
): Promise<RouteStatistics | null> {
  try {
    const contributions = await getContributionsByRoute(origin, destination);

    if (contributions.length === 0) {
      return null;
    }

    // Compter les transporteurs uniques
    const uniqueCarriers = new Set(contributions.map((c) => c.carrier)).size;

    // Prix
    const prices = contributions.map((c) => c.actualCost);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const averagePrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;

    const sortedPrices = [...prices].sort((a, b) => a - b);
    const medianPrice =
      sortedPrices.length % 2 === 0
        ? (sortedPrices[sortedPrices.length / 2 - 1] + sortedPrices[sortedPrices.length / 2]) / 2
        : sortedPrices[Math.floor(sortedPrices.length / 2)];

    // Évolution des prix (grouper par mois)
    const priceEvolution = groupPricesByMonth(contributions);

    // Délais
    const contributionsWithDelay = contributions.filter((c) => c.actualDays !== undefined);
    const averageRealDays =
      contributionsWithDelay.length > 0
        ? contributionsWithDelay.reduce((sum, c) => sum + (c.actualDays || 0), 0) /
          contributionsWithDelay.length
        : 0;

    return {
      route: {
        origin,
        destination,
      },
      carrierCount: uniqueCarriers,
      totalShipments: contributions.length,
      pricing: {
        minPrice,
        maxPrice,
        averagePrice,
        medianPrice,
        priceEvolution,
      },
      timing: {
        averageAnnouncedDays: 0,
        averageRealDays,
        delayVariance:
          contributionsWithDelay.length > 1
            ? Math.sqrt(
                contributionsWithDelay.reduce(
                  (sum, c) => sum + ((c.actualDays ?? 0) - averageRealDays) ** 2,
                  0
                ) / contributionsWithDelay.length
              )
            : 0,
      },
      lastUpdate: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error calculating route statistics:', error);
    return null;
  }
}

/**
 * Groupe les prix par mois
 */
function groupPricesByMonth(
  contributions: FreightContribution[]
): Array<{ date: string; averagePrice: number }> {
  const monthlyData = new Map<string, number[]>();

  contributions.forEach((contrib) => {
    const date = new Date(contrib.sendDate);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, []);
    }
    monthlyData.get(monthKey)!.push(contrib.actualCost);
  });

  return Array.from(monthlyData.entries())
    .map(([monthKey, prices]) => ({
      date: `${monthKey}-01`,
      averagePrice: prices.reduce((sum, p) => sum + p, 0) / prices.length,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Valide une contribution
 */
export function validateContribution(contribution: Partial<FreightContribution>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!contribution.carrier) {
    errors.push('Le transporteur est requis');
  }

  if (!contribution.route?.origin || !contribution.route?.destination) {
    errors.push("L'origine et la destination sont requises");
  }

  if (!contribution.package?.weight || contribution.package.weight <= 0) {
    errors.push('Le poids du colis est requis et doit être positif');
  }

  if (!contribution.actualCost || contribution.actualCost <= 0) {
    errors.push('Le coût réel est requis et doit être positif');
  }

  if (!contribution.sendDate) {
    errors.push("La date d'envoi est requise");
  }

  if (!contribution.status) {
    errors.push('Le statut de livraison est requis');
  }

  if (!contribution.rating || contribution.rating < 1 || contribution.rating > 5) {
    errors.push('La note doit être entre 1 et 5');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
