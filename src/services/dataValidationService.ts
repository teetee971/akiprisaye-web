/**
 * Data Validation Service - v3.0.0
 * 
 * Service de validation des observations de prix au format canonique
 * Garantit la qualité et la cohérence des données entrantes
 * 
 * @module dataValidationService
 */

import type {
  CanonicalPriceObservation,
  ValidationResult,
  TerritoireName,
  ProductCategory,
  DataSource,
  QualityLevel,
} from '../types/canonicalPriceObservation';

/**
 * Validate EAN format (GTIN-8, GTIN-12, GTIN-13)
 */
const EAN_PATTERN = /^\d{8}$|^\d{12}$|^\d{13}$/;

function validateEAN(ean: string): boolean {
  if (!ean) return true; // EAN is optional
  
  // Must be 8, 12, or 13 digits
  if (!EAN_PATTERN.test(ean)) {
    return false;
  }
  
  return true;
}

/**
 * Validate date format (YYYY-MM-DD)
 */
function validateDateFormat(date: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return false;
  }
  
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
}

/**
 * Validate date is not in the future
 */
function validateDateNotFuture(date: string): boolean {
  const observationDate = new Date(date);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  return observationDate <= today;
}

/**
 * Validate date is not too old (max 2 years)
 */
function validateDateNotTooOld(date: string): boolean {
  const observationDate = new Date(date);
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
  
  return observationDate >= twoYearsAgo;
}

/**
 * Validate price is reasonable (between 0.01€ and 10,000€)
 */
function validatePriceRange(prix: number): boolean {
  return prix >= 0.01 && prix <= 10000;
}

/**
 * Validate quality score range
 */
function validateQualityScore(score?: number): boolean {
  if (score === undefined) return true;
  return score >= 0 && score <= 1;
}

/**
 * Valid territoire names
 */
const VALID_TERRITOIRES: TerritoireName[] = [
  'Guadeloupe',
  'Martinique',
  'Guyane',
  'La Réunion',
  'Mayotte',
  'Saint-Pierre-et-Miquelon',
  'Saint-Barthélemy',
  'Saint-Martin',
  'Wallis-et-Futuna',
  'Polynésie française',
  'Nouvelle-Calédonie',
  'Terres australes et antarctiques françaises',
  'Hexagone',
];

/**
 * Valid product categories
 */
const VALID_CATEGORIES: ProductCategory[] = [
  'Produits laitiers',
  'Fruits et légumes',
  'Viandes et poissons',
  'Épicerie',
  'Boissons',
  'Hygiène et beauté',
  'Entretien',
  'Bébé',
  'Autres',
];

/**
 * Valid data sources
 */
const VALID_SOURCES: DataSource[] = [
  'releve_citoyen',
  'ticket_scan',
  'donnee_ouverte',
  'releve_terrain',
  'api_publique',
];

/**
 * Valid quality levels
 */
const VALID_QUALITY_LEVELS: QualityLevel[] = [
  'verifie',
  'probable',
  'a_verifier',
];

/**
 * Validate a single price observation
 */
