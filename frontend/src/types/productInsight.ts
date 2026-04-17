/**
 * Product Insight Types - v1.5.0
 *
 * Complete data model for product analysis system
 * Based on observed data (photos, OCR, public sources)
 *
 * @module productInsight
 */

import type { TerritoryCode } from './extensions';

/**
 * Source reliability levels
 */
export type SourceReliability = 'low' | 'medium' | 'high';

/**
 * Ingredient role in formulation
 */
export type IngredientRole =
  | 'sweetener'
  | 'preservative'
  | 'flavor'
  | 'colorant'
  | 'base'
  | 'thickener'
  | 'emulsifier'
  | 'acidifier'
  | 'antioxidant'
  | 'other';

/**
 * Ingredient origin classification
 */
export type IngredientOrigin = 'vegetal' | 'animal' | 'synthetic' | 'mineral' | 'mixed';

/**
 * Frequency of ingredient in products
 */
export type IngredientFrequency = 'rare' | 'common' | 'very_common';

/**
 * Regulatory status
 */
export type RegulatoryStatus = 'authorized' | 'restricted' | 'banned' | 'under_review';

/**
 * Country code (ISO 3166-1 alpha-2)
 */
export type CountryCode =
  | 'FR' // France (including DOM)
  | 'EU' // European Union
  | 'US' // United States
  | 'CA' // Canada
  | 'GB' // United Kingdom
  | string; // Allow other country codes

/**
 * Density classification
 */
export type DensityLevel = 'low' | 'moderate' | 'high' | 'very_high';

/**
 * Source reference for data traceability
 */
export interface SourceReference {
  /** Source type */
  type: 'ocr' | 'openfoodfacts' | 'official_db' | 'research' | 'photo' | 'user_input';

  /** Source identifier or URL */
  reference: string;

  /** Date accessed or captured */
  accessedAt: string; // ISO 8601

  /** Confidence in source (0-1) */
  confidence?: number;

  /** Additional notes */
  notes?: string;
}

/**
 * Regulatory status by jurisdiction
 */
export interface RegulatoryInfo {
  /** EU regulatory status */
  EU: RegulatoryStatus;

  /** France specific notes */
  FR?: RegulatoryStatus;

  /** Additional notes */
  notes?: string;
}

/**
 * Individual ingredient analysis
 */
export interface IngredientInsight {
  /** Ingredient name */
  name: string;

  /** Functional role in product */
  role: IngredientRole;

  /** Origin classification */
  origin: IngredientOrigin;

  /** How common is this ingredient */
  frequencyInProducts: IngredientFrequency;

  /** Regulatory status */
  regulatoryStatus: RegulatoryInfo;

  /** Known effects (factual, sourced) */
  knownEffects?: string[];

  /** Additional technical notes */
  technicalNotes?: string;
}

/**
 * Allergen information
 */
export interface AllergenInsight {
  /** Allergen name */
  name: string;

  /** Presence type */
  presence: 'contains' | 'may_contain' | 'traces';

  /** Regulatory requirement to declare */
  mustDeclare: boolean;

  /** EU allergen list number */
  euAllergenNumber?: number;
}

/**
 * Additive and substance analysis
 */
export interface AdditiveInsight {
  /** Additive code (E-number or other) */
  code: string;

  /** Common name */
  name?: string;

  /** Function in product */
  function: string;

  /** Regulatory notes (factual status from official sources) */
  regulatoryNotes: string;

  /** Status by country */
  countriesStatus: Record<CountryCode, 'allowed' | 'restricted' | 'banned'>;

  /** Documented controversies with sources */
  documentedControversies?: SourceReference[];

  /** ADI (Acceptable Daily Intake) if available */
  acceptableDailyIntake?: {
    value: number;
    unit: string;
    source: string;
  };
}

/**
 * Nutritional values per 100g/100ml
 */
export interface NutritionPer100g {
  /** Energy in kJ */
  energyKj?: number;

  /** Energy in kcal */
  energyKcal: number;

  /** Total fats in g */
  fats: number;

  /** Saturated fats in g */
  saturatedFats: number;

  /** Carbohydrates in g */
  carbohydrates?: number;

  /** Sugars in g */
  sugars: number;

  /** Fiber in g */
  fiber?: number;

  /** Proteins in g */
  proteins?: number;

  /** Salt in g */
  salt: number;

  /** Sodium in g (derived from salt if needed) */
  sodium?: number;
}

/**
 * Nutritional interpretation
 */
export interface NutritionInterpretation {
  /** Sugar density level */
  sugarDensity: DensityLevel;

  /** Salt density level */
  saltDensity: DensityLevel;

  /** Caloric density level */
  caloricDensity: DensityLevel;

  /** Fat density level */
  fatDensity?: DensityLevel;

  /** Saturated fat density level */
  saturatedFatDensity?: DensityLevel;
}

/**
 * Comparison to category average
 */
export interface CategoryComparison {
  /** Category name */
  categoryName: string;

