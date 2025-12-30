/**
 * Service d'évaluation cosmétique
 * 
 * Basé uniquement sur:
 * - Liste INCI
 * - Règlement CE 1223/2009
 * - Bases publiques (CosIng, ANSES, ECHA)
 * 
 * Aucune donnée fictive.
 * Aucune affirmation médicale.
 */

import { OFFICIAL_INGREDIENTS, COSMETIC_CATEGORIES } from '../data/officialIngredients.js';
import { OFFICIAL_DATABASES, REGULATORY_REFERENCES, LEGAL_DISCLAIMER } from '../constants/cosmeticDatabases.js';

/**
 * Parse une liste INCI (séparée par virgules ou espaces)
 */
export function parseInciList(inciString) {
  if (!inciString || typeof inciString !== 'string') {
    return [];
  }

  // Normaliser et séparer les ingrédients
  const ingredients = inciString
    .toUpperCase()
    .split(/[,;]+/) // Séparer par virgules ou point-virgules
    .map(ingredient => ingredient.trim())
    .filter(ingredient => ingredient.length > 0);

  return ingredients;
}

/**
 * Rechercher un ingrédient dans la base officielle
 */
export function findIngredient(inciName) {
  const normalizedName = inciName.toUpperCase().trim();
  
  // Recherche exacte
  if (OFFICIAL_INGREDIENTS[normalizedName]) {
    return OFFICIAL_INGREDIENTS[normalizedName];
  }

  // Recherche par correspondance partielle pour variantes
  for (const [key, value] of Object.entries(OFFICIAL_INGREDIENTS)) {
    if (key.includes(normalizedName) || normalizedName.includes(key)) {
      return value;
    }
  }

  // Ingrédient non trouvé dans la base
  return null;
}

/**
 * Identifier tous les ingrédients d'une liste INCI
 */
export function identifyIngredients(inciList) {
  const ingredientNames = parseInciList(inciList);
  
  const identified = [];
  const unknown = [];

  for (const name of ingredientNames) {
    const ingredient = findIngredient(name);
    
    if (ingredient) {
      identified.push(ingredient);
    } else {
      // Ingrédient non reconnu - données limitées disponibles
      unknown.push({
        inciName: name,
        commonName: null,
        casNumber: null,
        einecs: null,
        function: [],
        riskLevel: 'MODERATE', // Par précaution
        restrictions: 'Ingrédient non référencé dans notre base de données. Vérifiez sur CosIng.',
        sources: [
          {
            name: 'CosIng - Recherche requise',
            url: `https://ec.europa.eu/growth/tools-databases/cosing/index.cfm?fuseaction=search.simple`,
            type: 'COSING',
          },
        ],
      });
    }
  }

  return { identified, unknown };
}

/**
 * Calculer le score transparent d'un produit
 * 
 * Méthodologie:
 * - LOW: +10 points
 * - MODERATE: +5 points
 * - HIGH: +0 points
 * - RESTRICTED: -5 points
 * - PROHIBITED: -10 points
 * 
 * Score final = (points totaux / points maximum possibles) * 100
 */
export function calculateScore(ingredients) {
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

  const riskPoints = {
    LOW: 10,
    MODERATE: 5,
    HIGH: 0,
    RESTRICTED: -5,
    PROHIBITED: -10,
  };

  let totalPoints = 0;
  const maxPoints = ingredients.length * 10; // Tous à LOW

  const breakdown = {
    safeIngredients: 0,
    moderateIngredients: 0,
    riskIngredients: 0,
    restrictedIngredients: 0,
    prohibitedIngredients: 0,
  };

  for (const ingredient of ingredients) {
    const points = riskPoints[ingredient.riskLevel] || 0;
    totalPoints += points;

    // Comptabiliser pour le breakdown
    switch (ingredient.riskLevel) {
      case 'LOW':
        breakdown.safeIngredients++;
        break;
      case 'MODERATE':
        breakdown.moderateIngredients++;
        break;
      case 'HIGH':
        breakdown.riskIngredients++;
        break;
      case 'RESTRICTED':
        breakdown.restrictedIngredients++;
        break;
      case 'PROHIBITED':
        breakdown.prohibitedIngredients++;
        break;
    }
  }

  // Score sur 100
  // Protection contre division par zéro (déjà géré par le check initial, mais double sécurité)
  const score = maxPoints > 0 
    ? Math.max(0, Math.min(100, ((totalPoints / maxPoints) * 100)))
    : 0;

  return {
    score: Math.round(score),
    breakdown,
  };
}

