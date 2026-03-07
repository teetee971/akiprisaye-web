 
/**
 * Product Insight Service - v1.5.0
 * 
 * Complete product analysis system from photo labels
 * Provides ingredient analysis, nutritional interpretation,
 * and territorial variation detection
 * 
 * @module productInsightService
 */

import { safeLocalStorage } from '../utils/safeLocalStorage';
import type {
  ProductInsight,
  ProductAnalysisRequest,
  ProductAnalysisResponse,
  OCRExtractionResult,
  ProductPhotoInput,
  IngredientInsight,
  AdditiveInsight,
  NutritionInsight,
  NutritionPer100g,
  NutritionInterpretation,
  FormulationInsight,
  TerritoryVariant,
  SourceReference,
  ConfidenceMetrics,
  DensityLevel,
  CategoryComparison,
} from '../types/productInsight';
import type { TerritoryCode } from '../types/extensions';

/**
 * Tesseract.js for OCR
 * Note: Actual import would be: import Tesseract from 'tesseract.js';
 * For now, we'll handle gracefully if not available
 */

/**
 * Main entry point: Analyze product from photos
 */
export async function analyzeProduct(
  request: ProductAnalysisRequest
): Promise<ProductAnalysisResponse> {
  const startTime = Date.now();
  
  try {
    // Check cache first if not forcing refresh
    if (!request.forceRefresh && request.ean) {
      const cached = await getCachedInsight(request.ean, request.territory);
      if (cached) {
        return {
          success: true,
          data: cached,
          metadata: {
            processingTime: Date.now() - startTime,
            cacheHit: true,
            dataVersion: '1.5.0',
          },
        };
      }
    }
    
    // Step 1: OCR extraction from photos
    const ocrResults = await extractTextFromPhotos(request.photos);
    
    // Step 2: Structure and analyze ingredients
    const ingredients = await analyzeIngredients(ocrResults.ingredientsText || '');
    
    // Step 3: Identify and analyze additives
    const additives = await analyzeAdditives(ocrResults.ingredientsText || '');
    
    // Step 4: Extract and interpret nutrition
    const nutrition = await analyzeNutrition(
      ocrResults.nutritionText || '',
      request.ean
    );
    
    // Step 5: Formulation analysis
    const formulationAnalysis = analyzeFormulation(ingredients, additives);
    
    // Step 6: Detect territorial variations (if EAN available)
    const territoryVariants = request.ean
      ? await detectTerritorialVariations(request.ean, request.territory)
      : [];
    
    // Step 7: Build sources list
    const sources: SourceReference[] = [
      {
        type: 'ocr',
        reference: 'Photo labels',
        accessedAt: new Date().toISOString(),
        confidence: ocrResults.confidence,
      },
    ];
    
    // Step 8: Calculate confidence metrics
    const confidence: ConfidenceMetrics = {
      ocrConfidence: ocrResults.confidence,
      sourceReliability: ocrResults.confidence > 0.8 ? 'high' : 
                        ocrResults.confidence > 0.5 ? 'medium' : 'low',
      crossVerification: false, // Would be true if we verify against external DB
      dataCompleteness: calculateDataCompleteness(ingredients, nutrition),
    };
    
    // Build complete insight
    const insight: ProductInsight = {
      ean: request.ean || 'unknown',
      territory: request.territory,
      ingredients,
      allergens: [], // Extract from ingredients or mentions
      additives,
      nutrition,
      formulationAnalysis,
      comparisons: {
        territoryVariants: territoryVariants.length > 0 ? territoryVariants : undefined,
      },
      confidence,
      sources,
      generatedAt: new Date().toISOString(),
      rawOcrData: {
        ingredientsText: ocrResults.ingredientsText,
        nutritionText: ocrResults.nutritionText,
        mentionsText: ocrResults.mentionsText,
      },
    };
    
    // Cache the result
    if (request.ean) {
      await cacheInsight(request.ean, request.territory, insight);
    }
    
    return {
      success: true,
      data: insight,
      metadata: {
        processingTime: Date.now() - startTime,
        cacheHit: false,
        dataVersion: '1.5.0',
      },
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        processingTime: Date.now() - startTime,
        cacheHit: false,
        dataVersion: '1.5.0',
      },
    };
  }
}

