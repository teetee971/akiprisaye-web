/**
 * Water Comparison Types
 * Types pour le comparateur d'accès à l'eau potable
 * 
 * Réponse à l'urgence hydrique dans les territoires ultramarins
 * (particulièrement Mayotte et Guadeloupe)
 */

export type WaterStatus = 'available' | 'cut' | 'low_pressure' | 'scheduled_cut';
export type WaterQuality = 'A' | 'B' | 'C' | 'D' | 'E';
export type LeakType = 'pipe' | 'hydrant' | 'meter' | 'main';
export type Territory = 'GP' | 'MQ' | 'GF' | 'RE' | 'YT' | 'PM' | 'BL' | 'MF' | 'WF' | 'PF' | 'NC' | 'TF';

export interface WaterAvailability {
  id: string;
  location: {
    commune: string;
    quartier?: string;
    address?: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  status: WaterStatus;
  since: string; // ISO 8601
  duration?: number; // minutes
  scheduledEnd?: string; // ISO 8601
  reportedBy: 'user' | 'official' | 'system';
  verified: boolean;
  contributorId?: string;
  createdAt: string; // ISO 8601
}

export interface WaterCutHistory {
  id: string;
  location: {
    commune: string;
    quartier?: string;
  };
  startDate: string; // ISO 8601
  endDate?: string; // ISO 8601
  duration: number; // minutes
  scheduled: boolean;
  reason?: string;
  affectedHouseholds?: number;
}

export interface WaterPricing {
  id: string;
  provider: string;
  territory: Territory;
  commune?: string;

  pricing: {
    pricePerM3: number; // €/m³ distribution
    sanitationPerM3?: number; // €/m³ assainissement
    subscriptionMonthly: number;
    subscriptionAnnual: number;
    fixedFees?: number;
    taxes: Array<{ name: string; rate: number }>;
  };

  lastUpdated: string; // ISO 8601
  source: {
    type: 'official' | 'user_report';
    url?: string;
  };
}

export interface WaterQualityData {
  id: string;
  commune: string;
  territory: Territory;

  quality: {
    overallScore: WaterQuality;
    bacteriological: 'compliant' | 'non_compliant';
    chemical: 'compliant' | 'non_compliant';
    parameters: Array<{
      name: string;
      value: number;
      unit: string;
      limit: number;
      compliant: boolean;
    }>;
  };

  analysisDate: string; // ISO 8601
  nextAnalysisDate?: string; // ISO 8601
  restrictions?: string;
  source: {
    type: 'ARS' | 'official';
    url?: string;
  };
}

export interface WaterLeakReport {
  id: string;
  type: LeakType;
  location: {
    address: string;
    commune: string;
    coordinates: [number, number]; // [longitude, latitude]
  };

  severity: 'minor' | 'moderate' | 'major';
  estimatedLossLitersPerHour?: number;
  photo?: string;
  description: string;

  status: 'reported' | 'in_progress' | 'repaired' | 'rejected';
  reportedAt: string; // ISO 8601
  repairedAt?: string; // ISO 8601
  repairDuration?: number; // hours

  reportedBy: string;
  verified: boolean;
}

export interface WaterConsumptionProfile {
  householdSize: number;
  showers: number; // per week
  baths: number; // per week
  dishwasher: boolean;
  washingMachine: boolean;
  garden: boolean;
  pool: boolean;
}

export interface WaterConsumptionEstimate {
  profile: WaterConsumptionProfile;
  territory: Territory;

  estimation: {
    dailyM3: number;
    monthlyM3: number;
    annualM3: number;
    annualCost: number;
  };

  savings: Array<{
    action: string;
    savingsM3: number;
    savingsEuros: number;
    difficulty: 'easy' | 'medium' | 'hard';
  }>;
}

export interface WaterAlert {
  id: string;
  userId: string;
  type: 'cut_imminent' | 'cut_active' | 'quality_issue' | 'water_restored' | 'leak_nearby';
  location: {
    commune: string;
    quartier?: string;
    radius?: number; // km
  };
  active: boolean;
  createdAt: string; // ISO 8601
  triggeredCount: number;
  lastTriggered?: string; // ISO 8601
}

export interface WaterProvider {
  code: string;
  name: string;
  territory: Territory;
  website?: string;
  phone?: string;
  emergencyPhone?: string;
}

export interface WaterAvailabilityDatabase {
  metadata: {
    generated_at: string; // ISO 8601
    source: string;
    note: string;
  };
  providers: WaterProvider[];
  current_status: WaterAvailability[];
  cut_history: WaterCutHistory[];
  pricing: WaterPricing[];
  quality: WaterQualityData[];
  leaks: WaterLeakReport[];
}