/**
 * Générer des avertissements basés sur les ingrédients
 */
export function generateWarnings(ingredients) {
  const warnings = [];

  const restricted = ingredients.filter(i => i.riskLevel === 'RESTRICTED');
  const prohibited = ingredients.filter(i => i.riskLevel === 'PROHIBITED');
  const high = ingredients.filter(i => i.riskLevel === 'HIGH');
  const moderateWithRestrictions = ingredients.filter(i => 
    i.riskLevel === 'MODERATE' && i.restrictions && i.restrictions.length > 0
  );
  const parfums = ingredients.filter(i => 
    i.inciName === 'PARFUM' || i.inciName === 'FRAGRANCE'
  );

  if (prohibited.length > 0) {
    warnings.push({
      level: 'error',
      message: `⚠️ ATTENTION: ${prohibited.length} substance(s) interdite(s) ou fortement restreinte(s) détectée(s).`,
      ingredients: prohibited.map(i => i.inciName),
    });
  }

  if (restricted.length > 0) {
    warnings.push({
      level: 'warning',
      message: `⚠️ ${restricted.length} substance(s) soumise(s) à restrictions réglementaires.`,
      ingredients: restricted.map(i => i.inciName),
    });
  }

  if (high.length > 0) {
    warnings.push({
      level: 'warning',
      message: `${high.length} substance(s) nécessitant une attention particulière.`,
      ingredients: high.map(i => i.inciName),
    });
  }

  if (moderateWithRestrictions.length > 0) {
    warnings.push({
      level: 'info',
      message: `${moderateWithRestrictions.length} substance(s) avec restrictions d'usage détectée(s).`,
      ingredients: moderateWithRestrictions.map(i => i.inciName),
    });
  }

  if (parfums.length > 0) {
    warnings.push({
      level: 'info',
      message: 'Contient du parfum. Vérifiez la présence des 26 allergènes réglementés dans la liste complète.',
      ingredients: parfums.map(i => i.inciName),
    });
  }

  return warnings;
}

/**
 * Collecter toutes les sources officielles utilisées
 */
export function collectSources(ingredients) {
  const sourcesSet = new Set();
  const sources = [];

  // Ajouter les bases de données officielles principales
  sources.push({
    name: OFFICIAL_DATABASES.COSING.name,
    url: OFFICIAL_DATABASES.COSING.url,
    type: 'COSING',
  });

  sources.push({
    name: OFFICIAL_DATABASES.EU_REGULATION.name,
    url: OFFICIAL_DATABASES.EU_REGULATION.url,
    type: 'EU_REGULATION',
  });

  // Ajouter les sources spécifiques des ingrédients
  for (const ingredient of ingredients) {
    if (ingredient.sources) {
      for (const source of ingredient.sources) {
        const key = `${source.type}-${source.url}`;
        if (!sourcesSet.has(key)) {
          sourcesSet.add(key);
          sources.push(source);
        }
      }
    }
  }

  return sources;
}

/**
 * Évaluer un produit cosmétique complet
 */
export function evaluateProduct(productName, category, inciList) {
  // Parser et identifier les ingrédients
  const { identified, unknown } = identifyIngredients(inciList);
  const allIngredients = [...identified, ...unknown];

  // Calculer le score
  const { score, breakdown } = calculateScore(allIngredients);

  // Générer les avertissements
  const warnings = generateWarnings(allIngredients);

  // Collecter les sources
  const sources = collectSources(allIngredients);

  // Créer le résultat d'évaluation
  const result = {
    product: {
      name: productName,
      category: category,
      inciList: inciList,
      ingredients: allIngredients,
    },
    score,
    scoreBreakdown: breakdown,
    warnings,
    sources,
    evaluationDate: new Date().toISOString(),
    disclaimer: LEGAL_DISCLAIMER,
  };

  return result;
}

/**
 * Obtenir les catégories de produits disponibles
 */
export function getCategories() {
  return COSMETIC_CATEGORIES;
}

/**
 * Obtenir les références réglementaires
 */
export function getRegulatoryReferences() {
  return REGULATORY_REFERENCES;
}

/**
 * Obtenir les bases de données officielles
 */
export function getOfficialDatabases() {
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
