/**
 * categories.ts — Centralized product and news category definitions
 *
 * Purpose: Single source of truth for all category-related configurations
 * Used by: CategoryFilter, ListeCourses, news components, filters
 *
 * @module categories
 */

/**
 * Official product categories based on OPMR/DGCCRF reports
 */
export interface ProductCategory {
  id: string;
  nom: string;
  types_magasins: string[];
  source: string;
}

export const PRODUCT_CATEGORIES: Record<string, ProductCategory> = {
  alimentaire_base: {
    id: 'alimentaire_base',
    nom: 'Produits alimentaires de base',
    types_magasins: ['Supermarché', 'Hypermarché', 'Hard discount', 'Commerce de proximité'],
    source: 'OPMR - Panier de référence',
  },
  frais: {
    id: 'frais',
    nom: 'Produits frais',
    types_magasins: ['Supermarché', 'Hypermarché', 'Marché alimentaire'],
    source: 'OPMR - Alimentation fraîche',
  },
  carburant: {
    id: 'carburant',
    nom: 'Carburant',
    types_magasins: ['Station-service'],
    source: 'prix-carburants.gouv.fr',
  },
  bricolage: {
    id: 'bricolage',
    nom: 'Bricolage / Matériaux',
    types_magasins: ['Bricolage / Matériaux'],
    source: 'INSEE - NAF 4752',
  },
  hygiene: {
    id: 'hygiene',
    nom: 'Hygiène / Santé',
    types_magasins: ['Pharmacie', 'Parapharmacie', 'Supermarché'],
    source: 'OPMR - Hygiène',
  },
};

/**
 * Generic products list for shopping lists
 */
export interface GenericProduct {
  nom: string;
  categorie: string;
}

export const GENERIC_PRODUCTS: GenericProduct[] = [
  { nom: 'Riz', categorie: 'alimentaire_base' },
  { nom: 'Pâtes', categorie: 'alimentaire_base' },
  { nom: 'Lait', categorie: 'frais' },
  { nom: 'Pain', categorie: 'frais' },
  { nom: 'Fruits', categorie: 'frais' },
  { nom: 'Légumes', categorie: 'frais' },
  { nom: 'Viande', categorie: 'frais' },
  { nom: 'Poisson', categorie: 'frais' },
  { nom: 'Huile', categorie: 'alimentaire_base' },
  { nom: 'Sucre', categorie: 'alimentaire_base' },
  { nom: 'Farine', categorie: 'alimentaire_base' },
  { nom: 'Eau', categorie: 'alimentaire_base' },
  { nom: 'Essence', categorie: 'carburant' },
  { nom: 'Diesel', categorie: 'carburant' },
  { nom: 'Médicaments', categorie: 'hygiene' },
  { nom: 'Shampooing', categorie: 'hygiene' },
  { nom: 'Savon', categorie: 'hygiene' },
];

/**
 * News categories (imported from existing news constants)
 */
export type NewsCategory = 'PRIX' | 'POLITIQUE' | 'ALERTE' | 'INNOVATION';

export const ALL_CATEGORIES = 'ALL';

/**
 * Get category by ID
 */
export function getCategoryById(id: string): ProductCategory | undefined {
  return PRODUCT_CATEGORIES[id];
}

/**
 * Get all category IDs
 */
export function getAllCategoryIds(): string[] {
  return Object.keys(PRODUCT_CATEGORIES);
}

/**
 * Get products by category
 */
export function getProductsByCategory(categoryId: string): GenericProduct[] {
  return GENERIC_PRODUCTS.filter((p) => p.categorie === categoryId);
}
