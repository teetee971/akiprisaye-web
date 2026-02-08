/**
 * Store Hours Service
 * 
 * Service for managing and retrieving store hours data
 * Provides sample hours for stores that don't have structured hours yet
 */

import { StoreHours, createSampleStoreHours } from '../utils/storeHoursUtils';
import { TERRITORIES } from '../constants/territories';

/**
 * Map of store IDs to their hours
 * This would ideally come from a database or API
 * For now, we generate sample hours based on territory timezone
 */
const storeHoursCache = new Map<string, StoreHours>();

/**
 * Get store hours by store ID
 * Returns sample hours if no specific hours are defined
 */
export function getStoreHours(storeId: string, territory?: string): StoreHours | null {
  // Check cache first
  if (storeHoursCache.has(storeId)) {
    return storeHoursCache.get(storeId)!;
  }

  // Generate sample hours based on territory timezone
  const territoryCode = territory?.toLowerCase() || 'gp';
  const territoryData = TERRITORIES[territoryCode as keyof typeof TERRITORIES];
  
  if (!territoryData) {
    return null;
  }

  const hours = createSampleStoreHours(storeId, territoryData.timezone);
  storeHoursCache.set(storeId, hours);
  
  return hours;
}

/**
 * Set store hours for a specific store
 * Used for testing or when loading hours from an API
 */
export function setStoreHours(storeId: string, hours: StoreHours): void {
  storeHoursCache.set(storeId, hours);
}

/**
 * Clear store hours cache
 */
export function clearStoreHoursCache(): void {
  storeHoursCache.clear();
}

/**
 * Get hours for multiple stores
 */
export function getBulkStoreHours(
  storeIds: string[],
  territory?: string
): Map<string, StoreHours> {
  const hoursMap = new Map<string, StoreHours>();
  
  storeIds.forEach(storeId => {
    const hours = getStoreHours(storeId, territory);
    if (hours) {
      hoursMap.set(storeId, hours);
    }
  });
  
  return hoursMap;
}

/**
 * Predefined hours for specific stores
 * These override the default sample hours
 */
export const PREDEFINED_STORE_HOURS: Record<string, Partial<StoreHours>> = {
  // Carrefour stores - typically open longer hours
  'carrefour_baie_mahault': {
    regularHours: {
      'lundi': [{ open: '08:30', close: '20:30' }],
      'mardi': [{ open: '08:30', close: '20:30' }],
      'mercredi': [{ open: '08:30', close: '20:30' }],
      'jeudi': [{ open: '08:30', close: '20:30' }],
      'vendredi': [{ open: '08:30', close: '20:30' }],
      'samedi': [{ open: '08:30', close: '20:30' }],
      'dimanche': [{ open: '09:00', close: '13:00' }],
    },
  },
  
  // E.Leclerc stores
  'leclerc_abymes': {
    regularHours: {
      'lundi': [{ open: '08:00', close: '20:00' }],
      'mardi': [{ open: '08:00', close: '20:00' }],
      'mercredi': [{ open: '08:00', close: '20:00' }],
      'jeudi': [{ open: '08:00', close: '20:00' }],
      'vendredi': [{ open: '08:00', close: '20:00' }],
      'samedi': [{ open: '08:00', close: '20:00' }],
      'dimanche': [{ open: '08:00', close: '13:00' }],
    },
  },
  
  // Leader Price - typically more limited hours
  'leader_price_pointe_pitre': {
    regularHours: {
      'lundi': [{ open: '07:00', close: '20:00' }],
      'mardi': [{ open: '07:00', close: '20:00' }],
      'mercredi': [{ open: '07:00', close: '20:00' }],
      'jeudi': [{ open: '07:00', close: '20:00' }],
      'vendredi': [{ open: '07:00', close: '20:00' }],
      'samedi': [{ open: '07:00', close: '20:00' }],
      'dimanche': [{ closed: true }],
    },
  },
  
  // Intermarché
  'intermarche_gosier': {
    regularHours: {
      'lundi': [{ open: '08:00', close: '19:30' }],
      'mardi': [{ open: '08:00', close: '19:30' }],
      'mercredi': [{ open: '08:00', close: '19:30' }],
      'jeudi': [{ open: '08:00', close: '19:30' }],
      'vendredi': [{ open: '08:00', close: '19:30' }],
      'samedi': [{ open: '08:00', close: '19:30' }],
      'dimanche': [{ closed: true }],
    },
  },
};

/**
 * Initialize predefined store hours on module load
 */
export function initializePredefinedHours(): void {
  Object.entries(PREDEFINED_STORE_HOURS).forEach(([storeId, hoursOverride]) => {
    // Get territory from store data (you might need to load this differently)
    const territory = 'gp'; // Default to Guadeloupe
    const territoryData = TERRITORIES[territory];
    
    const fullHours: StoreHours = {
      storeId,
      timezone: territoryData.timezone,
      regularHours: hoursOverride.regularHours || {},
      specialHours: hoursOverride.specialHours,
    };
    
    setStoreHours(storeId, fullHours);
  });
}

// Auto-initialize on import
initializePredefinedHours();
