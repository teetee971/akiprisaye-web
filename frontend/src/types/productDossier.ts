/**
 * Product Dossier Types - v1.6.0
 *
 * Extended data model for persistent product tracking with history,
 * reformulation detection, and comparative analysis
 *
 * @module productDossier
 */

import type { TerritoryCode } from './extensions';
import type {
  ProductInsight,
  IngredientInsight,
  AdditiveInsight,
  NutritionInsight,
  NutritionPer100g,
  SourceReference,
} from './productInsight';

/**
 * Source type for product data
 */
export type ProductDataSource = 'label_scan' | 'ticket_scan' | 'public_db' | 'user_report' | 'api';

/**
 * Processing level classification
 */
export type ProcessingLevel = 'low' | 'moderate' | 'high' | 'ultra';

/**
 * Positioning relative to category
 */
export type CategoryPositioning = 'below_average' | 'average' | 'above_average';

/**
 * Territory-specific product snapshot
 */
export interface TerritoryProductSnapshot {
  /** Territory code */
  territory: TerritoryCode;

  /** Current product insight for this territory */
  current: ProductInsight;

  /** First time product was seen in this territory */
  firstSeen: string; // ISO 8601

  /** Last update in this territory */
  lastUpdated: string; // ISO 8601

  /** Number of observations */
  observationCount: number;

  /** Average confidence across observations */
  averageConfidence: number;
}

/**
 * Product delta - changes between analyses
 */
export interface ProductDelta {
  /** Timestamp of comparison */
  comparedAt: string; // ISO 8601

  /** Previous snapshot timestamp */
  previousTimestamp: string; // ISO 8601

  /** Current snapshot timestamp */
  currentTimestamp: string; // ISO 8601

  /** Ingredient changes */
  ingredientChanges?: {
    added: string[];
    removed: string[];
    modified: Array<{
      name: string;
      change: string;
    }>;
  };

  /** Nutritional changes */
  nutritionalChanges?: {
    [key in keyof NutritionPer100g]?: {
      previous: number;
      current: number;
      percentChange: number;
    };
  };

  /** Additive changes */
  additiveChanges?: {
    added: string[];
    removed: string[];
  };

  /** Significance level */
  significance: 'minor' | 'moderate' | 'major';

  /** Human-readable description */
  description: string;
}

/**
 * Historical product analysis snapshot
 */
export interface ProductAnalysisSnapshot {
  /** Unique snapshot ID */
  id: string;

  /** Timestamp of analysis */
  timestamp: string; // ISO 8601

  /** Territory where analyzed */
  territory: TerritoryCode;

  /** Source type */
  sourceType: ProductDataSource;

  /** Confidence score (0-1) */
  confidenceScore: number;

  /** Ingredients at this time */
  ingredients: IngredientInsight[];

  /** Nutrition at this time */
  nutrition: NutritionInsight;

  /** Additives at this time */
  additives: AdditiveInsight[];

  /** Differences from previous snapshot */
  differencesFromPrevious?: ProductDelta;

  /** Data sources */
  sources: SourceReference[];

  // Extended fields used by productPhotoAnalysisService
  productName?: string;
  brand?: string;
  images?: string[];
  allergens?: string[];
  nutriScore?: string;
  novaGroup?: number;
  ecoScore?: string;
  processingLevel?: string;
  origin?: string;
  labels?: string[];
  certifications?: string[];
}

/**
 * Transformation insight - processing level analysis
 */
export interface TransformationInsight {
  /** Overall processing level */
  processingLevel: ProcessingLevel;

  /** Indicators used for classification */
  indicators: {
    /** Total ingredient count */
    ingredientCount: number;

    /** Number of additives */
    additiveCount: number;

    /** Ratio of synthetic ingredients (0-1) */
    syntheticRatio: number;

    /** Number of ultra-processed markers */
    ultraProcessedMarkers: number;
  };

  /** Human-readable explanation */
  explanation: string;

  /** Classification criteria met */
  criteriaMatched: string[];

  /** Data sources */
  sources: SourceReference[];
}

/**
 * Category comparison insight
 */
export interface CategoryComparisonInsight {
  /** Category name */
  category: string;

  /** Number of products in sample */
  sampleSize: number;

  /** Last updated */
  lastUpdated: string; // ISO 8601

  /** Percentile positioning (0-100) */
  percentiles: {
    /** Sugar percentile */
    sugars: number;

    /** Salt percentile */
    salt: number;

    /** Calories percentile */
    calories: number;

    /** Fats percentile */
    fats?: number;

    /** Additives percentile */
    additives?: number;
  };

  /** Categorical positioning */
  positioning: {
    sugars: CategoryPositioning;
    salt: CategoryPositioning;
    calories: CategoryPositioning;
    fats?: CategoryPositioning;
    additives?: CategoryPositioning;
  };

  /** Category statistics */
  categoryStats: {
    sugars: { min: number; max: number; median: number; mean: number };
    salt: { min: number; max: number; median: number; mean: number };
    calories: { min: number; max: number; median: number; mean: number };
  };
}

/**
 * Data quality insight
 */
export interface DataQualityInsight {
  /** OCR reliability score (0-1) */
  ocrReliability: number;

