/**
 * Service d'évaluation cosmétique
 *
 * Basé uniquement sur :
 * - Liste INCI
 * - Règlement CE 1223/2009
 * - Bases publiques (CosIng, ANSES, ECHA)
 *
 * Aucune donnée fictive.
 * Aucune affirmation médicale.
 */

import { OFFICIAL_INGREDIENTS, COSMETIC_CATEGORIES } from '../data/officialIngredients.js';
import {
  OFFICIAL_DATABASES,
  REGULATORY_REFERENCES,
  LEGAL_DISCLAIMER,
} from '../constants/cosmeticDatabases.js';

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'RESTRICTED' | 'PROHIBITED';
export type WarningLevel = 'info' | 'warning' | 'error';

export interface IngredientSource {
  name: string;
  url: string;
  type: string;
}

export interface CosmeticIngredient {
  inciName: string;
  commonName: string | null;
  casNumber: string | null;
  einecs: string | null;
  function: string[];
  riskLevel: RiskLevel;
  restrictions?: string;
  sources?: IngredientSource[];
  [key: string]: unknown;
}

export interface IdentifiedIngredients {
  identified: CosmeticIngredient[];
  unknown: CosmeticIngredient[];
}

export interface ScoreBreakdown {
  safeIngredients: number;
  moderateIngredients: number;
  riskIngredients: number;
  restrictedIngredients: number;
  prohibitedIngredients: number;
}

export interface ScoreResult {
  score: number;
  breakdown: ScoreBreakdown;
}

export interface IngredientWarning {
  level: WarningLevel;
  message: string;
  ingredients: string[];
}

export interface ProductEvaluation {
  product: {
    name: string;
    category: string;
    inciList: string;
    ingredients: CosmeticIngredient[];
  };
  score: number;
  scoreBreakdown: ScoreBreakdown;
  warnings: IngredientWarning[];
  sources: IngredientSource[];
  evaluationDate: string;
  disclaimer: unknown;
}

/**
 * Parse an INCI list string (comma- or semicolon-separated).
 */
export function parseInciList(inciString: unknown): string[] {
  if (!inciString || typeof inciString !== 'string') return [];
  return inciString
    .toUpperCase()
    .split(/[,;]+/)
    .map((i) => i.trim())
    .filter((i) => i.length > 0);
}

/**
 * Search for an ingredient by INCI name in the official database.
 */
export function findIngredient(inciName: string): CosmeticIngredient | null {
  const normalized = inciName.toUpperCase().trim();
  if (OFFICIAL_INGREDIENTS[normalized]) return OFFICIAL_INGREDIENTS[normalized] as CosmeticIngredient;

  for (const [key, value] of Object.entries(OFFICIAL_INGREDIENTS)) {
    if (key.includes(normalized) || normalized.includes(key)) {
      return value as CosmeticIngredient;
    }
  }
  return null;
}

/**
 * Identify all ingredients from an INCI list.
 * Unknown ingredients are returned with a conservative MODERATE risk level.
 */
export function identifyIngredients(inciList: string): IdentifiedIngredients {
  const names = parseInciList(inciList);
  const identified: CosmeticIngredient[] = [];
  const unknown: CosmeticIngredient[] = [];

  for (const name of names) {
    const ingredient = findIngredient(name);
    if (ingredient) {
      identified.push(ingredient);
    } else {
      unknown.push({
        inciName: name,
        commonName: null,
        casNumber: null,
        einecs: null,
        function: [],
        riskLevel: 'MODERATE',
        restrictions: 'Ingrédient non référencé dans notre base de données. Vérifiez sur CosIng.',
        sources: [
          {
            name: 'CosIng - Recherche requise',
            url: 'https://ec.europa.eu/growth/tools-databases/cosing/index.cfm?fuseaction=search.simple',
            type: 'COSING',
          },
        ],
      });
    }
  }

  return { identified, unknown };
}

/**
 * Calculate the transparency score for a list of ingredients.
 *
 * Methodology:
 * - LOW:        +10 points
 * - MODERATE:   +5  points
 * - HIGH:       +0  points
 * - RESTRICTED: -5  points
 * - PROHIBITED: -10 points
 *
 * Final score = (total points / maximum possible points) × 100
 */
export function calculateScore(ingredients: CosmeticIngredient[]): ScoreResult {
  if (!ingredients || ingredients.length === 0) {
    return {
      score: 0,
      breakdown: {
        safeIngredients: 0,
        moderateIngredients: 0,
        riskIngredients: 0,
        restrictedIngredients: 0,
        prohibitedIngredients: 0,
      },
    };
  }

  const riskPoints: Record<RiskLevel, number> = {
    LOW: 10,
    MODERATE: 5,
    HIGH: 0,
    RESTRICTED: -5,
    PROHIBITED: -10,
  };

  let totalPoints = 0;
  const maxPoints = ingredients.length * 10;

  const breakdown: ScoreBreakdown = {
    safeIngredients: 0,
    moderateIngredients: 0,
    riskIngredients: 0,
    restrictedIngredients: 0,
    prohibitedIngredients: 0,
  };

  for (const ingredient of ingredients) {
    totalPoints += riskPoints[ingredient.riskLevel] ?? 0;
    switch (ingredient.riskLevel) {
      case 'LOW':        breakdown.safeIngredients++;        break;
      case 'MODERATE':   breakdown.moderateIngredients++;    break;
      case 'HIGH':       breakdown.riskIngredients++;        break;
      case 'RESTRICTED': breakdown.restrictedIngredients++;  break;
      case 'PROHIBITED': breakdown.prohibitedIngredients++;  break;
    }
  }

  const score =
    maxPoints > 0 ? Math.max(0, Math.min(100, (totalPoints / maxPoints) * 100)) : 0;

  return { score: Math.round(score), breakdown };
}