  /** Sugar difference in percentage */
  sugarsDeltaPct: number;

  /** Salt difference in percentage */
  saltDeltaPct: number;

  /** Calories difference in percentage */
  caloriesDeltaPct: number;

  /** Number of products in comparison sample */
  sampleSize: number;
}

/**
 * Complete nutrition insight
 */
export interface NutritionInsight {
  /** Nutritional values per 100g */
  per100g: NutritionPer100g;

  /** Interpretation of values */
  interpretation: NutritionInterpretation;

  /** Comparison to category average */
  comparisonToCategory?: CategoryComparison;
}

/**
 * Formulation analysis
 */
export interface FormulationInsight {
  /** Main ingredient categories */
  mainCategories: string[];

  /** Processing level */
  processingLevel: 'minimal' | 'processed' | 'ultra_processed';

  /** Number of ingredients */
  ingredientCount: number;

  /** Number of additives */
  additiveCount: number;

  /** Formulation notes */
  notes?: string[];
}

/**
 * Territory-specific variant
 */
export interface TerritoryVariant {
  /** Territory code */
  territory: TerritoryCode;

  /** Formulation differences detected */
  formulationDifferences: {
    /** Ingredients added in this territory */
    ingredientAdded?: string[];

    /** Ingredients removed in this territory */
    ingredientRemoved?: string[];

    /** Ingredients substituted */
    ingredientSubstituted?: Array<{
      from: string;
      to: string;
    }>;

    /** Nutritional changes */
    nutritionalChange?: Partial<NutritionPer100g>;
  };

  /** Sources for this variant */
  sources: SourceReference[];
}

/**
 * Confidence metrics for data quality
 */
export interface ConfidenceMetrics {
  /** OCR confidence (0-1) */
  ocrConfidence: number;

  /** Source reliability level */
  sourceReliability: SourceReliability;

  /** Cross-verification performed */
  crossVerification: boolean;

  /** Data completeness (0-1) */
  dataCompleteness?: number;

  /** Last verification date */
  lastVerified?: string; // ISO 8601
}

/**
 * Complete product insight data structure
 */
export interface ProductInsight {
  /** EAN/barcode (primary key) */
  ean: string;

  /** Product name */
  name?: string;

  /** Brand name */
  brand?: string;

  /** Product category */
  category?: string;

  /** Territory where observed */
  territory: TerritoryCode;

  /** Detailed ingredient analysis */
  ingredients: IngredientInsight[];

  /** Allergen information */
  allergens: AllergenInsight[];

  /** Additive analysis */
  additives: AdditiveInsight[];

  /** Nutritional insight */
  nutrition: NutritionInsight;

  /** Formulation analysis */
  formulationAnalysis: FormulationInsight;

  /** Comparisons and variations */
  comparisons: {
    /** Category average comparison */
    categoryAverage?: CategoryComparison;

    /** Territory-specific variants */
    territoryVariants?: TerritoryVariant[];
  };

  /** Confidence metrics */
  confidence: ConfidenceMetrics;

  /** Data sources */
  sources: SourceReference[];

  /** Generation timestamp */
  generatedAt: string; // ISO 8601

  /** Raw OCR data (for debugging/verification) */
  rawOcrData?: {
    ingredientsText?: string;
    nutritionText?: string;
    mentionsText?: string;
  };
}

/**
 * OCR extraction result from photo
 */
export interface OCRExtractionResult {
  /** Detected ingredients text */
  ingredientsText?: string;

  /** Detected nutrition table text */
  nutritionText?: string;

  /** Detected mentions (allergens, etc.) */
  mentionsText?: string;

  /** Overall OCR confidence (0-1) */
  confidence: number;

  /** Processing time in ms */
  processingTime: number;

  /** Errors encountered */
  errors?: string[];
}

/**
 * Photo input for analysis
 */
export interface ProductPhotoInput {
  /** Photo type */
  type: 'ingredients' | 'nutrition' | 'front' | 'receipt';

  /** Image data (base64 or blob) */
  imageData: string | Blob;

  /** Optional metadata */
  metadata?: {
    territory?: TerritoryCode;
    capturedAt?: string;
    deviceInfo?: string;
  };
}

/**
 * Analysis request
 */
export interface ProductAnalysisRequest {
  /** EAN code if known */
  ean?: string;

  /** Photos to analyze */
  photos: ProductPhotoInput[];

  /** Territory context */
  territory: TerritoryCode;

  /** Force re-analysis even if cached */
  forceRefresh?: boolean;
}

/**
 * Analysis response
 */
export interface ProductAnalysisResponse {
  /** Success status */
  success: boolean;

  /** Product insight data */
  data?: ProductInsight;

  /** Error message if failed */
  error?: string;

  /** Warnings */
  warnings?: string[];

  /** Processing metadata */
  metadata: {
    processingTime: number;
    cacheHit: boolean;
    dataVersion: string;
  };
}
