 
/**
 * Product Dossier Service - v1.6.0
 * 
 * Manages persistent product dossiers with historical tracking,
 * reformulation detection, and comparative analysis
 * 
 * @module productDossierService
 */

import { safeLocalStorage } from '../utils/safeLocalStorage';
import type {
  ProductDossier,
  ProductDossierRequest,
  ProductDossierResponse,
  TerritoryProductSnapshot,
  ProductAnalysisSnapshot,
  TransformationInsight,
  CategoryComparisonInsight,
  DataQualityInsight,
  ReformulationEvent,
  ProductDelta,
  ProcessingLevel,
  CategoryPositioning,
  ProductDataSource,
} from '../types/productDossier';
import type {
  ProductInsight,
  IngredientInsight,
  AdditiveInsight,
  NutritionPer100g,
} from '../types/productInsight';
import type { TerritoryCode } from '../types/extensions';

/**
 * Get or create product dossier for an EAN
 */
export async function getProductDossier(
  request: ProductDossierRequest
): Promise<ProductDossierResponse> {
  const startTime = Date.now();
  
  try {
    // Try to load existing dossier
    let dossier = await loadDossierFromStorage(request.ean);
    
    if (!dossier) {
      // Create new dossier stub
      dossier = createNewDossier(request.ean);
    }
    
    // Filter by territory if requested
    if (request.territory) {
      dossier = filterDossierByTerritory(dossier, request.territory);
    }
    
    // Limit history if requested
    if (request.maxHistoryItems && dossier.analysisHistory.length > request.maxHistoryItems) {
      dossier.analysisHistory = dossier.analysisHistory.slice(0, request.maxHistoryItems);
    }
    
    // Don't include full history unless requested
    if (!request.includeHistory) {
      dossier.analysisHistory = [];
    }
    
    return {
      success: true,
      data: dossier,
      metadata: {
        processingTime: Date.now() - startTime,
        cacheHit: false,
        dataVersion: '1.6.0',
      },
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        processingTime: Date.now() - startTime,
        cacheHit: false,
        dataVersion: '1.6.0',
      },
    };
  }
}

/**
 * Add new product analysis to dossier
 */
export async function addAnalysisToDossier(
  ean: string,
  insight: ProductInsight,
  sourceType: ProductDataSource = 'label_scan'
): Promise<ProductDossier> {
  // Load or create dossier
  let dossier = await loadDossierFromStorage(ean);
  if (!dossier) {
    dossier = createNewDossier(ean);
    
    // Set initial product info from first insight
    if (insight.name) dossier.canonicalName = insight.name;
    if (insight.brand) dossier.brand = insight.brand;
    if (insight.category) dossier.category = insight.category;
  }
  
  // Create snapshot from insight
  const snapshot: ProductAnalysisSnapshot = {
    id: generateSnapshotId(),
    timestamp: new Date().toISOString(),
    territory: insight.territory,
    sourceType,
    confidenceScore: insight.confidence.ocrConfidence,
    ingredients: insight.ingredients,
    nutrition: insight.nutrition,
    additives: insight.additives,
    sources: insight.sources,
  };
  
  // Calculate delta from previous snapshot
  const previousSnapshot = findPreviousSnapshot(dossier, insight.territory);
  if (previousSnapshot) {
    snapshot.differencesFromPrevious = calculateProductDelta(previousSnapshot, snapshot);
    
    // Detect reformulation
    if (isSignificantReformulation(snapshot.differencesFromPrevious)) {
      const reformulation = createReformulationEvent(snapshot, snapshot.differencesFromPrevious);
      dossier.reformulations.push(reformulation);
    }
  }
  
  // Add snapshot to history
  dossier.analysisHistory.unshift(snapshot);
  dossier.totalAnalyses++;
  dossier.lastUpdated = new Date().toISOString();
  
  // Update or create territory snapshot
  updateTerritorySnapshot(dossier, insight);
  
  // Recalculate transformation insight
  dossier.transformation = calculateTransformationInsight(insight);
  
  // Recalculate data quality
  dossier.dataQuality = calculateDataQuality(dossier);
  
  // Save updated dossier
  await saveDossierToStorage(dossier);
  
  return dossier;
}

/**
 * Calculate transformation insight from product data
 */
