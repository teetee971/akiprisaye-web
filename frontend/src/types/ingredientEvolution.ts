/**
 * Ingredient Evolution Types - v1.7.0
 * 
 * Temporal comparison of multi-brand ingredient formulations
 * Factual change detection only - no interpretation or scoring
 * 
 * @module ingredientEvolution
 */

import type { TerritoryCode } from './extensions';

/**
 * Type of ingredient change detected
 */
export type IngredientChangeType =
  | 'added'        // Ingredient added to formulation
  | 'removed'      // Ingredient removed from formulation
  | 'moved'        // Ingredient position changed in list
  | 'renamed';     // Ingredient name changed (same substance)

/**
 * Single ingredient change event
 */
export interface IngredientChange {
  /** Type of change detected */
  type: IngredientChangeType;
  
  /** Ingredient name */
  ingredientName: string;
  
  /** Previous position in ingredient list (1-indexed, undefined if added) */
  previousPosition?: number;
  
  /** New position in ingredient list (1-indexed, undefined if removed) */
  newPosition?: number;
  
  /** Previous name (for renamed ingredients) */
  previousName?: string;
  
  /** Timestamp when change was detected */
  detectedAt: string; // ISO 8601
  
  /** Source references for this observation */
  sources: EvolutionSourceReference[];
}

/**
 * Evolution source reference for data traceability
 * Renamed to avoid conflict with productInsight.ts SourceReference
 */
export interface EvolutionSourceReference {
  /** Source type */
  type: 'label_scan' | 'ticket_scan' | 'public_db' | 'user_report';
  
  /** Source identifier */
  id: string;
  
  /** Observation date */
  observedAt: string; // ISO 8601
  
  /** Territory where observed */
  territory: TerritoryCode;
  
  /** Confidence score (0-1) */
  confidence: number;
}

/**
 * Formulation snapshot at a specific point in time
 */
export interface FormulationSnapshot {
  /** Snapshot unique identifier */
  id: string;
  
  /** Product EAN code */
  ean: string;
  
  /** Brand name */
  brand: string;
  
  /** Product name */
  productName: string;
  
  /** Territory */
  territory: TerritoryCode;
  
  /** Observation timestamp */
  timestamp: string; // ISO 8601
  
  /** Ordered list of ingredients */
  ingredients: string[];
  
  /** Source references */
  sources: EvolutionSourceReference[];
  
  /** Data quality indicator (0-1) */
  quality: number;
}

/**
 * Timeline entry for ingredient evolution
 */
export interface TimelineEntry {
  /** Entry unique identifier */
  id: string;
  
  /** Timestamp */
  timestamp: string; // ISO 8601
  
  /** Territory */
  territory: TerritoryCode;
  
  /** Brand */
  brand: string;
  
  /** Changes detected at this point */
  changes: IngredientChange[];
  
  /** Formulation snapshot at this time */
  snapshot: FormulationSnapshot;
}

/**
 * Multi-brand comparison result
 */
export interface MultiBrandComparison {
  /** Product category being compared */
  category: string;
  
  /** Brands included in comparison */
  brands: string[];
  
  /** Territories covered */
  territories: TerritoryCode[];
  
  /** Time range */
  timeRange: {
    start: string; // ISO 8601
    end: string;   // ISO 8601
  };
  
  /** Common ingredients across all brands */
  commonIngredients: string[];
  
  /** Brand-specific ingredients */
  brandSpecificIngredients: Record<string, string[]>;
  
  /** Change frequency by brand */
  changeFrequency: Record<string, number>;
  
  /** Total observations per brand */
  observationCount: Record<string, number>;
}

/**
 * Ingredient evolution request parameters
 */
export interface IngredientEvolutionRequest {
  /** Product EAN code(s) */
  ean: string | string[];
  
  /** Optional brand filter */
  brand?: string;
  
  /** Optional territory filter */
  territory?: TerritoryCode;
  
  /** Start date for analysis (ISO 8601) */
  startDate?: string;
  
  /** End date for analysis (ISO 8601) */
  endDate?: string;
  
  /** Include only significant changes */
  significantOnly?: boolean;
  
  /** Maximum number of timeline entries */
  limit?: number;
}

/**
 * Ingredient evolution response
 */
export interface IngredientEvolutionResponse {
  /** Success status */
  success: boolean;
  
  /** Evolution data (if successful) */
  data?: {
    /** Product EAN */
    ean: string;
    
    /** Brand */
    brand: string;
    
    /** Product name */
    productName: string;
    
    /** Ordered timeline of changes */
    timeline: TimelineEntry[];
    
    /** Total changes detected */
    totalChanges: number;
    
    /** Changes by type */
    changesByType: Record<IngredientChangeType, number>;
    
    /** Territories covered */
    territories: TerritoryCode[];
  };
  
  /** Error message (if failed) */
  error?: string;
  
  /** Metadata */
  metadata: {
    /** Processing time in milliseconds */
    processingTime: number;
    
    /** Data version */
    dataVersion: string;
    
    /** Number of sources analyzed */
    sourcesAnalyzed: number;
  };
}

/**
 * Multi-brand comparison request
 */
export interface MultiBrandComparisonRequest {
  /** Product category */
  category: string;
  
  /** List of brands to compare */
  brands: string[];
  
  /** Optional territory filter */
  territory?: TerritoryCode;
  
  /** Time range */
  timeRange: {
    start: string; // ISO 8601
    end: string;   // ISO 8601
  };
}

/**
 * Multi-brand comparison response
 */
export interface MultiBrandComparisonResponse {
  /** Success status */
  success: boolean;
  
  /** Comparison data (if successful) */
  data?: MultiBrandComparison;
  
  /** Error message (if failed) */
  error?: string;
  
  /** Metadata */
  metadata: {
    /** Processing time in milliseconds */
    processingTime: number;
    
    /** Data version */
    dataVersion: string;
  };
}

/**
 * Historical formulation query
 */
export interface HistoricalFormulationQuery {
  /** Product EAN */
  ean: string;
  
  /** Target date (ISO 8601) */
  date: string;
  
  /** Territory */
  territory?: TerritoryCode;
}

/**
 * Change detection statistics
 */
export interface ChangeDetectionStats {
  /** Total formulations analyzed */
  totalFormulations: number;
  
  /** Total changes detected */
  totalChanges: number;
  
  /** Changes by type */
  changesByType: Record<IngredientChangeType, number>;
  
  /** Average changes per formulation */
  averageChangesPerFormulation: number;
  
  /** Most stable products (fewest changes) */
  mostStable: Array<{
    ean: string;
    brand: string;
    changeCount: number;
  }>;
  
  /** Most volatile products (most changes) */
  mostVolatile: Array<{
    ean: string;
    brand: string;
    changeCount: number;
  }>;
}
