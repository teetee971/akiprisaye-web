/**
 * Store-Company Integration Service
 * 
 * Provides functions to link stores with their parent companies
 * and retrieve company information for stores.
 */

import type { Company } from '../types/company';
import { getCompanyById, registerCompany } from './companyRegistryService';
import { SEED_COMPANIES, getCompanyFromSeed } from '../data/seedCompanies';
import { SEED_STORES, getStoreById } from '../data/seedStores';

/**
 * Store with enriched company information
 */
export interface StoreWithCompany {
  // Store data
  id: string;
  name: string;
  chain: string;
  territory: string;
  city: string;
  address: string;
  postalCode: string;
  coordinates: {
    lat: number;
    lon: number;
  };
  phone?: string;
  openingHours?: string;
  services?: string[];
  
  // Company data (enriched)
  company?: Company;
  companyStatus?: 'ACTIVE' | 'CEASED';
  isCompanyActive?: boolean;
}

/**
 * Initialize Company Registry with seed data
 * This should be called at application startup
 */
export function initializeCompanyRegistry(): void {
  // In a real implementation, this would load from Firestore or API
  // For now, we use the seed data
  SEED_COMPANIES.forEach(company => {
    registerCompany(company);
  });
}

/**
 * Get company information for a store
 * 
 * @param storeId - Store ID
 * @returns Company or null if not found
 */
export function getCompanyForStore(storeId: string): Company | null {
  const store = getStoreById(storeId);
  if (!store || !store.companyId) {
    return null;
  }
  
  // Try to get from registry first
  let company = getCompanyById(store.companyId);
  
  // Fallback to seed data
  if (!company) {
    company = getCompanyFromSeed(store.companyId) || null;
  }
  
  return company;
}

/**
 * Get store with enriched company information
 * 
 * @param storeId - Store ID
 * @returns Store with company data or null
 */
export function getStoreWithCompany(storeId: string): StoreWithCompany | null {
  const store = getStoreById(storeId);
  if (!store) {
    return null;
  }
  
  const company = store.companyId ? getCompanyForStore(storeId) : undefined;
  
  return {
    ...store,
    company,
    companyStatus: company?.activityStatus,
    isCompanyActive: company?.activityStatus === 'ACTIVE',
  };
}

/**
 * Get all stores with company information
 * 
 * @returns Array of stores with company data
 */
export function getAllStoresWithCompanies(): StoreWithCompany[] {
  return SEED_STORES.map(store => {
    const company = store.companyId ? getCompanyForStore(store.id) : undefined;
    
    return {
      ...store,
      company,
      companyStatus: company?.activityStatus,
      isCompanyActive: company?.activityStatus === 'ACTIVE',
    };
  });
}

/**
 * Get stores by territory with company information
 * 
 * @param territory - Territory name
 * @returns Array of stores with company data
 */
export function getStoresByTerritoryWithCompanies(territory: string): StoreWithCompany[] {
  const stores = SEED_STORES.filter(s => 
    territory === 'all' || s.territory.toLowerCase() === territory.toLowerCase()
  );
  
  return stores.map(store => {
    const company = store.companyId ? getCompanyForStore(store.id) : undefined;
    
    return {
      ...store,
      company,
      companyStatus: company?.activityStatus,
      isCompanyActive: company?.activityStatus === 'ACTIVE',
    };
  });
}

/**
 * Check if a store's parent company is active
 * 
 * @param storeId - Store ID
 * @returns true if company is active, false if ceased, null if no company data
 */
export function isStoreCompanyActive(storeId: string): boolean | null {
  const company = getCompanyForStore(storeId);
  if (!company) {
    return null;
  }
  
  return company.activityStatus === 'ACTIVE';
}

/**
 * Get inactive company stores (for alerts)
 * Returns stores whose parent companies have CEASED status
 * 
 * @returns Array of stores with inactive companies
 */
export function getStoresWithInactiveCompanies(): StoreWithCompany[] {
  const allStores = getAllStoresWithCompanies();
  return allStores.filter(store => store.companyStatus === 'CEASED');
}

/**
 * Validate store-company consistency
 * Checks if all stores have valid company references
 * 
 * @returns Validation result with errors
 */
export function validateStoreCompanyLinks(): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  SEED_STORES.forEach(store => {
    if (!store.companyId) {
      warnings.push(`Store ${store.id} (${store.name}) has no company reference`);
      return;
    }
    
    const company = getCompanyFromSeed(store.companyId);
    if (!company) {
      errors.push(`Store ${store.id} references non-existent company: ${store.companyId}`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
