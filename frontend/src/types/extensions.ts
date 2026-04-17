/**
 * Core Type Definitions for Future Extensions
 *
 * Version: v1.0.3
 * Purpose: Type-safe interfaces for platform extensibility
 *
 * These types prepare the codebase for future features
 * WITHOUT activating any new functionality.
 *
 * @module coreTypes
 */

/**
 * Territory code following ISO 3166-2:FR
 */
export type TerritoryCode =
  | 'FR' // France métropolitaine
  | 'GP' // Guadeloupe
  | 'MQ' // Martinique
  | 'GF' // Guyane
  | 'RE' // Réunion
  | 'YT' // Mayotte
  | 'PM' // Saint-Pierre-et-Miquelon
  | 'BL' // Saint-Barthélemy
  | 'MF' // Saint-Martin
  | 'WF' // Wallis-et-Futuna
  | 'PF' // Polynésie française
  | 'NC'; // Nouvelle-Calédonie

/**
 * Territory metadata
 */
export interface Territory {
  code: TerritoryCode;
  name: string;
  region: 'Antilles' | 'Océan Indien' | 'Pacifique' | 'Amérique' | 'Autre';
  active: boolean;
}

/**
 * Price data structure
 */
export interface Price {
  productId: string;
  productName: string;
  price: number;
  unit: string;
  territory: TerritoryCode;
  store: string;
  date: string; // ISO 8601
  source: 'official' | 'user' | 'api';
  verified: boolean;
}

/**
 * Product metadata
 */
export interface Product {
  id: string;
  name: string;
  category: string;
  brand?: string;
  unit: string;
  barcode?: string;
}

/**
 * Extension point: User preferences
 * Future use for personalization features
 */
export interface UserPreferences {
  defaultTerritory?: TerritoryCode;
  favoriteStores?: string[];
  watchedProducts?: string[];
  notificationsEnabled?: boolean;
}

/**
 * Extension point: Analytics event
 * Future use for extended analytics
 */
export interface AnalyticsEvent {
  eventType: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

/**
 * Extension point: API response wrapper
 * Future use for institutional API
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
  version: string;
}

/**
 * Extension point: Filter configuration
 * Future use for advanced filtering
 */
export interface FilterConfig {
  territories?: TerritoryCode[];
  categories?: string[];
  priceRange?: { min: number; max: number };
  dateRange?: { start: string; end: string };
  stores?: string[];
  verified?: boolean;
}

/**
 * Extension point: Export configuration
 * Future use for data export features
 */
export interface ExportConfig {
  format: 'csv' | 'json' | 'pdf';
  filters?: FilterConfig;
  includeMetadata?: boolean;
}

/**
 * Extension point: Alert configuration
 * Future use for custom alerts
 */
export interface AlertConfig {
  productId: string;
  territory: TerritoryCode;
  threshold: number;
  condition: 'above' | 'below' | 'change';
  enabled: boolean;
}
