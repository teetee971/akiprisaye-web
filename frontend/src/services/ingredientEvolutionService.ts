 
/**
 * Ingredient Evolution Service - v1.7.0
 * 
 * Temporal comparison of multi-brand ingredient formulations
 * Detects factual changes only - no interpretation or scoring
 * Read-only operations with multi-brand support
 * 
 * @module ingredientEvolutionService
 */

import { safeLocalStorage } from '../utils/safeLocalStorage';
import type {
  IngredientEvolutionRequest,
  IngredientEvolutionResponse,
  MultiBrandComparisonRequest,
  MultiBrandComparisonResponse,
  HistoricalFormulationQuery,
  FormulationSnapshot,
  TimelineEntry,
  IngredientChange,
  IngredientChangeType,
  ChangeDetectionStats,
} from '../types/ingredientEvolution';
import type { TerritoryCode } from '../types/extensions';

/**
 * Feature flag check
 */
function isFeatureEnabled(): boolean {
  return import.meta.env.VITE_FEATURE_INGREDIENT_EVOLUTION === 'true';
}

/**
 * Load formulation snapshots from storage
 */
async function loadFormulationSnapshots(ean: string): Promise<FormulationSnapshot[]> {
  try {
    const key = `formulation_history_${ean}`;
    const data = safeLocalStorage.getItem(key);
    
    if (data) {
      return JSON.parse(data) as FormulationSnapshot[];
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Failed to load formulation snapshots:', error);
    }
  }
  
  return [];
}

/**
 * Detect changes between two ingredient lists
 */
function detectChanges(
  previous: string[],
  current: string[],
  timestamp: string,
  sources: FormulationSnapshot['sources']
): IngredientChange[] {
  const changes: IngredientChange[] = [];
  
  // Normalize ingredient names for comparison
  const normalize = (name: string) => name.toLowerCase().trim();
  
  const prevNormalized = previous.map(normalize);
  const currNormalized = current.map(normalize);
  
  // Detect removed ingredients
  previous.forEach((ingredient, index) => {
    const normalized = normalize(ingredient);
    if (!currNormalized.includes(normalized)) {
      changes.push({
        type: 'removed',
        ingredientName: ingredient,
        previousPosition: index + 1,
        detectedAt: timestamp,
        sources,
      });
    }
  });
  
  // Detect added ingredients
  current.forEach((ingredient, index) => {
    const normalized = normalize(ingredient);
    if (!prevNormalized.includes(normalized)) {
      changes.push({
        type: 'added',
        ingredientName: ingredient,
        newPosition: index + 1,
        detectedAt: timestamp,
        sources,
      });
    }
  });
  
  // Detect moved ingredients (position changes)
  current.forEach((ingredient, currIndex) => {
    const normalized = normalize(ingredient);
    const prevIndex = prevNormalized.indexOf(normalized);
    
    if (prevIndex !== -1 && prevIndex !== currIndex) {
      changes.push({
        type: 'moved',
        ingredientName: ingredient,
        previousPosition: prevIndex + 1,
        newPosition: currIndex + 1,
        detectedAt: timestamp,
        sources,
      });
    }
  });
  
  return changes;
}

/**
 * Build timeline from formulation snapshots
 */
