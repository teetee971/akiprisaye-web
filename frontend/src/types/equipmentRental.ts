/**
 * Equipment / Material Rental Comparison Types v1.0.0
 *
 * Principes :
 * - Observer, pas vendre : comparaison transparente
 * - Tous types de matériaux : BTP, outillage, événementiel, jardinage, déménagement
 * - Multi-loueurs par territoire DOM/ROM/COM
 * - Sources transparentes
 */

import type { Territory } from './priceAlerts';

/** Catégorie de matériel */
export type EquipmentCategory =
  | 'btp'           // Bâtiment & Travaux Publics (échafaudages, bétonnières, compresseurs)
  | 'outillage'     // Outillage électroportatif (perforateurs, ponceuses, scies)
  | 'levage'        // Levage & manutention (chariots élévateurs, nacelles, grues)
  | 'terrassement'  // Terrassement (mini-pelles, compacteurs, tractopelles)
  | 'evenementiel'  // Événementiel (tentes, chapiteaux, tables, chaises)
  | 'jardinage'     // Jardinage & espaces verts (tondeuses, tronçonneuses, broyeurs)
  | 'nettoyage'     // Nettoyage (nettoyeurs haute pression, aspirateurs industriels)
  | 'demenagement'  // Déménagement (camionnettes, remorques, sangles)
  | 'agriculture';  // Agriculture (motoculteurs, pulvérisateurs)

/** Unité de tarification */
export type RentalUnit = 'hour' | 'halfday' | 'day' | 'week' | 'month';

/** Source de l'observation */
export interface EquipmentRentalSource {
  type: 'official_site' | 'user_report' | 'aggregator' | 'press';
  url?: string;
  observedAt: string;
  verificationMethod: 'automated' | 'manual' | 'official';
  reliability: 'high' | 'medium' | 'low';
}

/** Prix par unité de temps */
export interface EquipmentRentalPricing {
  dailyRate: number;        // tarif journée (TTC)
  halfDayRate?: number;     // tarif demi-journée
  weeklyRate?: number;      // tarif semaine
  deposit?: number;         // caution (€)
  currency: string;
  vatIncluded: boolean;
}

/** Conditions de location */
export interface EquipmentRentalConditions {
  deliveryAvailable: boolean;
  deliveryCost?: number;           // coût de livraison (€)
  minRentalDuration: RentalUnit;
  trainingRequired: boolean;       // formation obligatoire
  insuranceIncluded: boolean;
  fuelIncluded?: boolean;
}

/** Point de données pour un loueur / matériel */
export interface EquipmentRentalPricePoint {
  id: string;
  agency: string;              // Nom du loueur (ex : "Loxam", "Kiloutou")
  agencyCode: string;          // Code court
  isLocalAgency: boolean;      // Loueur local vs national
  territory: Territory;
  category: EquipmentCategory;
  equipmentName: string;       // Ex : "Mini-pelle 1,5T", "Bétonnière 350L"
  equipmentBrand?: string;     // Marque si connue
  pricing: EquipmentRentalPricing;
  conditions: EquipmentRentalConditions;
  observationDate: string;
  source: EquipmentRentalSource;
  confidence: 'high' | 'medium' | 'low';
  verified: boolean;
  notes?: string;
}

/** Classement d'un loueur */
export interface EquipmentRentalRanking {
  rank: number;
  rentalPrice: EquipmentRentalPricePoint;
  absoluteDifferenceFromCheapest: number;
  percentageDifferenceFromCheapest: number;
  absoluteDifferenceFromAverage: number;
  percentageDifferenceFromAverage: number;
  priceCategory: 'cheapest' | 'below_average' | 'average' | 'above_average' | 'most_expensive';
}

/** Statistiques d'agrégation */
export interface EquipmentRentalAggregation {
  territory: Territory;
  category: EquipmentCategory;
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
  nationalAgencyCount: number;
}

/** Résultat complet de comparaison */
export interface EquipmentRentalComparisonResult {
  territory: Territory;
  category: EquipmentCategory;
  agencies: EquipmentRentalRanking[];
  aggregation: EquipmentRentalAggregation;
  comparisonDate: string;
  metadata: EquipmentRentalMetadata;
}

/** Métadonnées de transparence */
export interface EquipmentRentalMetadata {
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
export interface EquipmentRentalFilter {
  territory?: Territory;
  category?: EquipmentCategory;
  maxDailyRate?: number;
  deliveryRequired?: boolean;
  localAgencyOnly?: boolean;
  verifiedOnly?: boolean;
}
