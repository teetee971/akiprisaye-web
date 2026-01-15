/**
 * Type definitions for Professional Training Comparison System
 * DOM-TOM Employment & Training Observatory
 */

import type { Territory } from './priceAlerts';

export type TrainingLevel = 'CAP' | 'BAC_PRO' | 'BTS' | 'LICENCE' | 'MASTER' | 'CERTIFICAT' | 'AUTRE';
export type TrainingType = 'initiale' | 'continue' | 'alternance' | 'VAE' | 'remise_a_niveau';
export type TrainingMode = 'presentiel' | 'distanciel' | 'hybride';
export type FundingSource = 'CPF' | 'pole_emploi' | 'region' | 'OPCO' | 'autofinancement' | 'autre';
export type ContractType = 'CDI' | 'CDD' | 'interim' | 'independant';

/**
 * Training Program - Complete professional training information
 */
export interface TrainingProgram {
  id: string;
  name: string;
  organisme: {
    id: string;
    name: string;
    certifications: string[];  // Qualiopi, etc.
    rating: number;  // 0-5
  };
  
  territory: Territory;
  location: {
    commune: string;
    address: string;
    coordinates?: [number, number];
  };
  
  details: {
    domain: string;  // Santé, BTP, Commerce, etc.
    level: TrainingLevel;
    type: TrainingType;
    mode: TrainingMode;
    duration: number;  // hours
    durationWeeks: number;
    program: string[];  // Modules
    prerequisites: string[];
  };
  
  schedule: {
    nextSessions: Array<{ startDate: string; endDate: string }>;
    fullTime: boolean;
    partTime: boolean;
  };
  
  pricing: {
    catalogPrice: number;
    fundingSources: FundingSource[];
    cpfEligible: boolean;
    poleEmploiEligible: boolean;
    regionAidAvailable: boolean;
  };
  
  outcomes: {
    diploma?: string;
    certification?: string;
    jobs: string[];  // Métiers visés
    successRate?: number;  // % réussite examen
    insertionRate3M?: number;  // % emploi 3 mois
    insertionRate6M?: number;
    insertionRate12M?: number;
    averageSalary?: number;
  };
  
  contact: {
    phone: string;
    email: string;
    website?: string;
  };
  
  source: {
    type: 'official' | 'user_report';
    lastUpdated: string;
  };
}

/**
 * Job Market - Employment demand and opportunities
 */
export interface JobMarket {
  id: string;
  jobTitle: string;
  territory: Territory;
  
  demand: {
    openPositions: number;
    shortage: boolean;  // Métier en tension
    trend: 'increasing' | 'stable' | 'decreasing';
  };
  
  salary: {
    min: number;
    max: number;
    average: number;
    currency: string;
  };
  
  requiredTraining: string[];  // IDs formations
  
  source: {
    type: 'pole_emploi' | 'other';
    lastUpdated: string;
  };
}

/**
 * User Profile - For personalized matching
 */
export interface UserProfile {
  age: number;
  territory: Territory;
  currentStatus: 'employed' | 'unemployed' | 'student' | 'other';
  education: TrainingLevel;
  experience: Array<{ domain: string; years: number }>;
  cpfBalance?: number;
  mobility: boolean;  // Accepte déplacements
}

/**
 * Job Match - Result of matching algorithm
 */
export interface JobMatch {
  job: JobMarket;
  matchScore: number;  // 0-100
  requiredTrainings: TrainingProgram[];
  timeToJob: number;  // months
  totalCost: number;
  fundingAvailable: number;
  remainingCost: number;
  roi: {
    monthsToBreakEven: number;
    gain5Years: number;
  };
}

/**
 * Training Feedback - Citizen contributions on real insertion rates
 */
export interface TrainingFeedback {
  id: string;
  trainingId: string;
  userId?: string;
  
  completed: boolean;
  completionDate: string;
  
  jobFound: boolean;
  jobFoundDelay?: number;  // months
  contractType?: ContractType;
  salary?: number;
  jobRelated: boolean;  // Emploi lié formation ?
  
  rating: number;  // 1-5
  comment?: string;
  
  verified: boolean;  // Avec preuve
  createdAt: string;
}

/**
 * Funding Simulation - Calculate training financing
 */
export interface FundingSimulation {
  training: TrainingProgram;
  userProfile: UserProfile;
  
  breakdown: {
    catalogPrice: number;
    cpf: number;
    poleEmploi: number;
    region: number;
    other: number;
    remainingCost: number;
  };
  
  eligibility: {
    cpf: boolean;
    poleEmploi: boolean;
    region: boolean;
    details: string[];
  };
  
  steps: Array<{
    step: string;
    description: string;
    documents: string[];
    link?: string;
  }>;
}

/**
 * Training Filters - For search and filtering
 */
export interface TrainingFilters {
  territory?: Territory;
  domain?: string;
  level?: TrainingLevel;
  type?: TrainingType;
  mode?: TrainingMode;
  maxCost?: number;
  minDuration?: number;
  maxDuration?: number;
  cpfEligible?: boolean;
  poleEmploiEligible?: boolean;
  minInsertionRate?: number;
}

/**
 * Training Database Structure
 */
export interface TrainingDatabase {
  metadata: {
    generated_at: string;
    source: string;
    note: string;
  };
  organismes: Array<{
    id: string;
    name: string;
    certifications: string[];
    rating: number;
  }>;
  programs: TrainingProgram[];
  jobs_market: JobMarket[];
  feedbacks: TrainingFeedback[];
}
