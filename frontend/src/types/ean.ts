/**
 * EAN Types and Status Definitions
 * Foundation for product identification and traceability
 */

/**
 * EAN Status - tracks product verification level
 */
export type EanStatus = 
  | 'confirmé'      // Product confirmed in database with full data
  | 'partiel'       // Product found but incomplete data
  | 'non_référencé'; // Valid EAN but product not in database

/**
 * Territory codes for DOM-TOM regions
 */
export type Territoire = 
  | 'guadeloupe'
  | 'martinique'
  | 'guyane'
  | 'reunion'
  | 'mayotte'
  | 'polynesie'
  | 'nouvelle_caledonie'
  | 'wallis_et_futuna'
  | 'saint_martin'
  | 'saint_barthelemy'
  | 'saint_pierre_et_miquelon';

/**
 * Data source types for traceability
 */
export type DataSource = 
  | 'observation_citoyenne'   // User-submitted observation
  | 'base_officielle'         // Official government data
  | 'partenaire_enseigne'     // Retail partner data
  | 'open_food_facts'         // Open Food Facts API
  | 'manuel';                 // Manual entry

/**
 * EAN Validation Result
 */
export interface EanValidationResult {
  valid: boolean;
  ean: string;
  format: 'EAN-8' | 'EAN-13' | 'UPC-A' | 'UPC-E' | null;
  checksum: boolean;
  error?: string;
}

/**
 * Product Traceability Metadata
 */
export interface ProductTraceability {
  source: DataSource;
  dateObservation: string; // ISO 8601 date string
  territoire: Territoire;
  magasin?: string;
  utilisateurId?: string; // Anonymous ID for citizen observations
}

/**
 * Base Product Information
 * Minimal data structure for unknown/partial EAN
 */
export interface BaseProduct {
  ean: string;
  status: EanStatus;
  nom?: string;
  marque?: string;
  categorie?: string;
  traceability: ProductTraceability;
}

/**
 * Complete Product Information
 * Full data structure for confirmed products
 */
export interface Product extends BaseProduct {
  status: 'confirmé';
  nom: string;
  marque: string;
  categorie: string;
  contenance?: string;
  prix?: number;
  devise?: string;
  imageUrl?: string;
  description?: string;
}

/**
 * Partial Product Information
 * Incomplete data - some fields missing
 */
export interface PartialProduct extends BaseProduct {
  status: 'partiel';
  nom: string; // At minimum, name must be known
}

/**
 * Non-Referenced Product
 * Valid EAN but not in database - fallback structure
 */
export interface NonReferencedProduct extends BaseProduct {
  status: 'non_référencé';
  nom: 'Produit non référencé';
}

/**
 * Union type for all product states
 */
export type ProductResult = Product | PartialProduct | NonReferencedProduct;
