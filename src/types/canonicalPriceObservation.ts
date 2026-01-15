/**
 * Canonical Price Observation Types - v3.0.0
 * 
 * Types matching the canonical JSON schema for price observations
 * Format unique et normalisé pour toutes les sources de données
 * 
 * @module canonicalPriceObservation
 */

/**
 * Territoire d'observation (nom complet)
 */
export type TerritoireName =
  | 'Guadeloupe'
  | 'Martinique'
  | 'Guyane'
  | 'La Réunion'
  | 'Mayotte'
  | 'Saint-Pierre-et-Miquelon'
  | 'Saint-Barthélemy'
  | 'Saint-Martin'
  | 'Wallis-et-Futuna'
  | 'Polynésie française'
  | 'Nouvelle-Calédonie'
  | 'Terres australes et antarctiques françaises'
  | 'Hexagone';

/**
 * Catégories de produits standardisées
 */
export type ProductCategory =
  | 'Produits laitiers'
  | 'Fruits et légumes'
  | 'Viandes et poissons'
  | 'Épicerie'
  | 'Boissons'
  | 'Hygiène et beauté'
  | 'Entretien'
  | 'Bébé'
  | 'Autres';

/**
 * Sources de données possibles
 */
export type DataSource =
  | 'releve_citoyen'
  | 'ticket_scan'
  | 'donnee_ouverte'
  | 'releve_terrain'
  | 'api_publique';

/**
 * Niveaux de qualité
 */
export type QualityLevel = 'verifie' | 'probable' | 'a_verifier';

/**
 * Informations produit dans l'observation canonique
 */
export interface CanonicalProduct {
  nom: string;
  ean?: string;
  categorie: ProductCategory;
  unite: string;
  marque?: string;
}

/**
 * Informations de qualité de l'observation
 */
export interface ObservationQuality {
  niveau: QualityLevel;
  preuve: boolean;
  score?: number;
}

/**
 * Métadonnées de l'observation
 */
export interface ObservationMetadata {
  observateur_id?: string;
  timestamp_creation?: string;
  ip_hash?: string;
}

/**
 * Observation de prix au format canonique
 * Format unique pour toutes les sources de données
 */
export interface CanonicalPriceObservation {
  territoire: TerritoireName;
  commune?: string;
  enseigne?: string;
  produit: CanonicalProduct;
  prix: number;
  date_releve: string;
  source: DataSource;
  qualite: ObservationQuality;
  metadata?: ObservationMetadata;
}

/**
 * Collection d'observations avec métadonnées
 */
export interface ObservationCollection {
  version: string;
  generated_at: string;
  observations: CanonicalPriceObservation[];
  count: number;
}

/**
 * Résultat de validation d'une observation
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