function buildTimeline(
  snapshots: FormulationSnapshot[],
  request: IngredientEvolutionRequest
): TimelineEntry[] {
  if (snapshots.length === 0) {
    return [];
  }
  
  // Sort snapshots by timestamp
  let sorted = [...snapshots].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  
  // Apply filters before building timeline to ensure correct previous snapshot reference
  // Filter by territory if specified
  if (request.territory) {
    sorted = sorted.filter(s => s.territory === request.territory);
  }
  
  // Filter by date range
  if (request.startDate) {
    const startTime = new Date(request.startDate).getTime();
    sorted = sorted.filter(s => new Date(s.timestamp).getTime() >= startTime);
  }
  if (request.endDate) {
    const endTime = new Date(request.endDate).getTime();
    sorted = sorted.filter(s => new Date(s.timestamp).getTime() <= endTime);
  }
  
  const timeline: TimelineEntry[] = [];
  
  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const previous = i > 0 ? sorted[i - 1] : null;
    
    // Detect changes from previous snapshot (now guaranteed to be same territory/date range)
    const changes = previous
      ? detectChanges(
          previous.ingredients,
          current.ingredients,
          current.timestamp,
          current.sources
        )
      : [];
    
    // Filter significant changes only if requested
    if (request.significantOnly && changes.length === 0) {
      continue;
    }
    
    timeline.push({
      id: current.id,
      timestamp: current.timestamp,
      territory: current.territory,
      brand: current.brand,
      changes,
      snapshot: current,
    });
  }
  
  // Apply limit if specified
  if (request.limit && timeline.length > request.limit) {
    return timeline.slice(-request.limit); // Return most recent entries
  }
  
  return timeline;
}

/**
 * Calculate change statistics by type
 */
function calculateChangeStats(timeline: TimelineEntry[]): Record<IngredientChangeType, number> {
  const stats: Record<IngredientChangeType, number> = {
    added: 0,
    removed: 0,
    moved: 0,
    renamed: 0,
  };
  
  for (const entry of timeline) {
    for (const change of entry.changes) {
      stats[change.type]++;
    }
  }
  
  return stats;
}

/**
 * Get ingredient evolution for a product
 */
export async function getIngredientEvolution(
  request: IngredientEvolutionRequest
): Promise<IngredientEvolutionResponse> {
  const startTime = Date.now();
  
  if (!isFeatureEnabled()) {
    return {
      success: false,
      error: 'Feature not enabled',
      metadata: {
        processingTime: Date.now() - startTime,
        dataVersion: '1.7.0',
        sourcesAnalyzed: 0,
      },
    };
  }
  
  try {
    // Handle single EAN only (multi-EAN for future enhancement)
    const ean = Array.isArray(request.ean) ? request.ean[0] : request.ean;
    
    // Load formulation snapshots
    const snapshots = await loadFormulationSnapshots(ean);
    
    if (snapshots.length === 0) {
      return {
        success: false,
        error: 'No formulation data found',
        metadata: {
          processingTime: Date.now() - startTime,
          dataVersion: '1.7.0',
          sourcesAnalyzed: 0,
        },
      };
    }
    
    // Filter by brand if specified
    let filteredSnapshots = snapshots;
    if (request.brand) {
      filteredSnapshots = snapshots.filter(s => 
        s.brand.toLowerCase() === request.brand!.toLowerCase()
      );
    }
    
    if (filteredSnapshots.length === 0) {
      return {
        success: false,
        error: 'No data for specified brand',
        metadata: {
          processingTime: Date.now() - startTime,
          dataVersion: '1.7.0',
          sourcesAnalyzed: 0,
        },
      };
    }
    
    // Sort filtered snapshots by timestamp to get most recent
    const sortedFiltered = [...filteredSnapshots].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    // Build timeline
    const timeline = buildTimeline(filteredSnapshots, request);
    
    // Calculate statistics
    const changesByType = calculateChangeStats(timeline);
    const totalChanges = Object.values(changesByType).reduce((sum, count) => sum + count, 0);
    
    // Get unique territories
    const territories = [...new Set(timeline.map(t => t.territory))];
    
    // Get product info from most recent snapshot (use sorted array with safety check)
    if (sortedFiltered.length === 0) {
      return {
        success: false,
        error: 'No data available after filtering',
        metadata: {
          processingTime: Date.now() - startTime,
          dataVersion: '1.7.0',
          sourcesAnalyzed: 0,
        },
      };
    }
    const mostRecent = sortedFiltered[sortedFiltered.length - 1];
    
    return {
      success: true,
      data: {
        ean,
        brand: mostRecent.brand,
        productName: mostRecent.productName,
        timeline,
        totalChanges,
        changesByType,
        territories,
      },
      metadata: {
        processingTime: Date.now() - startTime,
        dataVersion: '1.7.0',
        sourcesAnalyzed: filteredSnapshots.length,
      },
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        processingTime: Date.now() - startTime,
        dataVersion: '1.7.0',
        sourcesAnalyzed: 0,
      },
    };
  }
}