/**
 * Extract text from photos using OCR
 */
async function extractTextFromPhotos(
  photos: ProductPhotoInput[]
): Promise<OCRExtractionResult> {
  const startTime = Date.now();
  const result: OCRExtractionResult = {
    confidence: 0,
    processingTime: 0,
  };
  
  try {
    // Check if Tesseract is available
    const hasTesseract = typeof window !== 'undefined' && 
                        (window as any).Tesseract !== undefined;
    
    if (!hasTesseract) {
      // Fallback: return empty result
      result.processingTime = Date.now() - startTime;
      result.confidence = 0;
      result.errors = ['OCR engine not available'];
      return result;
    }
    
    const Tesseract = (window as any).Tesseract;
    
    // Process each photo type
    for (const photo of photos) {
      try {
        const imageData = typeof photo.imageData === 'string' 
          ? photo.imageData 
          : URL.createObjectURL(photo.imageData);
        
        const { data } = await Tesseract.recognize(imageData, 'fra', {
          logger: (m: any) => {
            if (import.meta.env.DEV) {
              console.log('OCR progress:', m);
            }
          },
        });
        
        // Store text by type
        if (photo.type === 'ingredients') {
          result.ingredientsText = data.text;
        } else if (photo.type === 'nutrition') {
          result.nutritionText = data.text;
        } else if (photo.type === 'front') {
          result.mentionsText = data.text;
        }
        
        // Update confidence (average)
        result.confidence = (result.confidence + data.confidence) / 2;
        
      } catch (error) {
        if (!result.errors) result.errors = [];
        result.errors.push(`Failed to process ${photo.type}: ${error}`);
      }
    }
    
    result.processingTime = Date.now() - startTime;
    return result;
    
  } catch (error) {
    result.processingTime = Date.now() - startTime;
    result.errors = [error instanceof Error ? error.message : 'OCR failed'];
    return result;
  }
}

/**
 * Analyze and structure ingredients from OCR text
 */
async function analyzeIngredients(
  ingredientsText: string
): Promise<IngredientInsight[]> {
  if (!ingredientsText || ingredientsText.trim().length === 0) {
    return [];
  }
  
  // Parse ingredient list (simplified version)
  // Real implementation would use more sophisticated parsing
  const ingredientNames = parseIngredientList(ingredientsText);
  
  // Analyze each ingredient
  const insights: IngredientInsight[] = [];
  
  for (const name of ingredientNames) {
    const insight = await getIngredientInsight(name);
    if (insight) {
      insights.push(insight);
    }
  }
  
  return insights;
}

/**
 * Parse ingredient list text into individual ingredients
 */
function parseIngredientList(text: string): string[] {
  // Basic parsing: split by comma, clean up
  // Real implementation would handle percentages, sub-ingredients, etc.
  const ingredients = text
    .split(/,|\n/)
    .map(s => s.trim())
    .filter(s => s.length > 2)
    .map(s => {
      // Remove percentages and parentheses content
      return s.replace(/\([^)]*\)/g, '')
             .replace(/\d+\.?\d*%?/g, '')
             .trim();
    })
    .filter(s => s.length > 0);
  
  return ingredients;
}

/**
 * Get insight for a specific ingredient
 * In production, this would query a comprehensive database
 */