export function calculateTransformationInsight(
  insight: ProductInsight
): TransformationInsight {
  const ingredientCount = insight.ingredients.length;
  const additiveCount = insight.additives.length;
  
  // Calculate synthetic ratio
  const syntheticIngredients = insight.ingredients.filter(
    ing => ing.origin === 'synthetic'
  ).length;
  const syntheticRatio = ingredientCount > 0 ? syntheticIngredients / ingredientCount : 0;
  
  // Count ultra-processed markers
  const ultraMarkers = countUltraProcessedMarkers(insight);
  
  // Determine processing level
  const processingLevel = classifyProcessingLevel(
    ingredientCount,
    additiveCount,
    syntheticRatio,
    ultraMarkers
  );
  
  // Generate explanation
  const explanation = generateProcessingExplanation(
    processingLevel,
    ingredientCount,
    additiveCount,
    ultraMarkers
  );
  
  // Identify criteria matched
  const criteriaMatched = identifyProcessingCriteria(
    processingLevel,
    ingredientCount,
    additiveCount,
    syntheticRatio,
    ultraMarkers
  );
  
  return {
    processingLevel,
    indicators: {
      ingredientCount,
      additiveCount,
      syntheticRatio,
      ultraProcessedMarkers: ultraMarkers,
    },
    explanation,
    criteriaMatched,
    sources: insight.sources,
  };
}

/**
 * Calculate category comparison insight
 */
export async function calculateCategoryComparison(
  ean: string,
  category: string,
  nutrition: NutritionPer100g,
  additiveCount: number,
  territory?: TerritoryCode
): Promise<CategoryComparisonInsight | undefined> {
  // In production, would query database for category statistics
  // For now, return mock data for demonstration
  
  // This would typically:
  // 1. Query all products in same category
  // 2. Filter by territory if specified
  // 3. Calculate statistics (min, max, mean, median, stdDev)
  // 4. Determine percentiles for this product
  // 5. Classify positioning (below/average/above)
  
  return undefined; // Stub for now
}

/**
 * Calculate data quality metrics
 */
export function calculateDataQuality(dossier: ProductDossier): DataQualityInsight {
  const recentSnapshots = dossier.analysisHistory.slice(0, 10);
  
  // Calculate average OCR reliability
  const avgOcrReliability = recentSnapshots.length > 0
    ? recentSnapshots.reduce((sum, s) => sum + s.confidenceScore, 0) / recentSnapshots.length
    : 0;
  
  // Check cross-source consistency
  const crossSourceConsistency = checkCrossSourceConsistency(recentSnapshots);
  
  // Calculate data completeness
  const dataCompleteness = calculateDossierCompleteness(dossier);
  
  // Calculate age of last observation
  const lastObservationAgeDays = dossier.analysisHistory.length > 0
    ? Math.floor(
        (Date.now() - new Date(dossier.analysisHistory[0].timestamp).getTime()) /
        (1000 * 60 * 60 * 24)
      )
    : 999;
  
  // Generate warnings
  const warnings: string[] = [];
  if (avgOcrReliability < 0.7) {
    warnings.push('Fiabilité OCR faible - vérification recommandée');
  }
  if (lastObservationAgeDays > 180) {
    warnings.push('Données anciennes - mise à jour recommandée');
  }
  if (dossier.analysisHistory.length < 3) {
    warnings.push('Peu d\'observations - fiabilité limitée');
  }
  
  // Generate quality notes (factual options, not prescriptive)
  const qualityNotes: string[] = [];
  if (dossier.analysisHistory.length < 5) {
    qualityNotes.push('Plus d\'observations disponibles en scannant à nouveau');
  }
  if (!crossSourceConsistency) {
    qualityNotes.push('Vérification par source alternative possible');
  }
  
  return {
    ocrReliability: avgOcrReliability,
    crossSourceConsistency,
    sampleSize: dossier.analysisHistory.length,
    lastObservationAgeDays,
    dataCompleteness,
    verificationStatus: determineVerificationStatus(dossier, crossSourceConsistency),
    warnings: warnings.length > 0 ? warnings : undefined,
    qualityNotes: qualityNotes.length > 0 ? qualityNotes : undefined,
  };
}

/**
 * Calculate delta between two snapshots
 */