/**
 * Compare ingredients across multiple brands
 */
export async function compareMultiBrands(
  request: MultiBrandComparisonRequest
): Promise<MultiBrandComparisonResponse> {
  const startTime = Date.now();
  
  if (!isFeatureEnabled()) {
    return {
      success: false,
      error: 'Feature not enabled',
      metadata: {
        processingTime: Date.now() - startTime,
        dataVersion: '1.7.0',
      },
    };
  }
  
  try {
    // This is a simplified implementation
    // In production, this would query a database by category
    const brandData: Record<string, FormulationSnapshot[]> = {};
    
    // Collect all ingredients by brand
    const brandIngredients: Record<string, Set<string>> = {};
    const changeFrequency: Record<string, number> = {};
    const observationCount: Record<string, number> = {};
    
    for (const brand of request.brands) {
      brandIngredients[brand] = new Set();
      changeFrequency[brand] = 0;
      observationCount[brand] = 0;
    }
    
    // Find common ingredients
    const allIngredients = new Set<string>();
    for (const brand of request.brands) {
      const ingredients = brandIngredients[brand];
      for (const ing of ingredients) {
        allIngredients.add(ing);
      }
    }
    
    const commonIngredients: string[] = [];
    for (const ing of allIngredients) {
      const isPresentInAll = request.brands.every(brand => 
        brandIngredients[brand].has(ing)
      );
      if (isPresentInAll) {
        commonIngredients.push(ing);
      }
    }
    
    // Find brand-specific ingredients
    const brandSpecificIngredients: Record<string, string[]> = {};
    for (const brand of request.brands) {
      const specific: string[] = [];
      for (const ing of brandIngredients[brand]) {
        const isUnique = !request.brands.some(otherBrand => 
          otherBrand !== brand && brandIngredients[otherBrand].has(ing)
        );
        if (isUnique) {
          specific.push(ing);
        }
      }
      brandSpecificIngredients[brand] = specific;
    }
    
    return {
      success: true,
      data: {
        category: request.category,
        brands: request.brands,
        territories: request.territory ? [request.territory] : [],
        timeRange: request.timeRange,
        commonIngredients,
        brandSpecificIngredients,
        changeFrequency,
        observationCount,
      },
      metadata: {
        processingTime: Date.now() - startTime,
        dataVersion: '1.7.0',
      },
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        processingTime: Date.now() - startTime,
        dataVersion: '1.7.0',
      },
    };
  }
}

/**
 * Get historical formulation at a specific date
 */
export async function getHistoricalFormulation(
  query: HistoricalFormulationQuery
): Promise<FormulationSnapshot | null> {
  if (!isFeatureEnabled()) {
    return null;
  }
  
  try {
    const snapshots = await loadFormulationSnapshots(query.ean);
    
    if (snapshots.length === 0) {
      return null;
    }
    
    // Filter by territory if specified
    let filtered = snapshots;
    if (query.territory) {
      filtered = snapshots.filter(s => s.territory === query.territory);
    }
    
    if (filtered.length === 0) {
      return null;
    }
    
    // Find snapshot closest to target date (before or at the date)
    const targetTime = new Date(query.date).getTime();
    const sorted = [...filtered].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    // Find the last snapshot before or at target date
    let result: FormulationSnapshot | null = null;
    for (const snapshot of sorted) {
      const snapshotTime = new Date(snapshot.timestamp).getTime();
      if (snapshotTime <= targetTime) {
        result = snapshot;
      } else {
        break;
      }
    }
    
    return result;
    
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Failed to get historical formulation:', error);
    }
    return null;
  }
}