export function validateObservation(
  observation: CanonicalPriceObservation
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validate required fields presence
  if (!observation.territoire) {
    errors.push('Champ "territoire" manquant');
  }
  
  if (!observation.produit) {
    errors.push('Champ "produit" manquant');
  }
  
  if (observation.prix === undefined || observation.prix === null) {
    errors.push('Champ "prix" manquant');
  }
  
  if (!observation.date_releve) {
    errors.push('Champ "date_releve" manquant');
  }
  
  if (!observation.source) {
    errors.push('Champ "source" manquant');
  }
  
  if (!observation.qualite) {
    errors.push('Champ "qualite" manquant');
  }
  
  // If required fields are missing, stop here
  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }
  
  // Validate territoire
  if (!VALID_TERRITOIRES.includes(observation.territoire)) {
    errors.push(`Territoire invalide: "${observation.territoire}"`);
  }
  
  // Validate produit
  if (!observation.produit.nom || observation.produit.nom.trim().length === 0) {
    errors.push('Nom du produit manquant');
  }
  
  if (observation.produit.nom && observation.produit.nom.length > 500) {
    errors.push('Nom du produit trop long (max 500 caractères)');
  }
  
  if (!VALID_CATEGORIES.includes(observation.produit.categorie)) {
    errors.push(`Catégorie invalide: "${observation.produit.categorie}"`);
  }
  
  if (!observation.produit.unite || observation.produit.unite.trim().length === 0) {
    errors.push('Unité du produit manquante');
  }
  
  if (observation.produit.ean && !validateEAN(observation.produit.ean)) {
    errors.push(`Code EAN invalide: "${observation.produit.ean}"`);
  }
  
  // Validate prix
  if (typeof observation.prix !== 'number') {
    errors.push('Le prix doit être un nombre');
  } else if (observation.prix < 0) {
    errors.push('Le prix ne peut pas être négatif');
  } else if (!validatePriceRange(observation.prix)) {
    warnings.push(`Prix inhabituel: ${observation.prix}€ (hors de la plage 0.01€-10,000€)`);
  }
  
  // Validate date_releve
  if (!validateDateFormat(observation.date_releve)) {
    errors.push(`Format de date invalide: "${observation.date_releve}" (attendu: YYYY-MM-DD)`);
  } else {
    if (!validateDateNotFuture(observation.date_releve)) {
      errors.push('La date de relevé ne peut pas être dans le futur');
    }
    
    if (!validateDateNotTooOld(observation.date_releve)) {
      warnings.push('Date de relevé ancienne (plus de 2 ans)');
    }
  }
  
  // Validate source
  if (!VALID_SOURCES.includes(observation.source)) {
    errors.push(`Source invalide: "${observation.source}"`);
  }
  
  // Validate qualite
  if (!VALID_QUALITY_LEVELS.includes(observation.qualite.niveau)) {
    errors.push(`Niveau de qualité invalide: "${observation.qualite.niveau}"`);
  }
  
  if (typeof observation.qualite.preuve !== 'boolean') {
    errors.push('Le champ "qualite.preuve" doit être un booléen');
  }
  
  if (observation.qualite.score !== undefined && !validateQualityScore(observation.qualite.score)) {
    errors.push('Le score de qualité doit être entre 0 et 1');
  }
  
  // Validate enseigne if present
  if (observation.enseigne && observation.enseigne.trim().length === 0) {
    warnings.push('Enseigne vide (devrait être omis ou rempli)');
  }
  
  // Validate commune if present
  if (observation.commune && observation.commune.trim().length === 0) {
    warnings.push('Commune vide (devrait être omis ou rempli)');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate a batch of observations
 */
export function validateObservationBatch(
  observations: CanonicalPriceObservation[]
): {
  valid: boolean;
  total: number;
  validCount: number;
  invalidCount: number;
  results: (ValidationResult & { index: number })[];
} {
  const results: (ValidationResult & { index: number })[] = [];
  let validCount = 0;
  let invalidCount = 0;
  
  observations.forEach((observation, index) => {
    const result = validateObservation(observation);
    results.push({ ...result, index });
    
    if (result.valid) {
      validCount++;
    } else {
      invalidCount++;
    }
  });
  
  return {
    valid: invalidCount === 0,
    total: observations.length,
    validCount,
    invalidCount,
    results,
  };
}

/**
 * Get validation statistics
 */
export function getValidationStatistics(
  validationResults: ValidationResult[]
): {
  totalObservations: number;
  validObservations: number;
  invalidObservations: number;
  totalErrors: number;
  totalWarnings: number;
  commonErrors: { message: string; count: number }[];
  validationRate: number;
} {
  const totalObservations = validationResults.length;
  const validObservations = validationResults.filter((r) => r.valid).length;
  const invalidObservations = totalObservations - validObservations;
  
  const totalErrors = validationResults.reduce((sum, r) => sum + r.errors.length, 0);
  const totalWarnings = validationResults.reduce((sum, r) => sum + r.warnings.length, 0);
  
  // Count error frequency
  const errorCounts = new Map<string, number>();
  validationResults.forEach((result) => {
    result.errors.forEach((error) => {
      errorCounts.set(error, (errorCounts.get(error) || 0) + 1);
    });
  });
  
  const commonErrors = Array.from(errorCounts.entries())
    .map(([message, count]) => ({ message, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  const validationRate = totalObservations > 0 ? (validObservations / totalObservations) * 100 : 0;
  
  return {
    totalObservations,
    validObservations,
    invalidObservations,
    totalErrors,
    totalWarnings,
    commonErrors,
    validationRate,
  };
}

/**
 * Check if observation meets quality threshold
 */
export function meetsQualityThreshold(
  observation: CanonicalPriceObservation,
  minQualityScore: number = 0.5
): boolean {
  if (observation.qualite.score === undefined) {
    // If no score, check quality level
    return observation.qualite.niveau === 'verifie' || observation.qualite.niveau === 'probable';
  }
  
  return observation.qualite.score >= minQualityScore;
}

/**
 * Filter observations by quality
 */
export function filterByQuality(
  observations: CanonicalPriceObservation[],
  minQualityScore: number = 0.5
): CanonicalPriceObservation[] {
  return observations.filter((obs) => meetsQualityThreshold(obs, minQualityScore));
}
