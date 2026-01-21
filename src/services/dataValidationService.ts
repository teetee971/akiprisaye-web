/**
 * Data Validation Service - v3.0.0
 * 
 * Service de validation des observations de prix au format canonique
 * Garantit la qualité et la cohérence des données entrantes
 * 
 * @module dataValidationService
 */

import type { PriceObservation, ProductCategory, TerritoryCode } from '../types/PriceObservation';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

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
function validatePriceRange(price: number): boolean {
  return price >= 0.01 && price <= 10000;
}

/**
 * Validate quality score range
 */
function validateQualityScore(score?: number): boolean {
  if (score === undefined) return true;
  return score >= 0 && score <= 100;
}

/**
 * Valid territoire names
 */
const VALID_TERRITOIRES: TerritoryCode[] = [
  'FR',
  'GP',
  'MQ',
  'GF',
  'RE',
  'YT',
  'PM',
  'BL',
  'MF',
  'WF',
  'PF',
  'NC',
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
const VALID_SOURCES: NonNullable<PriceObservation['sourceType']>[] = [
  'citizen',
  'open_data',
  'partner',
];

/**
 * Validate a single price observation
 */
export function validateObservation(observation: PriceObservation): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validate required fields presence
  if (!observation.territory) {
    errors.push('Champ "territory" manquant');
  }
  
  if (!observation.productLabel) {
    errors.push('Champ "productLabel" manquant');
  }
  
  if (observation.price === undefined || observation.price === null) {
    errors.push('Champ "price" manquant');
  }
  
  if (!observation.observedAt) {
    errors.push('Champ "observedAt" manquant');
  }
  
  if (!observation.sourceType) {
    errors.push('Champ "sourceType" manquant');
  }
  
  // If required fields are missing, stop here
  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }
  
  // Validate territoire
  if (!VALID_TERRITOIRES.includes(observation.territory)) {
    errors.push(`Territoire invalide: "${observation.territory}"`);
  }
  
  // Validate product label
  if (!observation.productLabel || observation.productLabel.trim().length === 0) {
    errors.push('Nom du produit manquant');
  }
  
  if (observation.productLabel && observation.productLabel.length > 500) {
    errors.push('Nom du produit trop long (max 500 caractères)');
  }
  
  if (observation.productCategory && !VALID_CATEGORIES.includes(observation.productCategory)) {
    errors.push(`Catégorie invalide: "${observation.productCategory}"`);
  }
  
  if (observation.barcode && !validateEAN(observation.barcode)) {
    errors.push(`Code EAN invalide: "${observation.barcode}"`);
  }
  
  // Validate prix
  if (typeof observation.price !== 'number') {
    errors.push('Le prix doit être un nombre');
  } else if (observation.price < 0) {
    errors.push('Le prix ne peut pas être négatif');
  } else if (!validatePriceRange(observation.price)) {
    warnings.push(`Prix inhabituel: ${observation.price}€ (hors de la plage 0.01€-10,000€)`);
  }
  
  // Validate observedAt
  if (!validateDateFormat(observation.observedAt.split('T')[0])) {
    errors.push(`Format de date invalide: "${observation.observedAt}" (attendu: YYYY-MM-DD)`);
  } else {
    if (!validateDateNotFuture(observation.observedAt)) {
      errors.push('La date de relevé ne peut pas être dans le futur');
    }
    
    if (!validateDateNotTooOld(observation.observedAt)) {
      warnings.push('Date de relevé ancienne (plus de 2 ans)');
    }
  }
  
  // Validate source
  if (observation.sourceType && !VALID_SOURCES.includes(observation.sourceType)) {
    errors.push(`Source invalide: "${observation.sourceType}"`);
  }
  
  if (observation.confidenceScore !== undefined && !validateQualityScore(observation.confidenceScore)) {
    errors.push('Le score de qualité doit être entre 0 et 100');
  }
  
  // Validate enseigne if present
  if (observation.storeLabel && observation.storeLabel.trim().length === 0) {
    warnings.push('Enseigne vide (devrait être omis ou rempli)');
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
  observations: PriceObservation[]
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
  observation: PriceObservation,
  minQualityScore: number = 50
): boolean {
  if (observation.confidenceScore === undefined) {
    return false;
  }
  
  return observation.confidenceScore >= minQualityScore;
}

/**
 * Filter observations by quality
 */
export function filterByQuality(
  observations: PriceObservation[],
  minQualityScore: number = 50
): PriceObservation[] {
  return observations.filter((obs) => meetsQualityThreshold(obs, minQualityScore));
}
