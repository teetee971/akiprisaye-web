/**
 * Freight Comparison Service v1.0.0
 * 
 * Service de comparaison fret maritime & colis
 * Transparence totale sur formation des prix
 */

import type {
  FreightRoute,
  PackageDetails,
  UrgencyLevel,
  FreightQuote,
  FreightQuoteRanking,
  FreightComparisonResult,
  RouteAggregation,
  FreightPricing,
} from '../types/freightComparison';
import type { Territory } from '../types/priceAlerts';
import {
  OCTROI_DE_MER_RATES,
  HANDLING_FEE_RATE,
  INSURANCE_RATE,
  URGENCY_SURCHARGE,
} from '../constants/freightRates';

/**
 * Calcule l'octroi de mer pour un territoire
 */
export function calculateOctroiDeMer(
  basePrice: number,
  territory: Territory
): number {
  const rate = OCTROI_DE_MER_RATES[territory];
  if (rate === undefined) {
    console.warn(`Unknown territory for octroi de mer calculation: ${territory}`);
    return 0;
  }
  return basePrice * rate;
}

/**
 * Calcule le coût total d'un envoi
 */
export function calculateTotalCost(
  basePrice: number,
  packageDetails: PackageDetails,
  territory: Territory,
  urgency: UrgencyLevel = 'standard'
): FreightPricing {
  // Frais de manutention
  const handlingFee = basePrice * HANDLING_FEE_RATE;
  
  // Assurance (si valeur déclarée)
  const insurance = packageDetails.declaredValue 
    ? packageDetails.declaredValue * INSURANCE_RATE
    : 0;
  
  // Octroi de mer
  const octroi = calculateOctroiDeMer(basePrice, territory);
  
  // Supplément urgence
  const urgencySurcharge = basePrice * URGENCY_SURCHARGE[urgency];
  
  // Total TTC
  const totalTTC = basePrice + handlingFee + insurance + octroi + urgencySurcharge;
  
  return {
    basePrice,
    handlingFee,
    insurance: insurance > 0 ? insurance : undefined,
    octroi,
    totalTTC,
    breakdown: [
      { name: 'Prix de base', amount: basePrice },
      { name: 'Frais de manutention', amount: handlingFee },
      ...(insurance > 0 ? [{ name: 'Assurance', amount: insurance }] : []),
      { name: 'Octroi de mer', amount: octroi },
      ...(urgencySurcharge > 0 ? [{ name: 'Supplément urgence', amount: urgencySurcharge }] : []),
    ],
  };
}

/**
 * Simule un devis de fret
 */
export async function simulateFreightQuote(
  route: FreightRoute,
  packageDetails: PackageDetails,
  urgency: UrgencyLevel = 'standard'
): Promise<FreightComparisonResult | null> {
  try {
    // Charger les données des transporteurs
    const quotes = await getCarrierQuotes(route, packageDetails, urgency);
    
    if (quotes.length === 0) {
      return null;
    }
    
    // Classer les devis
    const rankedQuotes = rankQuotes(quotes);
    
    // Calculer l'agrégation
    const aggregation = calculateRouteAggregation(route, quotes);
    
    return {
      route,
      package: packageDetails,
      urgency,
      quotes: rankedQuotes,
      aggregation,
      comparisonDate: new Date().toISOString(),
      metadata: {
        totalCarriers: quotes.length,
        contributionsCount: 0, // TODO: Compter les contributions réelles
        dataSource: 'Données officielles transporteurs + contributions citoyennes',
        methodology: 'v1.0.0',
        disclaimer: 'Observer, pas vendre. Aucun lien d\'affiliation. Données transparentes.',
      },
    };
  } catch (error) {
    console.error('Error simulating freight quote:', error);
    return null;
  }
}

/**
 * Récupère les devis des transporteurs
 */