async function getIngredientInsight(
  name: string
): Promise<IngredientInsight | null> {
  // Normalize name
  const normalized = name.toLowerCase().trim();
  
  // Check against known ingredients database (simplified)
  const knownIngredients = getKnownIngredientsDatabase();
  
  const found = knownIngredients.find(ing => 
    ing.name.toLowerCase() === normalized ||
    ing.aliases?.some(alias => alias.toLowerCase() === normalized)
  );
  
  if (found) {
    return {
      name: found.name,
      role: found.role,
      origin: found.origin,
      frequencyInProducts: found.frequency,
      regulatoryStatus: {
        EU: 'authorized', // Default, would be from DB
        notes: found.regulatoryNotes,
      },
      knownEffects: found.knownEffects,
    };
  }
  
  // Unknown ingredient - return basic info
  return {
    name,
    role: 'other',
    origin: 'vegetal', // Conservative assumption
    frequencyInProducts: 'common',
    regulatoryStatus: {
      EU: 'authorized',
      notes: 'Information non disponible',
    },
  };
}

/**
 * Analyze additives from ingredient text
 */
async function analyzeAdditives(
  ingredientsText: string
): Promise<AdditiveInsight[]> {
  if (!ingredientsText) return [];
  
  const additives: AdditiveInsight[] = [];
  
  // Find E-numbers (E### pattern)
  const eNumberPattern = /E\s?(\d{3,4}[a-z]?)/gi;
  const matchArray = [...ingredientsText.matchAll(eNumberPattern)];
  
  for (const match of matchArray) {
    const code = match[0].replace(/\s/g, '').toUpperCase();
    const additiveInfo = getAdditiveInfo(code);
    
    if (additiveInfo) {
      additives.push(additiveInfo);
    }
  }
  
  return additives;
}

/**
 * Get additive information from database
 */
function getAdditiveInfo(code: string): AdditiveInsight | null {
  // Simplified database - real implementation would be comprehensive
  const additiveDb = getKnownAdditivesDatabase();
  
  const info = additiveDb[code];
  if (!info) {
    return {
      code,
      function: 'Information non disponible',
      regulatoryNotes: 'Additif identifié, vérification en cours',
      countriesStatus: {
        EU: 'allowed', // Conservative default
      },
    };
  }
  
  return info;
}

/**
 * Analyze nutrition from OCR text
 */
async function analyzeNutrition(
  nutritionText: string,
  ean?: string
): Promise<NutritionInsight> {
  // Parse nutrition table
  const nutritionData = parseNutritionTable(nutritionText);
  
  // Interpret values
  const interpretation = interpretNutrition(nutritionData);
  
  // Get category comparison if EAN available
  let categoryComparison = undefined;
  if (ean) {
    categoryComparison = await getCategoryComparison(ean, nutritionData);
  }
  
  return {
    per100g: nutritionData,
    interpretation,
    comparisonToCategory: categoryComparison,
  };
}

/**
 * Parse nutrition table from OCR text
 */
function parseNutritionTable(text: string): NutritionPer100g {
  // Simplified parsing - real implementation would be more robust
  const defaults: NutritionPer100g = {
    energyKcal: 0,
    fats: 0,
    saturatedFats: 0,
    sugars: 0,
    salt: 0,
  };
  
  if (!text) return defaults;
  
  // Extract values using regex patterns
  const extractValue = (pattern: RegExp): number => {
    const match = text.match(pattern);
    if (match && match[1]) {
      const value = parseFloat(match[1].replace(',', '.'));
      return isNaN(value) ? 0 : value;
    }
    return 0;
  };
  
  return {
    energyKcal: extractValue(/(\d+[.,]?\d*)\s*kcal/i),
    energyKj: extractValue(/(\d+[.,]?\d*)\s*kj/i),
    fats: extractValue(/(?:matières grasses|lipides|fats?)[\s:]*(\d+[.,]?\d*)\s*g/i),
    saturatedFats: extractValue(/(?:acides gras saturés|saturated)[\s:]*(\d+[.,]?\d*)\s*g/i),
    carbohydrates: extractValue(/(?:glucides|carbohydrates)[\s:]*(\d+[.,]?\d*)\s*g/i),
    sugars: extractValue(/(?:sucres|sugars)[\s:]*(\d+[.,]?\d*)\s*g/i),
    fiber: extractValue(/(?:fibres|fiber)[\s:]*(\d+[.,]?\d*)\s*g/i),
    proteins: extractValue(/(?:protéines|proteins)[\s:]*(\d+[.,]?\d*)\s*g/i),
    salt: extractValue(/(?:sel|salt)[\s:]*(\d+[.,]?\d*)\s*g/i),
  };
}

