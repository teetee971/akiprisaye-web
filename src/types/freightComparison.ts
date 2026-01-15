/**
 * Freight & Parcel Comparison Types v1.0.0
 * 
 * Premier comparateur fret maritime & colis pour Outre-mer
 * Répond à la problématique #1 de la vie chère (Rapport Sénat 2024-2025)
 * 
 * Principles:
 * - Transparence totale sur octroi de mer et frais cachés
 * - Délais réels vs annoncés (contributions citoyennes)
 * - Détection automatique frais cachés (OCR)
 * - Score de fiabilité communautaire
 * - Observer, pas vendre (aucun lien d'affiliation)
 */

import type { Territory, DataSource } from './priceAlerts';

/**
 * Type de fret
 */
export type FreightType = 'maritime' | 'aerien' | 'postal';

/**
 * Type de colis
 */
export type PackageType = 'standard' | 'fragile' | 'valeur_declaree';

/**
 * Niveau d'urgence
 */
export type UrgencyLevel = 'standard' | 'express' | 'urgent';

/**
 * Statut de livraison pour contributions
 */
export type DeliveryStatus = 'received' | 'delayed' | 'lost' | 'damaged';

/**
 * Route de fret
 */
export interface FreightRoute {
  origin: string;              // Ville/Port d'origine
  destination: Territory;      // Territoire de destination
  originTerritory?: Territory; // Territoire d'origine (si DOM-TOM)
  distance?: number;           // Distance en km (optionnel)
}

/**
 * Détails du colis
 */
export interface PackageDetails {
  weight: number;              // kg
  dimensions: {
    length: number;            // cm
    width: number;             // cm
    height: number;            // cm
  };
  type: PackageType;
  declaredValue?: number;      // € (pour assurance)
}

/**
 * Référence source pour transparence
 */
export interface FreightSourceReference {
  type: DataSource;
  url?: string;
  observedAt: string;          // ISO 8601
  observedBy?: string;
  verificationMethod: 'automated' | 'manual' | 'official';
  reliability: 'high' | 'medium' | 'low';
}

/**
 * Détail de tarification
 */
export interface FreightPricing {
  basePrice: number;           // Prix de base
  handlingFee: number;         // Frais de manutention
  insurance?: number;          // Assurance (si valeur déclarée)
  octroi: number;              // Octroi de mer
  customsDuties?: number;      // Droits de douane (si applicable)
  totalTTC: number;            // Prix total TTC
  breakdown?: {                // Détail optionnel des frais
    name: string;
    amount: number;
  }[];
}

/**
 * Informations de délai
 */
export interface FreightTiming {
  announcedDays: number;       // Délai annoncé par le transporteur
  realDaysAverage?: number;    // Délai réel moyen (contributions)
}

/**
 * Score de fiabilité
 */
export interface ReliabilityScore {
  score: number;               // 0-5 étoiles
  basedOnContributions: number; // Nombre de contributions
  onTimeRate: number;          // % de livraisons à l'heure
  issuesReported: number;      // Nombre d'incidents signalés
}

/**
 * Devis de fret pour un transporteur
 */
export interface FreightQuote {
  id: string;
  carrier: string;             // Nom du transporteur
  carrierCode: string;         // Code transporteur
  route: FreightRoute;
  package: PackageDetails;
  urgency: UrgencyLevel;
  
  pricing: FreightPricing;
  timing: FreightTiming;
  reliability: ReliabilityScore;
  
  source: FreightSourceReference;
  lastUpdated: string;         // ISO 8601
  
  // Informations supplémentaires
  trackingAvailable: boolean;
  insuranceIncluded: boolean;
  pickupAvailable: boolean;
  website?: string;            // Site officiel (pas d'affiliation)
}

/**
 * Devis classé
 */
export interface FreightQuoteRanking {
  rank: number;                // 1 = moins cher
  quote: FreightQuote;
  savingsVsCheapest: number;   // Économie vs le moins cher (€)
  savingsVsAverage: number;    // Économie vs la moyenne (€)
  priceCategory: 'cheapest' | 'below_average' | 'average' | 'above_average' | 'most_expensive';
  isBestValue?: boolean;       // Badge "Meilleur rapport qualité/prix"
}

/**
 * Agrégation de données pour une route
 */
export interface RouteAggregation {
  route: FreightRoute;
  carrierCount: number;
  minPrice: number;
  maxPrice: number;
  averagePrice: number;
  medianPrice: number;
  priceRange: number;
  priceRangePercentage: number;
  observationPeriod: {
    from: string;              // ISO 8601
    to: string;                // ISO 8601
  };
  totalObservations: number;
  lastUpdate: string;          // ISO 8601
}

