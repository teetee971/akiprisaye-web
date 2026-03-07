 
/**
 * Company Validation Utilities
 * 
 * Provides validation functions for company identifiers and data
 */

import type { Company, ValidationResult } from '../types/company';

/**
 * Validate SIRET code format (14 digits)
 * 
 * @param siret - SIRET code to validate
 * @returns true if valid, false otherwise
 */
export function isValidSiret(siret: string | undefined): boolean {
  if (!siret) return false;
  
  // Remove spaces and dashes
  const cleaned = siret.replace(/[\s-]/g, '');
  
  // Must be exactly 14 digits
  if (!/^\d{14}$/.test(cleaned)) {
    return false;
  }
  
  // Luhn algorithm validation (optional but recommended)
  return validateLuhn(cleaned);
}

/**
 * Validate SIREN code format (9 digits)
 * 
 * @param siren - SIREN code to validate
 * @returns true if valid, false otherwise
 */
export function isValidSiren(siren: string | undefined): boolean {
  if (!siren) return false;
  
  // Remove spaces and dashes
  const cleaned = siren.replace(/[\s-]/g, '');
  
  // Must be exactly 9 digits
  if (!/^\d{9}$/.test(cleaned)) {
    return false;
  }
  
  // Luhn algorithm validation
  return validateLuhn(cleaned);
}

/**
 * Validate French VAT code format
 * Format: FR + 2 characters (key) + 9 digits (SIREN)
 * The key can be 2 digits or contain letters for new format
 * 
 * @param vat - VAT code to validate
 * @returns true if valid, false otherwise
 */
export function isValidVat(vat: string | undefined): boolean {
  if (!vat) return false;
  
  // Remove spaces and dashes
  const cleaned = vat.replace(/[\s-]/g, '').toUpperCase();
  
  // Must match French VAT format: FR + 2 chars + 9 digits
  // Key can be numeric (old format) or alphanumeric (new format)
  const match = cleaned.match(/^FR([A-Z0-9]{2})(\d{9})$/);
  if (!match) {
    return false;
  }
  
  const key = match[1];
  const siren = match[2];
  
  // Validate SIREN part (basic format check)
  if (!/^\d{9}$/.test(siren)) {
    return false;
  }
  
  // For simplicity, we accept both old numeric and new alphanumeric keys
  // Real validation would require calculating the key based on SIREN
  // but this varies depending on company type and format
  return true;
}

/**
 * Extract SIREN from SIRET
 * SIRET = SIREN (9 digits) + NIC (5 digits)
 * 
 * @param siret - SIRET code
 * @returns SIREN code or null if invalid
 */
export function extractSirenFromSiret(siret: string): string | null {
  if (!isValidSiret(siret)) {
    return null;
  }
  
  const cleaned = siret.replace(/[\s-]/g, '');
  return cleaned.substring(0, 9);
}

/**
 * Extract SIREN from VAT code
 * 
 * @param vat - VAT code
 * @returns SIREN code or null if invalid
 */
export function extractSirenFromVat(vat: string): string | null {
  if (!isValidVat(vat)) {
    return null;
  }
  
  const cleaned = vat.replace(/[\s-]/g, '').toUpperCase();
  const match = cleaned.match(/^FR[A-Z0-9]{2}(\d{9})$/);
  return match ? match[1] : null;
}

/**
 * Normalize SIRET code (remove spaces/dashes)
 * 
 * @param siret - SIRET code
 * @returns normalized SIRET or null if invalid
 */
export function normalizeSiret(siret: string): string | null {
  if (!isValidSiret(siret)) {
    return null;
  }
  return siret.replace(/[\s-]/g, '');
}

/**
 * Normalize SIREN code (remove spaces/dashes)
 * 
 * @param siren - SIREN code
 * @returns normalized SIREN or null if invalid
 */
export function normalizeSiren(siren: string): string | null {
  if (!isValidSiren(siren)) {
    return null;
  }
  return siren.replace(/[\s-]/g, '');
}

/**
 * Normalize VAT code
 * 
 * @param vat - VAT code
 * @returns normalized VAT (uppercase, no spaces) or null if invalid
 */
export function normalizeVat(vat: string): string | null {
  if (!isValidVat(vat)) {
    return null;
  }
  return vat.replace(/[\s-]/g, '').toUpperCase();
}