export function calculateProductDelta(
  previous: ProductAnalysisSnapshot,
  current: ProductAnalysisSnapshot
): ProductDelta {
  const delta: ProductDelta = {
    comparedAt: new Date().toISOString(),
    previousTimestamp: previous.timestamp,
    currentTimestamp: current.timestamp,
    significance: 'minor',
    description: '',
  };
  
  // Compare ingredients
  const prevIngredients = new Set(previous.ingredients.map(i => i.name.toLowerCase()));
  const currIngredients = new Set(current.ingredients.map(i => i.name.toLowerCase()));
  
  const addedIngredients: string[] = [];
  const removedIngredients: string[] = [];
  
  for (const ing of current.ingredients) {
    if (!prevIngredients.has(ing.name.toLowerCase())) {
      addedIngredients.push(ing.name);
    }
  }
  
  for (const ing of previous.ingredients) {
    if (!currIngredients.has(ing.name.toLowerCase())) {
      removedIngredients.push(ing.name);
    }
  }
  
  if (addedIngredients.length > 0 || removedIngredients.length > 0) {
    delta.ingredientChanges = {
      added: addedIngredients,
      removed: removedIngredients,
      modified: [],
    };
  }
  
  // Compare nutrition
  const nutritionalChanges: any = {};
  let significantNutritionalChange = false;
  
  const nutritionKeys: (keyof NutritionPer100g)[] = [
    'energyKcal', 'fats', 'saturatedFats', 'sugars', 'salt'
  ];
  
  for (const key of nutritionKeys) {
    const prevValue = previous.nutrition.per100g[key];
    const currValue = current.nutrition.per100g[key];
    
    if (prevValue !== undefined && currValue !== undefined && prevValue !== currValue) {
      const percentChange = prevValue !== 0 
        ? ((currValue - prevValue) / prevValue) * 100 
        : 0;
      
      nutritionalChanges[key] = {
        previous: prevValue,
        current: currValue,
        percentChange,
      };
      
      // Significant if change > 10%
      if (Math.abs(percentChange) > 10) {
        significantNutritionalChange = true;
      }
    }
  }
  
  if (Object.keys(nutritionalChanges).length > 0) {
    delta.nutritionalChanges = nutritionalChanges;
  }
  
  // Compare additives
  const prevAdditives = new Set(previous.additives.map(a => a.code));
  const currAdditives = new Set(current.additives.map(a => a.code));
  
  const addedAdditives: string[] = [];
  const removedAdditives: string[] = [];
  
  for (const add of current.additives) {
    if (!prevAdditives.has(add.code)) {
      addedAdditives.push(add.code);
    }
  }
  
  for (const add of previous.additives) {
    if (!currAdditives.has(add.code)) {
      removedAdditives.push(add.code);
    }
  }
  
  if (addedAdditives.length > 0 || removedAdditives.length > 0) {
    delta.additiveChanges = {
      added: addedAdditives,
      removed: removedAdditives,
    };
  }
  
  // Determine significance
  if (
    (addedIngredients.length + removedIngredients.length > 3) ||
    significantNutritionalChange ||
    (addedAdditives.length + removedAdditives.length > 2)
  ) {
    delta.significance = 'major';
  } else if (
    (addedIngredients.length + removedIngredients.length > 0) ||
    Object.keys(nutritionalChanges).length > 0 ||
    (addedAdditives.length + removedAdditives.length > 0)
  ) {
    delta.significance = 'moderate';
  }
  
  // Generate description
  delta.description = generateDeltaDescription(delta);
  
  return delta;
}

/**
 * Helper functions
 */

function createNewDossier(ean: string): ProductDossier {
  return {
    ean,
    canonicalName: 'Produit inconnu',
    brand: 'Marque inconnue',
    category: 'Non classifié',
    firstSeen: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    totalAnalyses: 0,
    territories: [],
    analysisHistory: [],
    reformulations: [],
    transformation: {
      processingLevel: 'moderate',
      indicators: {
        ingredientCount: 0,
        additiveCount: 0,
        syntheticRatio: 0,
        ultraProcessedMarkers: 0,
      },
      explanation: 'Données insuffisantes',
      criteriaMatched: [],
      sources: [],
    },
    dataQuality: {
      ocrReliability: 0,
      crossSourceConsistency: false,
      sampleSize: 0,
      lastObservationAgeDays: 0,
      dataCompleteness: 0,
      verificationStatus: 'unverified',
    },
  };
}