/**
 * Résultat de comparaison
 */
export interface FreightComparisonResult {
  route: FreightRoute;
  package: PackageDetails;
  urgency: UrgencyLevel;
  
  quotes: FreightQuoteRanking[];
  aggregation: RouteAggregation;
  
  comparisonDate: string;      // ISO 8601
  metadata: {
    totalCarriers: number;
    contributionsCount: number;
    dataSource: string;
    methodology: string;       // Version méthodologie
    disclaimer: string;        // Avertissement "Observer, pas vendre"
  };
}

/**
 * Contribution citoyenne
 */
export interface FreightContribution {
  id: string;
  carrier: string;
  carrierCode?: string;
  route: FreightRoute;
  package: PackageDetails;
  
  actualCost: number;          // Coût réel payé
  invoice?: File | string;     // Facture (preuve)
  invoiceUrl?: string;         // URL de la facture stockée
  
  sendDate: string;            // ISO 8601 - Date d'envoi
  receivedDate?: string;       // ISO 8601 - Date de réception
  actualDays?: number;         // Délai réel (calculé auto)
  
  status: DeliveryStatus;
  rating: number;              // 1-5 étoiles
  comment?: string;
  
  anonymous: boolean;
  verified: boolean;           // A une facture = vérifié
  
  createdAt: string;           // ISO 8601
  contributorId?: string;
  contributorEmail?: string;
}

/**
 * Données extraites d'une facture (OCR)
 */
export interface InvoiceData {
  carrier: string;
  carrierCode?: string;
  route: {
    origin: string;
    destination: string;
  };
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  basePrice: number;
  fees: Array<{
    name: string;
    amount: number;
  }>;
  octroi?: number;
  totalPaid: number;
  sendDate?: string;
  trackingNumber?: string;
  extractionConfidence: number; // 0-1
}

/**
 * Frais caché détecté
 */
export interface HiddenFee {
  name: string;
  amount: number;
  unexpected: boolean;         // Pas annoncé au devis
  category: 'handling' | 'customs' | 'tax' | 'surcharge' | 'other';
}

/**
 * Alerte fret
 */
export interface FreightAlert {
  id: string;
  userId: string;
  type: 'delay' | 'price_drop' | 'new_carrier' | 'issue';
  route: FreightRoute;
  conditions: {
    maxPrice?: number;         // Alerte si prix descend sous X€
    maxDays?: number;          // Alerte si délai dépasse X jours
    carrier?: string;          // Surveiller un transporteur spécifique
  };
  active: boolean;
  notificationMethod: 'email' | 'push' | 'both';
  createdAt: string;           // ISO 8601
  triggeredCount: number;
  lastTriggered?: string;      // ISO 8601
}

/**
 * Statistiques par transporteur
 */
export interface CarrierStatistics {
  carrier: string;
  carrierCode: string;
  
  totalShipments: number;      // Nombre total d'envois
  averagePrice: number;
  averageDelay: number;        // Délai moyen réel
  averageDelayVariance: number; // Différence délai annoncé vs réel
  
  reliability: {
    onTimeRate: number;        // % livraisons à l'heure
    lostRate: number;          // % colis perdus
    damagedRate: number;       // % colis endommagés
    averageRating: number;     // Note moyenne (1-5)
  };
  
  priceTransparency: {
    hiddenFeesReported: number; // Nombre de frais cachés signalés
    averageHiddenFees: number;  // Montant moyen frais cachés
    transparencyScore: number;  // 0-100
  };
  
  lastUpdate: string;          // ISO 8601
}

/**
 * Statistiques par route
 */
export interface RouteStatistics {
  route: FreightRoute;
  
  carrierCount: number;
  totalShipments: number;
  
  pricing: {
    minPrice: number;
    maxPrice: number;
    averagePrice: number;
    medianPrice: number;
    priceEvolution: Array<{
      date: string;            // ISO 8601
      averagePrice: number;
    }>;
  };
  
  timing: {
    averageAnnouncedDays: number;
    averageRealDays: number;
    delayVariance: number;     // Différence moyenne
  };
  
  lastUpdate: string;          // ISO 8601
}

/**
 * Filtre de recherche
 */
export interface FreightComparisonFilter {
  originTerritory?: Territory;
  destinationTerritory?: Territory;
  freightType?: FreightType;
  carrier?: string;
  maxPrice?: number;
  maxDays?: number;
  minRating?: number;
  verifiedOnly?: boolean;      // Seulement contributions vérifiées
}