  /** Cross-source consistency check passed */
  crossSourceConsistency: boolean;

  /** Number of observations used */
  sampleSize: number;

  /** Age of last observation in days */
  lastObservationAgeDays: number;

  /** Data completeness (0-1) */
  dataCompleteness: number;

  /** Verification status */
  verificationStatus: 'unverified' | 'user_verified' | 'cross_verified' | 'official';

  /** Warnings about data quality */
  warnings?: string[];

  /** Quality improvement options (factual, not prescriptive) */
  qualityNotes?: string[];
}

/**
 * Reformulation event
 */
export interface ReformulationEvent {
  /** Detected at timestamp */
  detectedAt: string; // ISO 8601

  /** Territory where detected */
  territory: TerritoryCode;

  /** Type of reformulation */
  type: 'ingredient_change' | 'nutritional_change' | 'additive_change' | 'comprehensive';

  /** Product delta */
  delta: ProductDelta;

  /** Is this a silent reformulation (no declaration) */
  isSilent: boolean;

  /** Observed changes (factual description, no evaluation) */
  observedChanges: {
    nutritional: 'increase' | 'decrease' | 'stable' | 'mixed';
    transparency: 'more_detailed' | 'less_detailed' | 'unchanged';
  };
}

/**
 * Complete product dossier
 */
export interface ProductDossier {
  /** EAN/barcode (primary key) */
  ean: string;

  /** Canonical product name */
  canonicalName: string;

  /** Brand name */
  brand: string;

  /** Product category */
  category: string;

  /** First time product was seen */
  firstSeen: string; // ISO 8601

  /** Last update timestamp */
  lastUpdated: string; // ISO 8601

  /** Alias for lastUpdated (legacy compat) */
  lastUpdate?: string;

  /** Total number of analyses */
  totalAnalyses: number;

  /** Product snapshots by territory */
  territories: TerritoryProductSnapshot[];

  /** Alias for territories (legacy compat) */
  territorySnapshots?: TerritoryProductSnapshot[];

  /** Complete analysis history */
  analysisHistory: ProductAnalysisSnapshot[];

  /** Detected reformulation events */
  reformulations: ReformulationEvent[];

  /** Transformation analysis */
  transformation: TransformationInsight;

  /** Category comparison */
  categoryComparison?: CategoryComparisonInsight;

  /** Data quality metrics */
  dataQuality: DataQualityInsight;

  /** Tags for categorization */
  tags?: string[];

  /** User flags (concerns, favorites, etc.) */
  userFlags?: {
    flagCount: number;
    concerns: string[];
  };
}

/**
 * Product dossier request
 */
export interface ProductDossierRequest {
  /** EAN to get dossier for */
  ean: string;

  /** Include full history */
  includeHistory?: boolean;

  /** Filter by territory */
  territory?: TerritoryCode;

  /** Maximum history items to return */
  maxHistoryItems?: number;
}

/**
 * Product dossier response
 */
export interface ProductDossierResponse {
  /** Success status */
  success: boolean;

  /** Product dossier */
  data?: ProductDossier;

  /** Error message if failed */
  error?: string;

  /** Processing metadata */
  metadata: {
    processingTime: number;
    cacheHit: boolean;
    dataVersion: string;
  };
}

/**
 * Category benchmark request
 */
export interface CategoryBenchmarkRequest {
  /** Category name */
  category: string;

  /** Territory filter */
  territory?: TerritoryCode;

  /** Minimum sample size required */
  minSampleSize?: number;
}

/**
 * Category benchmark response
 */
export interface CategoryBenchmarkResponse {
  /** Success status */
  success: boolean;

  /** Category statistics */
  data?: {
    category: string;
    sampleSize: number;
    lastUpdated: string;

    /** Statistical distributions */
    distributions: {
      sugars: { min: number; max: number; mean: number; median: number; stdDev: number };
      salt: { min: number; max: number; mean: number; median: number; stdDev: number };
      calories: { min: number; max: number; mean: number; median: number; stdDev: number };
      additives: { min: number; max: number; mean: number; median: number; stdDev: number };
    };

    /** Processing level distribution */
    processingLevels: {
      low: number;
      moderate: number;
      high: number;
      ultra: number;
    };
  };

  /** Error message if failed */
  error?: string;

  /** Processing metadata */
  metadata: {
    processingTime: number;
    dataVersion: string;
  };
}

/**
 * Product history request
 */
export interface ProductHistoryRequest {
  /** EAN to get history for */
  ean: string;

  /** Territory filter */
  territory?: TerritoryCode;

  /** Start date filter */
  startDate?: string; // ISO 8601

  /** End date filter */
  endDate?: string; // ISO 8601

  /** Include only significant changes */
  significantOnly?: boolean;

  /** Maximum results */
  limit?: number;
}

/**
 * Product history response
 */
export interface ProductHistoryResponse {
  /** Success status */
  success: boolean;

  /** Historical snapshots */
  data?: {
    ean: string;
    snapshots: ProductAnalysisSnapshot[];
    reformulations: ReformulationEvent[];
    totalSnapshots: number;
  };

  /** Error message if failed */
  error?: string;

  /** Processing metadata */
  metadata: {
    processingTime: number;
    dataVersion: string;
  };
}
