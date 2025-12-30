/**
 * Company Registry Service
 * 
 * Centralized service for managing and accessing company data.
 * Supports lookup by any identifier: SIRET, SIREN, VAT, or internal ID.
 * 
 * Key principle: ONE identifier is enough to retrieve full company information.
 */

import type { Company, CompanyLookupCriteria } from '../types/company';
import {
  isValidSiret,
  isValidSiren,
  isValidVat,
  normalizeSiret,
  normalizeSiren,
  normalizeVat,
  extractSirenFromSiret,
  extractSirenFromVat,
} from '../utils/companyValidation';

/**
 * In-memory company registry
 * In production, this would be replaced with Firestore/database queries
 */
const companyRegistry: Map<string, Company> = new Map();

/**
 * Index by SIRET code for fast lookups
 */
const siretIndex: Map<string, string> = new Map(); // SIRET -> company ID

/**
 * Index by SIREN code for fast lookups
 * One SIREN can have multiple SIRET (establishments)
 */
const sirenIndex: Map<string, Set<string>> = new Map(); // SIREN -> Set of company IDs

/**
 * Index by VAT code for fast lookups
 */
const vatIndex: Map<string, string> = new Map(); // VAT -> company ID

/**
 * Register a company in the registry
 * Creates all necessary indexes for efficient lookups
 * 
 * @param company - Company to register
 */
export function registerCompany(company: Company): void {
  // Store in main registry
  companyRegistry.set(company.id, company);
  
  // Index by SIRET
  if (company.siretCode) {
    const normalizedSiret = normalizeSiret(company.siretCode);
    if (normalizedSiret) {
      siretIndex.set(normalizedSiret, company.id);
    }
  }
  
  // Index by SIREN
  if (company.sirenCode) {
    const normalizedSiren = normalizeSiren(company.sirenCode);
    if (normalizedSiren) {
      if (!sirenIndex.has(normalizedSiren)) {
        sirenIndex.set(normalizedSiren, new Set());
      }
      sirenIndex.get(normalizedSiren)!.add(company.id);
    }
  }
  
  // Index by VAT
  if (company.vatCode) {
    const normalizedVat = normalizeVat(company.vatCode);
    if (normalizedVat) {
      vatIndex.set(normalizedVat, company.id);
    }
  }
}

/**
 * Lookup company by SIRET code
 * 
 * @param siretCode - 14-digit SIRET code
 * @returns Company or null if not found
 */
export function getCompanyBySiret(siretCode: string): Company | null {
  if (!isValidSiret(siretCode)) {
    return null;
  }
  
  const normalized = normalizeSiret(siretCode);
  if (!normalized) {
    return null;
  }
  
  const companyId = siretIndex.get(normalized);
  if (!companyId) {
    return null;
  }
  
  return companyRegistry.get(companyId) || null;
}

/**
 * Lookup companies by SIREN code
 * Returns all establishments (SIRET) for this SIREN
 * 
 * @param sirenCode - 9-digit SIREN code
 * @returns Array of companies (can be multiple establishments)
 */
export function getCompaniesBySiren(sirenCode: string): Company[] {
  if (!isValidSiren(sirenCode)) {
    return [];
  }
  
  const normalized = normalizeSiren(sirenCode);
  if (!normalized) {
    return [];
  }
  
  const companyIds = sirenIndex.get(normalized);
  if (!companyIds) {
    return [];
  }
  
  const companies: Company[] = [];
  for (const id of companyIds) {
    const company = companyRegistry.get(id);
    if (company) {
      companies.push(company);
    }
  }
  
  return companies;
}

/**
 * Lookup company by VAT code
 * 
 * @param vatCode - French VAT code (FR + 2 digits + 9 digits)
 * @returns Company or null if not found
 */
export function getCompanyByVat(vatCode: string): Company | null {
  if (!isValidVat(vatCode)) {
    return null;
  }
  
  const normalized = normalizeVat(vatCode);
  if (!normalized) {
    return null;
  }
  
  const companyId = vatIndex.get(normalized);
  if (!companyId) {
    return null;
  }
  
  return companyRegistry.get(companyId) || null;
}

/**
 * Lookup company by internal ID
 * 
 * @param id - Internal company ID
 * @returns Company or null if not found
 */
export function getCompanyById(id: string): Company | null {
  return companyRegistry.get(id) || null;
}

