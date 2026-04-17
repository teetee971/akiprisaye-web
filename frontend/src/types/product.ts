/**
 * Product Data Model - v1.1.0
 *
 * Unified product model for automatic price display
 * with photos and detailed information
 *
 * @module productModel
 */

import type { TerritoryCode } from './extensions';

/**
 * Price source type
 */
export type PriceSource = 'api' | 'user' | 'historical' | 'estimated';

/**
 * Product category types
 */
export type ProductCategory =
  | 'alimentaire'
  | 'boissons'
  | 'hygiene'
  | 'entretien'
  | 'bebe'
  | 'viande'
  | 'poisson'
  | 'fruits-legumes'
  | 'pain-patisserie'
  | 'produits-laitiers'
  | 'epicerie'
  | 'surgeles'
  | 'autre';

/**
 * Unit types for products
 */
export type Unit = 'g' | 'kg' | 'ml' | 'L' | 'unité';

/**
 * Reliability score (0-100)
 * 100 = official source, recent
 * 50-99 = user reported, verified
 * 0-49 = estimated, old data
 */
export type ReliabilityScore = number;

/**
 * Photo metadata
 */
export interface ProductPhoto {
  id: string;
  url: string;
  thumbnailUrl?: string;
  uploadedAt: string; // ISO 8601
  uploadedBy?: string;
  isMain: boolean;
}

/**
 * Price change indicator
 */
export interface PriceChange {
  trend: 'up' | 'down' | 'stable';
  percentage: number;
  previousPrice: number;
  previousDate: string;
}

/**
 * Complete product model
 */
export interface Product {
  /** Unique product identifier */
  id: string;

  /** Product name */
  nom: string;

  /** Brand name */
  marque?: string;

  /** Product category */
  categorie: ProductCategory;

  /** Content amount (e.g., 500 for 500g) */
  contenance: number;

  /** Content unit */
  unite: Unit;

  /** Unit price (actual retail price) */
  prix_unitaire: number;

  /** Price per kg or liter for comparison */
  prix_au_kilo_ou_litre: number;

  /** Store/chain name */
  enseigne: string;

  /** Territory code */
  territoire: TerritoryCode;

  /** Date of price observation */
  date_releve: string; // ISO 8601

  /** Price data source */
  source_prix: PriceSource;

  /** Reliability score (0-100) */
  fiabilite_score: ReliabilityScore;

  /** Product photos */
  photos: ProductPhoto[];

  /** Price change information */
  price_change?: PriceChange;

  /** Barcode if available */
  barcode?: string;

  /** Additional metadata */
  metadata?: {
    verified: boolean;
    lastUpdated: string;
    updateCount: number;
  };
}

/**
 * Product search/filter parameters
 */
export interface ProductSearchParams {
  query?: string;
  categorie?: ProductCategory;
  territoire?: TerritoryCode;
  enseigne?: string;
  priceMin?: number;
  priceMax?: number;
  sortBy?: 'price' | 'date' | 'reliability' | 'name';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * Product list response
 */
export interface ProductListResponse {
  products: Product[];
  total: number;
  hasMore: boolean;
  filters: ProductSearchParams;
}

/**
 * OCR extraction result
 */
export interface OCRExtractionResult {
  prix?: number;
  nom_produit?: string;
  date?: string;
  enseigne?: string;
  confidence: number; // 0-1
  needsConfirmation: boolean;
  rawText: string;
}

/**
 * Photo upload configuration
 */
export interface PhotoUploadConfig {
  maxSizeMB: number;
  maxWidth: number;
  maxHeight: number;
  quality: number; // 0-1
  format: 'jpeg' | 'webp';
}