function generateSnapshotId(): string {
  return `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function findPreviousSnapshot(
  dossier: ProductDossier,
  territory: TerritoryCode
): ProductAnalysisSnapshot | undefined {
  return dossier.analysisHistory.find(s => s.territory === territory);
}

function updateTerritorySnapshot(
  dossier: ProductDossier,
  insight: ProductInsight
): void {
  let territorySnapshot = dossier.territories.find(t => t.territory === insight.territory);
  
  if (!territorySnapshot) {
    territorySnapshot = {
      territory: insight.territory,
      current: insight,
      firstSeen: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      observationCount: 1,
      averageConfidence: insight.confidence.ocrConfidence,
    };
    dossier.territories.push(territorySnapshot);
  } else {
    // Update existing
    const totalConfidence = territorySnapshot.averageConfidence * territorySnapshot.observationCount;
    territorySnapshot.observationCount++;
    territorySnapshot.averageConfidence = 
      (totalConfidence + insight.confidence.ocrConfidence) / territorySnapshot.observationCount;
    territorySnapshot.current = insight;
    territorySnapshot.lastUpdated = new Date().toISOString();
  }
}

function countUltraProcessedMarkers(insight: ProductInsight): number {
  let markers = 0;
  
  // High additive count
  if (insight.additives.length > 5) markers++;
  
  // High ingredient count
  if (insight.ingredients.length > 15) markers++;
  
  // Multiple synthetic ingredients
  const syntheticCount = insight.ingredients.filter(i => i.origin === 'synthetic').length;
  if (syntheticCount > 3) markers++;
  
  // Multiple flavor enhancers
  const flavorCount = insight.ingredients.filter(i => i.role === 'flavor').length;
  if (flavorCount > 2) markers++;
  
  return markers;
}

function classifyProcessingLevel(
  ingredientCount: number,
  additiveCount: number,
  syntheticRatio: number,
  ultraMarkers: number
): ProcessingLevel {
  // Ultra-processed: multiple markers
  if (ultraMarkers >= 3) return 'ultra';
  if (additiveCount > 5 || ingredientCount > 15) return 'ultra';
  
  // High processing
  if (ultraMarkers >= 2 || additiveCount > 3 || syntheticRatio > 0.3) return 'high';
  
  // Moderate processing
  if (additiveCount > 0 || ingredientCount > 5) return 'moderate';
  
  // Low processing
  return 'low';
}

function generateProcessingExplanation(
  level: ProcessingLevel,
  ingredientCount: number,
  additiveCount: number,
  ultraMarkers: number
): string {
  switch (level) {
    case 'low':
      return `Produit peu transformé avec ${ingredientCount} ingrédient(s) et aucun additif.`;
    case 'moderate':
      return `Produit transformé avec ${ingredientCount} ingrédient(s) et ${additiveCount} additif(s).`;
    case 'high':
      return `Produit fortement transformé avec ${ingredientCount} ingrédient(s), ${additiveCount} additif(s), et ${ultraMarkers} marqueur(s) d'ultra-transformation.`;
    case 'ultra':
      return `Produit ultra-transformé avec ${ingredientCount} ingrédient(s), ${additiveCount} additif(s), et ${ultraMarkers} marqueur(s) d'ultra-transformation.`;
  }
}

function identifyProcessingCriteria(
  level: ProcessingLevel,
  ingredientCount: number,
  additiveCount: number,
  syntheticRatio: number,
  ultraMarkers: number
): string[] {
  const criteria: string[] = [];
  
  if (ingredientCount > 15) {
    criteria.push('Nombre élevé d\'ingrédients (> 15)');
  }
  if (additiveCount > 5) {
    criteria.push('Nombre élevé d\'additifs (> 5)');
  }
  if (syntheticRatio > 0.3) {
    criteria.push('Proportion élevée d\'ingrédients synthétiques');
  }
  if (ultraMarkers >= 3) {
    criteria.push('Multiples marqueurs d\'ultra-transformation');
  }
  
  return criteria;
}

function isSignificantReformulation(delta: ProductDelta): boolean {
  return delta.significance === 'major' || delta.significance === 'moderate';
}

function createReformulationEvent(
  snapshot: ProductAnalysisSnapshot,
  delta: ProductDelta
): ReformulationEvent {
  // Determine reformulation type
  let type: ReformulationEvent['type'] = 'comprehensive';
  if (delta.ingredientChanges && !delta.nutritionalChanges && !delta.additiveChanges) {
    type = 'ingredient_change';
  } else if (!delta.ingredientChanges && delta.nutritionalChanges && !delta.additiveChanges) {
    type = 'nutritional_change';
  } else if (!delta.ingredientChanges && !delta.nutritionalChanges && delta.additiveChanges) {
    type = 'additive_change';
  }
  
  // Describe observed changes (factual, no evaluation)
  const observedChanges = describeObservedChanges(delta);
  
  return {
    detectedAt: new Date().toISOString(),
    territory: snapshot.territory,
    type,
    delta,
    isSilent: true, // Assume silent unless proven otherwise
    observedChanges,
  };
}