/**
 * Validate complete company data
 * 
 * @param company - Company object to validate
 * @returns validation result with errors
 */
export function validateCompany(company: Partial<Company>): ValidationResult {
  const errors: string[] = [];
  
  // Required fields
  if (!company.id) {
    errors.push('ID is required');
  }
  
  if (!company.legalName) {
    errors.push('Legal name is required');
  }
  
  if (!company.creationDate) {
    errors.push('Creation date is required');
  } else if (!isValidISODate(company.creationDate)) {
    errors.push('Creation date must be in ISO 8601 format (YYYY-MM-DD)');
  }
  
  if (!company.activityStatus) {
    errors.push('Activity status is required');
  } else if (!['ACTIVE', 'CEASED'].includes(company.activityStatus)) {
    errors.push('Activity status must be ACTIVE or CEASED');
  }
  
  // Validate identifiers if present
  if (company.siretCode && !isValidSiret(company.siretCode)) {
    errors.push('Invalid SIRET code format');
  }
  
  if (company.sirenCode && !isValidSiren(company.sirenCode)) {
    errors.push('Invalid SIREN code format');
  }
  
  if (company.vatCode && !isValidVat(company.vatCode)) {
    errors.push('Invalid VAT code format');
  }
  
  // Validate SIRET/SIREN consistency
  if (company.siretCode && company.sirenCode) {
    const sirenFromSiret = extractSirenFromSiret(company.siretCode);
    const normalizedSiren = normalizeSiren(company.sirenCode);
    if (sirenFromSiret !== normalizedSiren) {
      errors.push('SIRET and SIREN codes are inconsistent');
    }
  }
  
  // Validate cessation date logic
  if (company.activityStatus === 'CEASED' && !company.cessationDate) {
    errors.push('Cessation date is required for CEASED companies');
  }
  
  if (company.cessationDate) {
    if (!isValidISODate(company.cessationDate)) {
      errors.push('Cessation date must be in ISO 8601 format (YYYY-MM-DD)');
    }
    if (company.activityStatus !== 'CEASED') {
      errors.push('Company with cessation date must have CEASED status');
    }
  }
  
  // Validate head office
  if (!company.headOffice) {
    errors.push('Head office information is required');
  } else {
    if (!company.headOffice.streetName) {
      errors.push('Head office street name is required');
    }
    if (!company.headOffice.city) {
      errors.push('Head office city is required');
    }
    if (!company.headOffice.department) {
      errors.push('Head office department is required');
    }
    if (!company.headOffice.postalCode) {
      errors.push('Head office postal code is required');
    }
    if (!company.headOffice.country) {
      errors.push('Head office country is required');
    }
  }
  
  // Validate geolocation
  if (!company.geoLocation) {
    errors.push('Geolocation is required');
  } else {
    if (typeof company.geoLocation.latitude !== 'number' ||
        company.geoLocation.latitude < -90 ||
        company.geoLocation.latitude > 90) {
      errors.push('Invalid latitude (must be between -90 and 90)');
    }
    if (typeof company.geoLocation.longitude !== 'number' ||
        company.geoLocation.longitude < -180 ||
        company.geoLocation.longitude > 180) {
      errors.push('Invalid longitude (must be between -180 and 180)');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Derive activity status from cessation date
 * Business rule: if cessationDate exists, status = CEASED, else ACTIVE
 * 
 * @param cessationDate - Cessation date or undefined
 * @returns ActivityStatus
 */
export function deriveActivityStatus(cessationDate?: string): 'ACTIVE' | 'CEASED' {
  return cessationDate ? 'CEASED' : 'ACTIVE';
}

/**
 * Luhn algorithm for validating French business codes
 * Used for SIRET and SIREN validation
 * 
 * @param code - Numeric code to validate
 * @returns true if valid
 */
function validateLuhn(code: string): boolean {
  let sum = 0;
  let double = false;
  
  // Process digits from right to left
  for (let i = code.length - 1; i >= 0; i--) {
    let digit = parseInt(code.charAt(i), 10);
    
    if (double) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    double = !double;
  }
  
  return sum % 10 === 0;
}

/**
 * Validate ISO 8601 date format (YYYY-MM-DD)
 * 
 * @param date - Date string to validate
 * @returns true if valid
 */
function isValidISODate(date: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(date)) {
    return false;
  }
  
  // Check if it's a valid date
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
}
