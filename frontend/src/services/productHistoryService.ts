/**
 * Product History Service - v1.6.0
 * 
 * Manages product analysis history, reformulation tracking,
 * and temporal analysis
 * 
 * @module productHistoryService
 */

import { safeLocalStorage } from '../utils/safeLocalStorage';
import type {
  ProductHistoryRequest,
  ProductHistoryResponse,
  ProductAnalysisSnapshot,
  ReformulationEvent,
  ProductDossier,
} from '../types/productDossier';

/**
 * Load dossier from storage
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

/**
 * Get product analysis history
 */
export async function getProductHistory(
  request: ProductHistoryRequest
): Promise<ProductHistoryResponse> {
  const startTime = Date.now();
  
  try {
    // Load dossier
    const dossier = await loadDossierFromStorage(request.ean);
    
    if (!dossier) {
      return {
        success: false,
        error: 'Product not found',
        metadata: {
          processingTime: Date.now() - startTime,
          dataVersion: '1.6.0',
        },
      };
    }
    
    // Filter snapshots
    let snapshots = [...dossier.analysisHistory];
    let reformulations = [...dossier.reformulations];
    
    // Filter by territory
    if (request.territory) {
      snapshots = snapshots.filter(s => s.territory === request.territory);
      reformulations = reformulations.filter(r => r.territory === request.territory);
    }
    
    // Filter by date range
    if (request.startDate) {
      const startTimestamp = new Date(request.startDate).getTime();
      snapshots = snapshots.filter(s => new Date(s.timestamp).getTime() >= startTimestamp);
      reformulations = reformulations.filter(r => new Date(r.detectedAt).getTime() >= startTimestamp);
    }
    
    if (request.endDate) {
      const endTimestamp = new Date(request.endDate).getTime();
      snapshots = snapshots.filter(s => new Date(s.timestamp).getTime() <= endTimestamp);
      reformulations = reformulations.filter(r => new Date(r.detectedAt).getTime() <= endTimestamp);
    }
    
    // Filter significant only
    if (request.significantOnly) {
      snapshots = snapshots.filter(s => 
        s.differencesFromPrevious && 
        (s.differencesFromPrevious.significance === 'major' || 
         s.differencesFromPrevious.significance === 'moderate')
      );
    }
    
    // Apply limit
    const totalSnapshots = snapshots.length;
    if (request.limit) {
      snapshots = snapshots.slice(0, request.limit);
    }
    
    return {
      success: true,
      data: {
        ean: request.ean,
        snapshots,
        reformulations,
        totalSnapshots,
      },
      metadata: {
        processingTime: Date.now() - startTime,
        dataVersion: '1.6.0',
      },
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        processingTime: Date.now() - startTime,
        dataVersion: '1.6.0',
      },
    };
  }
}

/**
 * Get reformulation timeline for a product
 */
export async function getReformulationTimeline(
  ean: string,
  territory?: string
): Promise<ReformulationEvent[]> {
  const dossier = await loadDossierFromStorage(ean);
  
  if (!dossier) {
    return [];
  }
  
  let reformulations = dossier.reformulations;
  
  if (territory) {
    reformulations = reformulations.filter(r => r.territory === territory);
  }
  
  // Sort by detection date (newest first)
  return reformulations.sort((a, b) => 
    new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime()
  );
}

/**
 * Compare two specific snapshots
 */