/**
 * Interpret nutrition values (no scoring, just explanatory levels)
 */
function interpretNutrition(
  nutrition: NutritionPer100g
): NutritionInterpretation {
  return {
    sugarDensity: classifySugarDensity(nutrition.sugars),
    saltDensity: classifySaltDensity(nutrition.salt),
    caloricDensity: classifyCaloricDensity(nutrition.energyKcal),
    fatDensity: classifyFatDensity(nutrition.fats),
    saturatedFatDensity: classifySaturatedFatDensity(nutrition.saturatedFats),
  };
}

/**
 * Classify sugar density
 */
function classifySugarDensity(sugars: number): DensityLevel {
  if (sugars < 5) return 'low';
  if (sugars < 12.5) return 'moderate';
  if (sugars < 25) return 'high';
  return 'very_high';
}

/**
 * Classify salt density
 */
function classifySaltDensity(salt: number): DensityLevel {
  if (salt < 0.3) return 'low';
  if (salt < 1.5) return 'moderate';
  if (salt < 3) return 'high';
  return 'very_high';
}

/**
 * Classify caloric density
 */
function classifyCaloricDensity(kcal: number): DensityLevel {
  if (kcal < 100) return 'low';
  if (kcal < 250) return 'moderate';
  if (kcal < 400) return 'high';
  return 'very_high';
}

/**
 * Classify fat density
 */
function classifyFatDensity(fats: number): DensityLevel {
  if (fats < 3) return 'low';
  if (fats < 10) return 'moderate';
  if (fats < 20) return 'high';
  return 'very_high';
}

/**
 * Classify saturated fat density
 */
function classifySaturatedFatDensity(saturatedFats: number): DensityLevel {
  if (saturatedFats < 1.5) return 'low';
  if (saturatedFats < 5) return 'moderate';
  if (saturatedFats < 10) return 'high';
  return 'very_high';
}

/**
 * Analyze formulation
 */
function analyzeFormulation(
  ingredients: IngredientInsight[],
  additives: AdditiveInsight[]
): FormulationInsight {
  // Determine main categories
  const categories = new Set<string>();
  for (const ing of ingredients) {
    if (ing.role === 'base') {
      if (ing.origin === 'vegetal') categories.add('végétal');
      if (ing.origin === 'animal') categories.add('animal');
    }
  }
  
  // Determine processing level
  let processingLevel: FormulationInsight['processingLevel'] = 'minimal';
  if (additives.length > 0) {
    processingLevel = 'processed';
  }
  if (additives.length > 5 || ingredients.length > 15) {
    processingLevel = 'ultra_processed';
  }
  
  return {
    mainCategories: Array.from(categories),
    processingLevel,
    ingredientCount: ingredients.length,
    additiveCount: additives.length,
  };
}

/**
 * Detect territorial variations for a product
 */
async function detectTerritorialVariations(
  ean: string,
  currentTerritory: TerritoryCode
): Promise<TerritoryVariant[]> {
  // In production, this would query a database of product variants
  // For now, return empty array
  // Real implementation would:
  // 1. Query products with same EAN in different territories
  // 2. Compare ingredient lists
  // 3. Compare nutritional values
  // 4. Document differences with sources
  
  return [];
}

/**
 * Get category comparison
 */
async function getCategoryComparison(
  ean: string,
  nutrition: NutritionPer100g
): Promise<CategoryComparison | undefined> {
  // In production, would query category averages
  // For now, return undefined
  return undefined;
}

/**
 * Calculate data completeness score
 */
