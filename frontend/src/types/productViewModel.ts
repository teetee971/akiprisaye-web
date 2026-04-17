/**
 * Product View Model Types
 * UI-specific types for product display (PR #2)
 * Consumes data from eanProductService (PR #1)
 */

import type { ProductResult, EanStatus, Territoire, DataSource } from './ean';

/**
 * Product View Model for UI display
 * Transforms ProductResult into display-ready format
 */
export interface ProductViewModel {
  // Core identity
  ean: string;
  nom: string;
  marque: string;
  categorie: string;

  // Product details
  contenance?: string;
  prix?: string; // Formatted price string

  // Status & reliability
  status: EanStatus;
  statusLabel: string;
  statusColor: 'green' | 'yellow' | 'gray';
  isCitizenData: boolean;

  // Traceability display
  source: DataSource;
  sourceLabel: string;
  territoire: Territoire;
  territoireLabel: string;
  magasin?: string;
  dateObservation: string; // Formatted date string

  // Visual
  imageUrl?: string;
  hasImage: boolean;

  // User photos (optional, with consent)
  userPhotos: UserPhoto[];
}

/**
 * User-contributed photo
 * Explicit consent required for upload
 */
export interface UserPhoto {
  id: string;
  url: string;
  thumbnail?: string;
  uploadedAt: string;
  userId?: string; // Anonymous ID
  consent: boolean; // Explicit consent flag
}

/**
 * Photo upload consent state
 */
export interface PhotoUploadConsent {
  granted: boolean;
  timestamp: string;
  userId?: string;
}

/**
 * Territory label mapping
 */
export const TERRITOIRE_LABELS: Record<Territoire, string> = {
  guadeloupe: 'Guadeloupe',
  martinique: 'Martinique',
  guyane: 'Guyane',
  reunion: 'Réunion',
  mayotte: 'Mayotte',
  polynesie: 'Polynésie Française',
  nouvelle_caledonie: 'Nouvelle-Calédonie',
  wallis_et_futuna: 'Wallis-et-Futuna',
  saint_martin: 'Saint-Martin',
  saint_barthelemy: 'Saint-Barthélemy',
  saint_pierre_et_miquelon: 'Saint-Pierre-et-Miquelon',
};

/**
 * Data source label mapping
 */
export const SOURCE_LABELS: Record<DataSource, string> = {
  observation_citoyenne: 'Observation citoyenne',
  base_officielle: 'Base officielle',
  partenaire_enseigne: 'Partenaire enseigne',
  open_food_facts: 'Open Food Facts',
  manuel: 'Saisie manuelle',
  scan_utilisateur: 'Scan utilisateur',
};

/**
 * Status label mapping
 */
export const STATUS_LABELS: Record<EanStatus, string> = {
  confirmé: 'Produit confirmé',
  partiel: 'Données partielles',
  non_référencé: 'Non référencé',
};
