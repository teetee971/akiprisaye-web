/**
 * Car Rental Comparison Types v1.0.0
 *
 * Principes :
 * - Observer, pas vendre : comparaison transparente sans liens d'affiliation
 * - Lecture seule (pas de modification de données)
 * - Multi-agences par territoire DOM/ROM/COM
 * - Toutes catégories de véhicules
 * - Sources transparentes
 */

import type { Territory } from './priceAlerts';

/** Territoire de location */
export interface RentalTerritory {
  code: Territory;
  name: string;
  airports: string[];
}

/** Catégorie de véhicule */
export type CarCategory =
  | 'economy'
  | 'compact'
  | 'intermediate'
  | 'standard'
  | 'fullsize'
  | 'suv'
  | 'minivan'
  | 'luxury'
  | 'electric'
  | 'utility';

/** Durée de location */
export type RentalDuration = '1d' | '3d' | '7d' | '14d' | '30d';

/** Options incluses / suppléments */
export interface CarRentalInclusions {
  unlimitedMileage: boolean;
  cdwIncluded: boolean;      // Collision Damage Waiver
  tplIncluded: boolean;      // Third Party Liability
  airportFee: boolean;
  youngDriverSurcharge?: number;  // surcharge jeune conducteur (€/jour)
  additionalDriverFee?: number;   // conducteur supplémentaire (€/jour)
  gpsIncluded: boolean;
  childSeatAvailable: boolean;
}

/** Prix par durée */
export interface CarRentalPricing {
  dailyRate: number;         // tarif journalier de base
  weeklyRate?: number;       // tarif semaine (7j)
  deposit: number;           // caution (€)
  currency: string;
}

/** Source de l'observation */
export interface CarRentalSource {
  type: 'official_site' | 'user_report' | 'aggregator' | 'press';
  url?: string;
  observedAt: string;        // ISO 8601
  verificationMethod: 'automated' | 'manual' | 'official';
  reliability: 'high' | 'medium' | 'low';
}

/** Point de données pour une agence / catégorie */
export interface CarRentalPricePoint {
  id: string;
  agency: string;            // Nom de l'agence (ex : "Hertz", "Jumbo Car")
  agencyCode: string;        // Code court (ex : "HTZ", "JMB")
  isLocalAgency: boolean;    // Agence locale vs multinationale
  territory: Territory;
  pickupLocation: string;    // Ex : "Aéroport Pointe-à-Pitre / Pôle Caraïbes"
  category: CarCategory;
  vehicleExample: string;    // Ex : "Peugeot 208 ou similaire"
  transmission: 'manual' | 'automatic';
  pricing: CarRentalPricing;
  inclusions: CarRentalInclusions;
  minAge: number;            // Âge minimum conducteur
  observationDate: string;   // ISO 8601
  source: CarRentalSource;
  confidence: 'high' | 'medium' | 'low';
  verified: boolean;
  notes?: string;
}

/** Classement d'une agence */
export interface CarRentalRanking {
  rank: number;
  rentalPrice: CarRentalPricePoint;
  absoluteDifferenceFromCheapest: number;
  percentageDifferenceFromCheapest: number;
  absoluteDifferenceFromAverage: number;
  percentageDifferenceFromAverage: number;
  priceCategory: 'cheapest' | 'below_average' | 'average' | 'above_average' | 'most_expensive';
}

/** Statistiques d'agrégation */
export interface CarRentalAggregation {
  territory: Territory;
  category: CarCategory;
  agencyCount: number;
  pricing: {
    averageDailyRate: number;
    minDailyRate: number;
    maxDailyRate: number;
    priceRange: number;
    priceRangePercentage: number;
    medianDailyRate: number;
  };
  observationPeriod: {
    from: string;
    to: string;
  };
  totalObservations: number;
  lastUpdate: string;
  localAgencyCount: number;
  internationalAgencyCount: number;
}

/** Résultat complet de comparaison */
export interface CarRentalComparisonResult {
  territory: Territory;
  category: CarCategory;
  agencies: CarRentalRanking[];
  aggregation: CarRentalAggregation;
  comparisonDate: string;
  metadata: CarRentalMetadata;
}

/** Métadonnées de transparence */
export interface CarRentalMetadata {
  methodology: string;
  aggregationMethod: 'mean' | 'median' | 'weighted';
  dataQuality: {
    totalAgencies: number;
    agenciesWithData: number;
    coveragePercentage: number;
    oldestObservation: string;
    newestObservation: string;
  };
  warnings?: string[];
  limitations: string[];
  disclaimer: string;
}

/** Filtres de recherche */
export interface CarRentalFilter {
  territory?: Territory;
  category?: CarCategory;
  transmission?: 'manual' | 'automatic';
  maxDailyRate?: number;
  unlimitedMileageOnly?: boolean;
  localAgencyOnly?: boolean;
  verifiedOnly?: boolean;
}
