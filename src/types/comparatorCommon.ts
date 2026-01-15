/**
 * Common Types for All Comparators
 * 
 * This file defines shared types used across all citizen comparators
 * to ensure consistency and reusability.
 */

import type { ReactNode } from 'react';

/**
 * Territory codes for French overseas territories
 */
export type Territory = 
  | 'GP'  // Guadeloupe
  | 'MQ'  // Martinique
  | 'GY'  // Guyane
  | 'RE'  // La Réunion
  | 'YT'  // Mayotte
  | 'MF'  // Saint-Martin
  | 'BL'  // Saint-Barthélemy
  | 'PM'  // Saint-Pierre-et-Miquelon
  | 'WF'  // Wallis-et-Futuna
  | 'PF'  // Polynésie française
  | 'NC'; // Nouvelle-Calédonie

/**
 * Territory information
 */
export interface TerritoryInfo {
  code: Territory;
  name: string;
  department: string;
  region: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Comparator metadata
 */
export interface ComparatorMetadata {
  lastUpdate: string;
  dataSource: string;
  methodology: string;
  totalEntries: number;
  coverage?: {
    territories: Territory[];
    percentage: number;
  };
  disclaimer?: string;
}

/**
 * Data source information
 */
export interface DataSource {
  type: 'official_api' | 'user_contribution' | 'scraping' | 'partnership';
  url?: string;
  reliability: 'high' | 'medium' | 'low';
  lastUpdated: string;
  description?: string;
}

/**
 * Contribution data from citizens
 */
export interface ContributionData {
  comparatorType: string;
  territory: Territory;
  data: Record<string, unknown>;
  proof?: File;
  anonymous: boolean;
  timestamp: string;
  contributorId?: string;
}

/**
 * Contribution field definition
 */
export interface ContributionField {
  name: string;
  type: 'text' | 'number' | 'select' | 'date' | 'file' | 'territory';
  label: string;
  required: boolean;
  options?: string[];
  validation?: (value: unknown) => boolean;
  placeholder?: string;
  helpText?: string;
}

/**
 * Contribution with status
 */
export interface Contribution {
  id: string;
  comparatorType: string;
  territory: Territory;
  data: Record<string, unknown>;
  proof?: string; // URL to proof file
  anonymous: boolean;
  status: 'pending' | 'verified' | 'published' | 'rejected';
  createdAt: string;
  verifiedAt?: string;
  contributorId?: string;
  moderatorNotes?: string;
}

/**
 * Alert system types
 */
export interface Alert {
  id: string;
  userId: string;
  comparatorType: string;
  type: string;
  territory: Territory;
  conditions: Record<string, unknown>;
  notificationMethod: 'email' | 'push' | 'both';
  active: boolean;
  createdAt: string;
  lastTriggered?: string;
  triggeredCount: number;
  label?: string;
}

/**
 * Alert type definition
 */
export interface AlertType {
  id: string;
  name: string;
  description: string;
  icon: ReactNode;
  fields: AlertField[];
}

/**
 * Alert field definition
 */
export interface AlertField {
  name: string;
  type: 'text' | 'number' | 'select' | 'territory';
  label: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
}

/**
 * Map marker for interactive maps
 */
export interface MapMarker {
  id: string;
  position: [number, number]; // [latitude, longitude]
  title: string;
  type: string;
  data: unknown;
  icon?: string;
  color?: string;
  popupContent?: ReactNode;
}

/**
 * OCR result
 */
export interface OCRResult {
  text: string;
  confidence: number;
  structured?: unknown;
  language: string;
}

/**
 * Parsed invoice from OCR
 */
export interface InvoiceParsed {
  supplier: string;
  totalAmount: number;
  date: string;
  items: Array<{
    name: string;
    price: number;
    quantity?: number;
  }>;
}

/**
 * Parsed receipt from OCR
 */
export interface ReceiptParsed {
  store: string;
  date: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  total: number;
}

/**
 * Solidary badge types
 */
export type SolidaryBadgeType = 
  | 'local'       // Produit local
  | 'fair_trade'  // Commerce équitable
  | 'social'      // Économie sociale et solidaire
  | 'public'      // Service public
  | 'free'        // Gratuit
  | 'eco';        // Écologique

/**
 * Price comparison result (generic)
 */
export interface PriceComparison {
  min: number;
  max: number;
  average: number;
  median: number;
  range: number;
  rangePercentage: number;
}

/**
 * Savings calculation
 */
export interface Savings {
  absolute: number;
  percentage: number;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: Array<{
    field: string;
    message: string;
  }>;
}

/**
 * Validation rule
 */
export interface ValidationRule {
  field: string;
  type: 'required' | 'format' | 'range' | 'custom';
  params?: unknown;
  message: string;
}
