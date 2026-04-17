/**
 * optimizationModes.ts — Shopping list optimization mode configurations
 *
 * Purpose: Define optimization strategies for smart shopping lists
 * Used by: SmartShoppingList component for route optimization
 *
 * @module optimizationModes
 */

export interface OptimizationMode {
  id: string;
  name: string;
  description: string;
  icon: string;
}

/**
 * Available optimization modes for shopping lists
 * Each mode balances price, distance, and convenience differently
 */
export const OPTIMIZATION_MODES: Record<string, OptimizationMode> = {
  CHEAPEST: {
    id: 'cheapest',
    name: 'MODE A — Prix le Plus Bas',
    description: 'Minimiser le coût total du panier (plusieurs magasins possibles)',
    icon: 'TrendingDown',
  },
  MINIMAL_DISTANCE: {
    id: 'minimal_distance',
    name: 'MODE B — Distance Minimale',
    description: 'Moins de magasins, trajet le plus court',
    icon: 'MapIcon',
  },
  BALANCED: {
    id: 'balanced',
    name: 'MODE C — Équilibré (RECOMMANDÉ)',
    description: "Score pondéré : Prix + Distance + Nombre d'arrêts",
    icon: 'Clock',
  },
  SINGLE_STORE: {
    id: 'single_store',
    name: 'MODE D — Magasin Unique',
    description: 'Panier le moins cher disponible dans un seul magasin',
    icon: 'ShoppingCart',
  },
} as const;

/**
 * Default optimization mode
 */
export const DEFAULT_OPTIMIZATION_MODE = 'balanced';

/**
 * Get optimization mode by ID
 */
export function getOptimizationMode(id: string): OptimizationMode | undefined {
  return Object.values(OPTIMIZATION_MODES).find((mode) => mode.id === id);
}

/**
 * Get all optimization mode IDs
 */
export function getAllOptimizationModeIds(): string[] {
  return Object.values(OPTIMIZATION_MODES).map((mode) => mode.id);
}

/**
 * Check if an optimization mode ID is valid
 */
export function isValidOptimizationMode(id: string): boolean {
  return getAllOptimizationModeIds().includes(id);
}