/**
 * Unified company lookup
 * Accepts ANY single identifier and returns company information
 * 
 * This is the main entry point for company lookups as per requirements:
 * "Un seul identifiant suffit pour reconstituer toute la fiche entreprise"
 * 
 * @param identifier - SIRET, SIREN, VAT, or internal ID
 * @returns Company or null if not found
 */
export function getCompany(identifier: string): Company | null {
  if (!identifier) {
    return null;
  }
  
  // Try direct ID lookup first (fastest)
  let company = getCompanyById(identifier);
  if (company) {
    return company;
  }
  
  // Try SIRET lookup
  if (isValidSiret(identifier)) {
    company = getCompanyBySiret(identifier);
    if (company) {
      return company;
    }
  }
  
  // Try SIREN lookup (returns first establishment if multiple)
  if (isValidSiren(identifier)) {
    const companies = getCompaniesBySiren(identifier);
    if (companies.length > 0) {
      // Return headquarters if available, otherwise first establishment
      const hq = companies.find(c => c.siretCode?.endsWith('00001'));
      return hq || companies[0];
    }
  }
  
  // Try VAT lookup
  if (isValidVat(identifier)) {
    company = getCompanyByVat(identifier);
    if (company) {
      return company;
    }
  }
  
  return null;
}

/**
 * Search companies by criteria
 * 
 * @param criteria - Search criteria
 * @returns Array of matching companies
 */
export function searchCompanies(criteria: CompanyLookupCriteria): Company[] {
  const results: Company[] = [];
  
  // If specific ID provided, use direct lookup
  if (criteria.internalId) {
    const company = getCompanyById(criteria.internalId);
    if (company) {
      results.push(company);
    }
    return results;
  }
  
  // If SIRET provided
  if (criteria.siretCode) {
    const company = getCompanyBySiret(criteria.siretCode);
    if (company) {
      results.push(company);
    }
    return results;
  }
  
  // If SIREN provided
  if (criteria.sirenCode) {
    return getCompaniesBySiren(criteria.sirenCode);
  }
  
  // If VAT provided
  if (criteria.vatCode) {
    const company = getCompanyByVat(criteria.vatCode);
    if (company) {
      results.push(company);
    }
    return results;
  }
  
  // Search by name or territory
  for (const company of companyRegistry.values()) {
    let match = true;
    
    if (criteria.legalName) {
      const searchTerm = criteria.legalName.toLowerCase();
      const legalName = company.legalName.toLowerCase();
      const tradeName = company.tradeName?.toLowerCase() || '';
      match = match && (legalName.includes(searchTerm) || tradeName.includes(searchTerm));
    }
    
    if (criteria.territory && match) {
      // Assuming territory can be derived from department or postal code
      match = match && (
        company.headOffice.department.toLowerCase().includes(criteria.territory.toLowerCase()) ||
        company.headOffice.city.toLowerCase().includes(criteria.territory.toLowerCase())
      );
    }
    
    if (match) {
      results.push(company);
    }
  }
  
  return results;
}

/**
 * Get all registered companies
 * 
 * @returns Array of all companies
 */
export function getAllCompanies(): Company[] {
  return Array.from(companyRegistry.values());
}

/**
 * Clear all company data (useful for testing)
 */
export function clearCompanyRegistry(): void {
  companyRegistry.clear();
  siretIndex.clear();
  sirenIndex.clear();
  vatIndex.clear();
}

/**
 * Get company count
 * 
 * @returns Total number of registered companies
 */
export function getCompanyCount(): number {
  return companyRegistry.size;
}

/**
 * Check if a company is active
 * 
 * @param company - Company to check
 * @returns true if active, false if ceased
 */
export function isCompanyActive(company: Company): boolean {
  return company.activityStatus === 'ACTIVE';
}

/**
 * Get all establishments for a SIREN
 * Same as getCompaniesBySiren but with clearer name
 * 
 * @param sirenCode - SIREN code
 * @returns Array of establishments
 */
export function getEstablishments(sirenCode: string): Company[] {
  return getCompaniesBySiren(sirenCode);
}

/**
 * Get headquarters for a SIREN
 * The headquarters is the establishment with NIC = 00001
 * 
 * @param sirenCode - SIREN code
 * @returns Headquarters company or null
 */
export function getHeadquarters(sirenCode: string): Company | null {
  const establishments = getCompaniesBySiren(sirenCode);
  return establishments.find(c => c.siretCode?.endsWith('00001')) || null;
}