export async function getCarrierQuotes(
  route: FreightRoute,
  packageDetails: PackageDetails,
  urgency: UrgencyLevel = 'standard'
): Promise<FreightQuote[]> {
  try {
    // Charger les données depuis le fichier JSON
    const response = await fetch('/data/freight-prices.json');
    if (!response.ok) {
      throw new Error('Impossible de charger les données des transporteurs');
    }
    
    const data = await response.json();
    const carriers = data.carriers || [];
    const routes = data.routes || [];
    
    // Trouver la route correspondante
    const matchingRoute = routes.find(
      (r: any) =>
        r.origin === route.origin &&
        r.destination === route.destination
    );
    
    if (!matchingRoute || !matchingRoute.quotes) {
      return [];
    }
    
    // Construire les devis
    const quotes: FreightQuote[] = matchingRoute.quotes.map((quoteData: any) => {
      const carrier = carriers.find((c: any) => c.code === quoteData.carrier);
      
      // Calculer le prix en fonction du poids et de l'urgence
      const basePrice = calculateBasePriceForWeight(
        quoteData.basePrice,
        quoteData.packageWeight || 5,
        packageDetails.weight
      );
      
      const pricing = calculateTotalCost(
        basePrice,
        packageDetails,
        route.destination,
        urgency
      );
      
      return {
        id: `${quoteData.carrier}-${Date.now()}`,
        carrier: carrier?.name || quoteData.carrier,
        carrierCode: quoteData.carrier,
        route,
        package: packageDetails,
        urgency,
        pricing,
        timing: {
          announcedDays: quoteData.announcedDays || 7,
          realDaysAverage: quoteData.realDaysAverage,
        },
        reliability: {
          score: quoteData.reliability || 3.5,
          basedOnContributions: quoteData.contributionsCount || 0,
          onTimeRate: quoteData.onTimeRate || 0.75,
          issuesReported: quoteData.issuesReported || 0,
        },
        source: {
          type: 'official_site',
          observedAt: quoteData.lastUpdated || new Date().toISOString(),
          verificationMethod: 'automated',
          reliability: 'medium',
        },
        lastUpdated: quoteData.lastUpdated || new Date().toISOString(),
        trackingAvailable: true,
        insuranceIncluded: packageDetails.declaredValue ? true : false,
        pickupAvailable: carrier?.pickupAvailable || false,
        website: carrier?.website,
      };
    });
    
    return quotes;
  } catch (error) {
    console.error('Error loading carrier quotes:', error);
    return [];
  }
}

/**
 * Calcule le prix de base en fonction du poids
 */
function calculateBasePriceForWeight(
  referencePrice: number,
  referenceWeight: number,
  actualWeight: number
): number {
  // Prix proportionnel au poids
  return (referencePrice / referenceWeight) * actualWeight;
}

/**
 * Classe les devis par prix
 */
export function rankQuotes(quotes: FreightQuote[]): FreightQuoteRanking[] {
  if (quotes.length === 0) return [];
  
  // Trier par prix
  const sorted = [...quotes].sort((a, b) => a.pricing.totalTTC - b.pricing.totalTTC);
  
  // Calculer la moyenne
  const averagePrice = sorted.reduce((sum, q) => sum + q.pricing.totalTTC, 0) / sorted.length;
  const cheapestPrice = sorted[0].pricing.totalTTC;
  
  // Classer
  return sorted.map((quote, index) => {
    const rank = index + 1;
    const savingsVsCheapest = quote.pricing.totalTTC - cheapestPrice;
    const savingsVsAverage = quote.pricing.totalTTC - averagePrice;
    
    let priceCategory: FreightQuoteRanking['priceCategory'];
    if (rank === 1) {
      priceCategory = 'cheapest';
    } else if (quote.pricing.totalTTC < averagePrice) {
      priceCategory = 'below_average';
    } else if (quote.pricing.totalTTC === averagePrice) {
      priceCategory = 'average';
    } else if (rank === sorted.length) {
      priceCategory = 'most_expensive';
    } else {
      priceCategory = 'above_average';
    }
    
    // Badge "Meilleur rapport qualité/prix"
    const isBestValue =
      priceCategory === 'cheapest' ||
      (priceCategory === 'below_average' && quote.reliability.score >= 4.0);
    
    return {
      rank,
      quote,
      savingsVsCheapest,
      savingsVsAverage,
      priceCategory,
      isBestValue,
    };
  });
}

/**
 * Calcule l'agrégation pour une route
 */
export function calculateRouteAggregation(
  route: FreightRoute,
  quotes: FreightQuote[]
): RouteAggregation {
  const prices = quotes.map((q) => q.pricing.totalTTC);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const averagePrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
  
  // Médiane
  const sortedPrices = [...prices].sort((a, b) => a - b);
  const medianPrice =
    sortedPrices.length % 2 === 0
      ? (sortedPrices[sortedPrices.length / 2 - 1] + sortedPrices[sortedPrices.length / 2]) / 2
      : sortedPrices[Math.floor(sortedPrices.length / 2)];
  
  const priceRange = maxPrice - minPrice;
  const priceRangePercentage = (priceRange / minPrice) * 100;
  
  return {
    route,
    carrierCount: quotes.length,
    minPrice,
    maxPrice,
    averagePrice,
    medianPrice,
    priceRange,
    priceRangePercentage,
    observationPeriod: {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      to: new Date().toISOString(),
    },
    totalObservations: quotes.reduce((sum, q) => sum + q.reliability.basedOnContributions, 0),
    lastUpdate: new Date().toISOString(),
  };
}

/**
 * Filtre les devis selon les critères
 */
export function filterQuotes(
  quotes: FreightQuote[],
  filters: {
    maxPrice?: number;
    minRating?: number;
    carrier?: string;
  }
): FreightQuote[] {
  return quotes.filter((quote) => {
    if (filters.maxPrice && quote.pricing.totalTTC > filters.maxPrice) {
      return false;
    }
    if (filters.minRating && quote.reliability.score < filters.minRating) {
      return false;
    }
    if (filters.carrier && quote.carrierCode !== filters.carrier) {
      return false;
    }
    return true;
  });
}