export function compareSnapshots(
  snapshot1: ProductAnalysisSnapshot,
  snapshot2: ProductAnalysisSnapshot
): {
  ingredientChanges: string[];
  nutritionalChanges: string[];
  additiveChanges: string[];
} {
  const changes = {
    ingredientChanges: [] as string[],
    nutritionalChanges: [] as string[],
    additiveChanges: [] as string[],
  };
  
  // Compare ingredients
  const ing1 = new Set(snapshot1.ingredients.map(i => i.name.toLowerCase()));
  const ing2 = new Set(snapshot2.ingredients.map(i => i.name.toLowerCase()));
  
  for (const ing of snapshot2.ingredients) {
    if (!ing1.has(ing.name.toLowerCase())) {
      changes.ingredientChanges.push(`Ajouté: ${ing.name}`);
    }
  }
  
  for (const ing of snapshot1.ingredients) {
    if (!ing2.has(ing.name.toLowerCase())) {
      changes.ingredientChanges.push(`Retiré: ${ing.name}`);
    }
  }
  
  // Compare nutrition
  const nutritionKeys: (keyof typeof snapshot1.nutrition.per100g)[] = [
    'energyKcal', 'fats', 'saturatedFats', 'sugars', 'salt'
  ];
  
  for (const key of nutritionKeys) {
    const val1 = snapshot1.nutrition.per100g[key];
    const val2 = snapshot2.nutrition.per100g[key];
    
    if (val1 !== undefined && val2 !== undefined && val1 !== val2) {
      const change = val2 - val1;
      const pct = val1 !== 0 ? (change / val1 * 100).toFixed(1) : '∞';
      changes.nutritionalChanges.push(
        `${key}: ${val1} → ${val2} (${change > 0 ? '+' : ''}${pct}%)`
      );
    }
  }
  
  // Compare additives
  const add1 = new Set(snapshot1.additives.map(a => a.code));
  const add2 = new Set(snapshot2.additives.map(a => a.code));
  
  for (const add of snapshot2.additives) {
    if (!add1.has(add.code)) {
      changes.additiveChanges.push(`Ajouté: ${add.code}`);
    }
  }
  
  for (const add of snapshot1.additives) {
    if (!add2.has(add.code)) {
      changes.additiveChanges.push(`Retiré: ${add.code}`);
    }
  }
  
  return changes;
}

/**
 * Get evolution statistics for a product
 */
export async function getProductEvolution(
  ean: string,
  territory?: string
): Promise<{
  totalReformulations: number;
  averageTimeBetweenChanges: number;
  mostChangedAttribute: string;
  stabilityScore: number;
}> {
  const dossier = await loadDossierFromStorage(ean);
  
  if (!dossier) {
    return {
      totalReformulations: 0,
      averageTimeBetweenChanges: 0,
      mostChangedAttribute: 'none',
      stabilityScore: 1,
    };
  }
  
  let reformulations = dossier.reformulations;
  if (territory) {
    reformulations = reformulations.filter(r => r.territory === territory);
  }
  
  // Calculate average time between changes
  let totalTimeBetweenChanges = 0;
  if (reformulations.length > 1) {
    const sortedReformulations = reformulations.sort((a, b) => 
      new Date(a.detectedAt).getTime() - new Date(b.detectedAt).getTime()
    );
    
    for (let i = 1; i < sortedReformulations.length; i++) {
      const timeDiff = new Date(sortedReformulations[i].detectedAt).getTime() - 
                      new Date(sortedReformulations[i-1].detectedAt).getTime();
      totalTimeBetweenChanges += timeDiff;
    }
  }
  
  const averageTimeBetweenChanges = reformulations.length > 1
    ? totalTimeBetweenChanges / (reformulations.length - 1) / (1000 * 60 * 60 * 24) // days
    : 0;
  
  // Find most changed attribute
  const attributeChanges = {
    ingredients: 0,
    nutrition: 0,
    additives: 0,
  };
  
  for (const reform of reformulations) {
    if (reform.type === 'ingredient_change') attributeChanges.ingredients++;
    if (reform.type === 'nutritional_change') attributeChanges.nutrition++;
    if (reform.type === 'additive_change') attributeChanges.additives++;
    if (reform.type === 'comprehensive') {
      attributeChanges.ingredients++;
      attributeChanges.nutrition++;
      attributeChanges.additives++;
    }
  }
  
  const mostChangedAttribute = Object.entries(attributeChanges).reduce((a, b) => 
    b[1] > a[1] ? b : a
  )[0];
  
  // Calculate stability score (0-1, higher = more stable)
  const ageInDays = (Date.now() - new Date(dossier.firstSeen).getTime()) / (1000 * 60 * 60 * 24);
  const reformulationRate = ageInDays > 0 ? reformulations.length / (ageInDays / 365) : 0;
  const stabilityScore = Math.max(0, Math.min(1, 1 - (reformulationRate / 5)));
  
  return {
    totalReformulations: reformulations.length,
    averageTimeBetweenChanges,
    mostChangedAttribute,
    stabilityScore,
  };
}