function describeObservedChanges(delta: ProductDelta): ReformulationEvent['observedChanges'] {
  let nutritional: 'increase' | 'decrease' | 'stable' | 'mixed' = 'stable';
  
  if (delta.nutritionalChanges) {
    let increases = 0;
    let decreases = 0;
    
    // Check sugar change
    if (delta.nutritionalChanges.sugars) {
      if (delta.nutritionalChanges.sugars.percentChange < -5) decreases++;
      if (delta.nutritionalChanges.sugars.percentChange > 5) increases++;
    }
    
    // Check salt change
    if (delta.nutritionalChanges.salt) {
      if (delta.nutritionalChanges.salt.percentChange < -5) decreases++;
      if (delta.nutritionalChanges.salt.percentChange > 5) increases++;
    }
    
    if (increases > decreases) nutritional = 'increase';
    else if (decreases > increases) nutritional = 'decrease';
    else if (increases > 0 && decreases > 0) nutritional = 'mixed';
  }
  
  return {
    nutritional,
    transparency: 'unchanged',
  };
}

function generateDeltaDescription(delta: ProductDelta): string {
  const parts: string[] = [];
  
  if (delta.ingredientChanges) {
    if (delta.ingredientChanges.added.length > 0) {
      parts.push(`${delta.ingredientChanges.added.length} ingrédient(s) ajouté(s)`);
    }
    if (delta.ingredientChanges.removed.length > 0) {
      parts.push(`${delta.ingredientChanges.removed.length} ingrédient(s) retiré(s)`);
    }
  }
  
  if (delta.nutritionalChanges) {
    const changes = Object.keys(delta.nutritionalChanges).length;
    parts.push(`${changes} valeur(s) nutritionnelle(s) modifiée(s)`);
  }
  
  if (delta.additiveChanges) {
    if (delta.additiveChanges.added.length > 0) {
      parts.push(`${delta.additiveChanges.added.length} additif(s) ajouté(s)`);
    }
    if (delta.additiveChanges.removed.length > 0) {
      parts.push(`${delta.additiveChanges.removed.length} additif(s) retiré(s)`);
    }
  }
  
  return parts.length > 0 ? parts.join(', ') : 'Aucun changement détecté';
}

function checkCrossSourceConsistency(snapshots: ProductAnalysisSnapshot[]): boolean {
  // Check if we have multiple source types
  const sourceTypes = new Set(snapshots.map(s => s.sourceType));
  return sourceTypes.size > 1;
}

function calculateDossierCompleteness(dossier: ProductDossier): number {
  let score = 0;
  let maxScore = 0;
  
  // Has name (10%)
  maxScore += 10;
  if (dossier.canonicalName !== 'Produit inconnu') score += 10;
  
  // Has brand (10%)
  maxScore += 10;
  if (dossier.brand !== 'Marque inconnue') score += 10;
  
  // Has category (10%)
  maxScore += 10;
  if (dossier.category !== 'Non classifié') score += 10;
  
  // Has multiple observations (20%)
  maxScore += 20;
  score += Math.min(dossier.totalAnalyses * 5, 20);
  
  // Has territory data (20%)
  maxScore += 20;
  score += Math.min(dossier.territories.length * 10, 20);
  
  // Has reformulation data (15%)
  maxScore += 15;
  score += Math.min(dossier.reformulations.length * 5, 15);
  
  // Has category comparison (15%)
  maxScore += 15;
  if (dossier.categoryComparison) score += 15;
  
  return maxScore > 0 ? score / maxScore : 0;
}

function determineVerificationStatus(
  dossier: ProductDossier,
  crossSourceConsistency: boolean
): DataQualityInsight['verificationStatus'] {
  if (crossSourceConsistency && dossier.totalAnalyses >= 5) {
    return 'cross_verified';
  }
  if (dossier.totalAnalyses >= 3) {
    return 'user_verified';
  }
  return 'unverified';
}

function filterDossierByTerritory(
  dossier: ProductDossier,
  territory: TerritoryCode
): ProductDossier {
  return {
    ...dossier,
    territories: dossier.territories.filter(t => t.territory === territory),
    analysisHistory: dossier.analysisHistory.filter(s => s.territory === territory),
    reformulations: dossier.reformulations.filter(r => r.territory === territory),
  };
}

/**
 * Storage functions
 */

async function loadDossierFromStorage(ean: string): Promise<ProductDossier | null> {
  try {
    const key = `product_dossier_${ean}`;
    const data = safeLocalStorage.getItem(key);
    
    if (data) {
      return JSON.parse(data) as ProductDossier;
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Failed to load dossier:', error);
    }
  }
  
  return null;
}

async function saveDossierToStorage(dossier: ProductDossier): Promise<void> {
  try {
    const key = `product_dossier_${dossier.ean}`;
    safeLocalStorage.setItem(key, JSON.stringify(dossier));
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Failed to save dossier:', error);
    }
  }
}
