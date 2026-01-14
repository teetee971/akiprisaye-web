/**
 * Cyclone Comparison Types v1.0.0
 * 
 * Comparateur Préparation Cyclones & Catastrophes Naturelles
 * Tool for cyclone resilience in French overseas territories
 * 
 * Principles:
 * - Observer, not sell: Transparent price comparison for survival kits
 * - Community resilience focus
 * - Life-saving information accessibility
 * - Solidarity network facilitation
 */

import type { Territory, DataSource } from './priceAlerts';

/**
 * Cyclone vigilance levels (Météo France)
 */
export type CycloneVigilance = 'vert' | 'jaune' | 'orange' | 'rouge' | 'violet';

/**
 * Cyclone category (Saffir-Simpson scale)
 */
export type CycloneCategory = 1 | 2 | 3 | 4 | 5;

/**
 * Survival kit item categories
 */
export type SurvivalKitCategory = 'water' | 'food' | 'energy' | 'safety' | 'protection' | 'documents';

/**
 * Item priority levels
 */
export type ItemPriority = 'essential' | 'important' | 'recommended';

/**
 * Stock availability status
 */
export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

/**
 * Survival kit item definition
 */
export interface SurvivalKitItem {
  id: string;
  category: SurvivalKitCategory;
  name: string;
  quantityPerPerson: number;
  unit: string;
  priority: ItemPriority;
  shelfLife?: number;  // months
}

/**
 * Price observation for a survival kit item
 */
export interface SurvivalKitPrice {
  item: SurvivalKitItem;
  store: string;
  territory: Territory;
  price: number;
  availability: StockStatus;
  lastUpdated: string;
  source: 'official' | 'user_report';
}

/**
 * Budget calculation for a household
 */
export interface SurvivalKitBudget {
  householdSize: number;
  territory: Territory;
  items: Array<{
    item: SurvivalKitItem;
    quantity: number;
    bestPrice: SurvivalKitPrice;
    totalCost: number;
  }>;
  totalBudget: number;
  byCategory: Record<string, number>;
}

/**
 * Preparation phase
 */
export type PreparationPhase = 'before' | 'during' | 'after';

/**
 * Task priority level
 */
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * Checklist item
 */
export interface ChecklistItem {
  id: string;
  task: string;
  completed: boolean;
  priority: TaskPriority;
  completedAt?: string;
}

/**
 * Preparedness checklist
 */
export interface PreparednessChecklist {
  id: string;
  userId?: string;
  phase: PreparationPhase;
  items: ChecklistItem[];
  score: number;  // 0-100
  lastUpdated: string;
}

/**
 * Shelter type
 */
export type ShelterType = 'gym' | 'school' | 'community_center' | 'hotel' | 'other';

/**
 * Shelter status
 */
export type ShelterStatus = 'closed' | 'open' | 'full';

/**
 * Shelter facilities
 */
export interface ShelterFacilities {
  beds: boolean;
  showers: boolean;
  kitchen: boolean;
  generator: boolean;
  medical: boolean;
  accessible: boolean;
  petsAllowed: boolean;
}

/**
 * Shelter contact information
 */
export interface ShelterContact {
  phone: string;
  email?: string;
}

/**
 * Shelter/Refuge information
 */
export interface Shelter {
  id: string;
  name: string;
  type: ShelterType;
  territory: Territory;
  commune: string;
  address: string;
  coordinates: [number, number];
  
  capacity: number;
  facilities: ShelterFacilities;
  
  contact: ShelterContact;
  
  status: ShelterStatus;
  currentOccupancy?: number;
  
  officialShelter: boolean;
  lastUpdated: string;
}

/**
 * Cyclone forecast information
 */
export interface CycloneForecast {
  passageTime?: string;
  windSpeed: number;  // km/h
  rainfall: number;  // mm
  trajectory: Array<{ lat: number; lng: number; time: string }>;
}

/**
 * Cyclone alert
 */
export interface CycloneAlert {
  id: string;
  territory: Territory;
  vigilance: CycloneVigilance;
  cycloneName?: string;
  category?: CycloneCategory;
  
  forecast: CycloneForecast;
  
  officialInstructions: string[];
  
  issuedAt: string;
  updatedAt: string;
  source: 'MeteoFrance' | 'Prefecture';
}

/**
 * Historical cyclone dates
 */
export interface CycloneDates {
  formation: string;
  landfall?: string;
  dissipation: string;
}

/**
 * Cyclone impact data
 */
export interface CycloneImpact {
  deaths: number;
  injured: number;
  damagesEuros: number;
  housesDestroyed: number;
  householdsDamaged: number;
}

/**
 * Historical cyclone record
 */
export interface CycloneHistory {
  id: string;
  name: string;
  year: number;
  category: CycloneCategory;
  territories: Territory[];
  
  dates: CycloneDates;
  
  trajectory: Array<{ lat: number; lng: number; time: string; windSpeed: number }>;
  
  impact: CycloneImpact;
  
  lessonsLearned?: string[];
}

/**
 * Insurance coverage details
 */
export interface InsuranceCoverage {
  catastropheNaturelle: boolean;
  windDamage: boolean;
  floodDamage: boolean;
  roofDamage: boolean;
  structuralDamage: boolean;
}

/**
 * Insurance pricing information
 */
export interface InsurancePricing {
  annualPremium: number;
  franchise: number;
  maxCoverage: number;
}

/**
 * Insurance claims information
 */
export interface InsuranceClaims {
  declarationDeadline: number;  // days
  averageSettlementTime: number;  // days
  satisfactionRate: number;  // 0-5
}

/**
 * Insurance source information
 */
export interface InsuranceSource {
  type: 'official' | 'user_report';
}

/**
 * Cyclone insurance comparison data
 */
export interface CycloneInsurance {
  id: string;
  provider: string;
  offerName: string;
  territory: Territory;
  
  coverage: InsuranceCoverage;
  
  pricing: InsurancePricing;
  
  claims: InsuranceClaims;
  
  source: InsuranceSource;
}

/**
 * Solidarity offer type
 */
export type SolidarityType = 'shelter' | 'water' | 'food' | 'transport' | 'equipment' | 'other';

/**
 * Solidarity offer location
 */
export interface SolidarityLocation {
  commune: string;
  coordinates?: [number, number];
}

/**
 * Solidarity offer
 */
export interface SolidarityOffer {
  id: string;
  type: SolidarityType;
  description: string;
  location: SolidarityLocation;
  contact: string;
  available: boolean;
  postedAt: string;
  expiresAt?: string;
}

/**
 * Store comparison result
 */
export interface StoreComparison {
  storeName: string;
  totalCost: number;
  itemsAvailable: number;
  itemsTotal: number;
  coveragePercentage: number;
}

/**
 * Household profile for personalization
 */
export interface HouseholdProfile {
  size: number;
  hasBabies: boolean;
  hasElderly: boolean;
  hasPets: boolean;
  hasVehicle: boolean;
  territory: Territory;
}