function calculateDataCompleteness(
  ingredients: IngredientInsight[],
  nutrition: NutritionInsight
): number {
  let score = 0;
  let maxScore = 0;
  
  // Ingredients present (40%)
  maxScore += 40;
  if (ingredients.length > 0) {
    score += 40;
  }
  
  // Nutrition present (40%)
  maxScore += 40;
  if (nutrition.per100g.energyKcal > 0) {
    score += 20;
  }
  if (nutrition.per100g.sugars >= 0) {
    score += 10;
  }
  if (nutrition.per100g.salt >= 0) {
    score += 10;
  }
  
  // Additional data (20%)
  maxScore += 20;
  if (ingredients.some(ing => ing.knownEffects && ing.knownEffects.length > 0)) {
    score += 10;
  }
  if (nutrition.comparisonToCategory) {
    score += 10;
  }
  
  return maxScore > 0 ? score / maxScore : 0;
}

/**
 * Cache management
 */
async function getCachedInsight(
  ean: string,
  territory: TerritoryCode
): Promise<ProductInsight | null> {
  try {
    const key = `product_insight_${ean}_${territory}`;
    const cached = safeLocalStorage.getItem(key);
    
    if (cached) {
      const data = JSON.parse(cached);
      
      // Check if cache is still valid (24 hours)
      const generatedAt = new Date(data.generatedAt);
      const now = new Date();
      const hoursSinceGeneration = (now.getTime() - generatedAt.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceGeneration < 24) {
        return data as ProductInsight;
      }
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Failed to read cache:', error);
    }
  }
  
  return null;
}

async function cacheInsight(
  ean: string,
  territory: TerritoryCode,
  insight: ProductInsight
): Promise<void> {
  try {
    const key = `product_insight_${ean}_${territory}`;
    safeLocalStorage.setItem(key, JSON.stringify(insight));
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Failed to cache insight:', error);
    }
  }
}

/**
 * Known ingredients database (simplified)
 */
function getKnownIngredientsDatabase() {
  return [
    {
      name: 'Sucre',
      aliases: ['sugar', 'saccharose'],
      role: 'sweetener' as const,
      origin: 'vegetal' as const,
      frequency: 'very_common' as const,
      regulatoryNotes: 'Autorisé',
      knownEffects: ['Source de glucides', 'Apport énergétique'],
    },
    {
      name: 'Sel',
      aliases: ['salt', 'sodium chloride', 'chlorure de sodium'],
      role: 'preservative' as const,
      origin: 'mineral' as const,
      frequency: 'very_common' as const,
      regulatoryNotes: 'Autorisé',
      knownEffects: ['Exhausteur de goût', 'Conservateur'],
    },
    {
      name: 'Farine de blé',
      aliases: ['wheat flour', 'blé'],
      role: 'base' as const,
      origin: 'vegetal' as const,
      frequency: 'very_common' as const,
      regulatoryNotes: 'Autorisé',
      knownEffects: ['Base de nombreux produits céréaliers'],
    },
  ];
}

/**
 * Known additives database (simplified)
 */
function getKnownAdditivesDatabase(): Record<string, AdditiveInsight> {
  return {
    'E100': {
      code: 'E100',
      name: 'Curcumine',
      function: 'Colorant jaune',
      regulatoryNotes: 'Autorisé dans l\'UE',
      countriesStatus: {
        EU: 'allowed',
        FR: 'allowed',
      },
    },
    'E200': {
      code: 'E200',
      name: 'Acide sorbique',
      function: 'Conservateur',
      regulatoryNotes: 'Autorisé dans l\'UE',
      countriesStatus: {
        EU: 'allowed',
        FR: 'allowed',
      },
    },
    'E330': {
      code: 'E330',
      name: 'Acide citrique',
      function: 'Acidifiant',
      regulatoryNotes: 'Autorisé dans l\'UE',
      countriesStatus: {
        EU: 'allowed',
        FR: 'allowed',
      },
    },
  };
}

/**
 * Export helper functions for testing
 */
export {
  extractTextFromPhotos,
  analyzeIngredients,
  analyzeAdditives,
  analyzeNutrition,
  parseNutritionTable,
  interpretNutrition,
  classifySugarDensity,
  classifySaltDensity,
  classifyCaloricDensity,
  classifyFatDensity,
  classifySaturatedFatDensity,
  analyzeFormulation,
};