/**
 * Calculate change detection statistics across products
 */
export async function getChangeDetectionStats(
  eans: string[],
  territory?: TerritoryCode
): Promise<ChangeDetectionStats> {
  const stats: ChangeDetectionStats = {
    totalFormulations: 0,
    totalChanges: 0,
    changesByType: {
      added: 0,
      removed: 0,
      moved: 0,
      renamed: 0,
    },
    averageChangesPerFormulation: 0,
    mostStable: [],
    mostVolatile: [],
  };
  
  if (!isFeatureEnabled()) {
    return stats;
  }
  
  try {
    const productStats: Array<{
      ean: string;
      brand: string;
      changeCount: number;
    }> = [];
    
    for (const ean of eans) {
      const snapshots = await loadFormulationSnapshots(ean);
      
      if (snapshots.length === 0) {
        continue;
      }
      
      // Filter by territory if specified
      const filtered = territory
        ? snapshots.filter(s => s.territory === territory)
        : snapshots;
      
      if (filtered.length === 0) {
        continue;
      }
      
      stats.totalFormulations += filtered.length;
      
      // Build timeline and count changes
      const timeline = buildTimeline(filtered, { 
        ean,
        territory,
      });
      const changesByType = calculateChangeStats(timeline);
      const totalChanges = Object.values(changesByType).reduce((sum, count) => sum + count, 0);
      
      stats.totalChanges += totalChanges;
      stats.changesByType.added += changesByType.added;
      stats.changesByType.removed += changesByType.removed;
      stats.changesByType.moved += changesByType.moved;
      stats.changesByType.renamed += changesByType.renamed;
      
      // Track for most/least volatile
      if (filtered.length > 0) {
        productStats.push({
          ean,
          brand: filtered[0].brand,
          changeCount: totalChanges,
        });
      }
    }
    
    // Calculate average
    stats.averageChangesPerFormulation = stats.totalFormulations > 0
      ? stats.totalChanges / stats.totalFormulations
      : 0;
    
    // Sort by change count
    productStats.sort((a, b) => a.changeCount - b.changeCount);
    
    // Most stable (fewest changes)
    stats.mostStable = productStats.slice(0, 5);
    
    // Most volatile (most changes)
    stats.mostVolatile = productStats.slice(-5).reverse();
    
    return stats;
    
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Failed to calculate change detection stats:', error);
    }
    return stats;
  }
}

/**
 * Validate formulation snapshot quality
 */
export function validateSnapshotQuality(snapshot: FormulationSnapshot): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  // Check required fields
  if (!snapshot.ean) {
    issues.push('Missing EAN');
  }
  if (!snapshot.brand) {
    issues.push('Missing brand');
  }
  if (!snapshot.productName) {
    issues.push('Missing product name');
  }
  if (!snapshot.territory) {
    issues.push('Missing territory');
  }
  if (!snapshot.timestamp) {
    issues.push('Missing timestamp');
  }
  if (!Array.isArray(snapshot.ingredients) || snapshot.ingredients.length === 0) {
    issues.push('Missing or empty ingredients list');
  }
  if (!Array.isArray(snapshot.sources) || snapshot.sources.length === 0) {
    issues.push('Missing sources');
  }
  
  // Check data quality score
  if (snapshot.quality < 0 || snapshot.quality > 1) {
    issues.push('Invalid quality score (must be 0-1)');
  }
  
  // Check timestamp validity
  try {
    const time = new Date(snapshot.timestamp).getTime();
    if (isNaN(time)) {
      issues.push('Invalid timestamp format');
    }
  } catch {
    issues.push('Invalid timestamp');
  }
  
  return {
    isValid: issues.length === 0,
    issues,
  };
}