/**
 * Generate regulatory warnings from a list of identified ingredients.
 */
export function generateWarnings(ingredients: CosmeticIngredient[]): IngredientWarning[] {
  const warnings: IngredientWarning[] = [];

  const restricted = ingredients.filter((i) => i.riskLevel === 'RESTRICTED');
  const prohibited = ingredients.filter((i) => i.riskLevel === 'PROHIBITED');
  const high = ingredients.filter((i) => i.riskLevel === 'HIGH');
  const moderateWithRestrictions = ingredients.filter(
    (i) => i.riskLevel === 'MODERATE' && i.restrictions && i.restrictions.length > 0,
  );
  const parfums = ingredients.filter(
    (i) => i.inciName === 'PARFUM' || i.inciName === 'FRAGRANCE',
  );

  if (prohibited.length > 0) {
    warnings.push({
      level: 'error',
      message: `⚠️ ATTENTION: ${prohibited.length} substance(s) interdite(s) ou fortement restreinte(s) détectée(s).`,
      ingredients: prohibited.map((i) => i.inciName),
    });
  }
  if (restricted.length > 0) {
    warnings.push({
      level: 'warning',
      message: `⚠️ ${restricted.length} substance(s) soumise(s) à restrictions réglementaires.`,
      ingredients: restricted.map((i) => i.inciName),
    });
  }
  if (high.length > 0) {
    warnings.push({
      level: 'warning',
      message: `${high.length} substance(s) nécessitant une attention particulière.`,
      ingredients: high.map((i) => i.inciName),
    });
  }
  if (moderateWithRestrictions.length > 0) {
    warnings.push({
      level: 'info',
      message: `${moderateWithRestrictions.length} substance(s) avec restrictions d'usage détectée(s).`,
      ingredients: moderateWithRestrictions.map((i) => i.inciName),
    });
  }
  if (parfums.length > 0) {
    warnings.push({
      level: 'info',
      message: 'Contient du parfum. Vérifiez la présence des 26 allergènes réglementés dans la liste complète.',
      ingredients: parfums.map((i) => i.inciName),
    });
  }

  return warnings;
}

/**
 * Collect all official sources referenced by the given ingredients.
 */
export function collectSources(ingredients: CosmeticIngredient[]): IngredientSource[] {
  const seen = new Set<string>();
  const sources: IngredientSource[] = [
    { name: (OFFICIAL_DATABASES as Record<string, { name: string; url: string }>).COSING.name, url: (OFFICIAL_DATABASES as Record<string, { name: string; url: string }>).COSING.url, type: 'COSING' },
    { name: (OFFICIAL_DATABASES as Record<string, { name: string; url: string }>).EU_REGULATION.name, url: (OFFICIAL_DATABASES as Record<string, { name: string; url: string }>).EU_REGULATION.url, type: 'EU_REGULATION' },
  ];

  for (const ingredient of ingredients) {
    for (const source of ingredient.sources ?? []) {
      const key = `${source.type}-${source.url}`;
      if (!seen.has(key)) {
        seen.add(key);
        sources.push(source);
      }
    }
  }

  return sources;
}

/**
 * Full evaluation of a cosmetic product from its INCI list.
 */
export function evaluateProduct(
  productName: string,
  category: string,
  inciList: string,
): ProductEvaluation {
  const { identified, unknown } = identifyIngredients(inciList);
  const allIngredients = [...identified, ...unknown];
  const { score, breakdown } = calculateScore(allIngredients);
  const warnings = generateWarnings(allIngredients);
  const sources = collectSources(allIngredients);

  return {
    product: { name: productName, category, inciList, ingredients: allIngredients },
    score,
    scoreBreakdown: breakdown,
    warnings,
    sources,
    evaluationDate: new Date().toISOString(),
    disclaimer: LEGAL_DISCLAIMER,
  };
}

/** Get available cosmetic product categories. */
export function getCategories(): unknown {
  return COSMETIC_CATEGORIES;
}

/** Get regulatory references. */
export function getRegulatoryReferences(): unknown {
  return REGULATORY_REFERENCES;
}

/** Get official databases. */
export function getOfficialDatabases(): unknown {
  return OFFICIAL_DATABASES;
}

export default {
  parseInciList,
  findIngredient,
  identifyIngredients,
  calculateScore,
  generateWarnings,
  collectSources,
  evaluateProduct,
  getCategories,
  getRegulatoryReferences,
  getOfficialDatabases,
};
