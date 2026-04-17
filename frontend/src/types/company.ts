/**
 * Company Registry Types
 * Centralized data model for enterprise/company information
 *
 * This module provides institutional-grade types for managing company data
 * including SIRET, SIREN, VAT codes, and official business information.
 */

/**
 * Activity status of a company
 */
export type ActivityStatus = 'ACTIVE' | 'CEASED';

/**
 * Source of company data
 */
export type CompanyDataSource =
  | 'REGISTRE_ENTREPRISES' // Official business registry
  | 'API_PUBLIQUE' // Public API (e.g., INSEE, data.gouv.fr)
  | 'VALIDATION_INTERNE'; // Internal validation/verification

/**
 * Head office address information
 */
export interface HeadOffice {
  streetNumber?: string;
  streetName: string;
  city: string;
  department: string;
  postalCode: string;
  country: string;
}

/**
 * Geographic coordinates
 */
export interface GeoLocation {
  latitude: number;
  longitude: number;
}

/**
 * Complete company information
 *
 * This is the canonical data model for company information.
 * Compatible with relational databases, Firestore, and REST/GraphQL APIs.
 */
export interface Company {
  /** Unique internal identifier */
  id: string;

  // Official identifiers
  /** SIRET code - 14 digits - Identifies a specific establishment */
  siretCode?: string;

  /** SIREN code - 9 digits - Identifies the company (multiple SIRET per SIREN) */
  sirenCode?: string;

  /** VAT number (Numéro de TVA intracommunautaire) */
  vatCode?: string;

  // Identity
  /** Legal name of the company */
  legalName: string;

  /** Trade name / commercial name (optional alias) */
  tradeName?: string;

  // Legal status
  /** Current activity status */
  activityStatus: ActivityStatus;

  /** Creation date (ISO 8601: YYYY-MM-DD) */
  creationDate: string;

  /** Cessation date if CEASED (ISO 8601: YYYY-MM-DD) */
  cessationDate?: string;

  // Address
  /** Head office address */
  headOffice: HeadOffice;

  // Geolocation
  /** GPS coordinates */
  geoLocation: GeoLocation;

  // System metadata
  /** Last update timestamp (ISO 8601) */
  lastUpdate: string;

  /** Data source */
  source: CompanyDataSource;
}

/**
 * Validation result type
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Company lookup criteria
 * Used for searching/filtering companies
 */
export interface CompanyLookupCriteria {
  siretCode?: string;
  sirenCode?: string;
  vatCode?: string;
  internalId?: string;
  legalName?: string;
  territory?: string;
}
