/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Product } from './types';

/**
 * Types locaux (conserve tes types si déjà définis plus haut dans ton fichier)
 * Ici on garde minimal pour patcher sans casse.
 */
export type QuantityParsed = { value: number; unit: string };

export type OFFProduct = {
  code: string;
  product_name?: string;
  brands?: string;
  categories_tags?: string[];
  quantity?: string;
  image_url?: string;
  image_small_url?: string;
  nutriscore_grade?: string;
  ecoscore_grade?: string;
  ingredients_text?: string;
  allergens_tags?: string[];
  countries_tags?: string[];
};

const OFF_API_V2_BASE = 'https://world.openfoodfacts.org/api/v2';

// Rate-limit placeholder : si ton fichier original a déjà rateLimit(), garde-le.
// Ici version neutre.
async function rateLimit(): Promise<void> {
  return;
}

/**
 * Parse une quantité (ex: "500 g", "1.5 L")
 */
export function parseQuantity(quantity: string | undefined): QuantityParsed {
  if (!quantity) return { value: 0, unit: '' };

  const match = quantity.match(/^([\d.,]+)\s*([a-zA-Z]+)$/);
  // Avec exactOptionalPropertyTypes + noUncheckedIndexedAccess,
  // match[1]/match[2] sont vus comme possiblement undefined => on sécurise.
  const rawValue = match?.[1];
  const rawUnit = match?.[2];

  if (!rawValue || !rawUnit) return { value: 0, unit: '' };

  const value = Number.parseFloat(rawValue.replace(',', '.'));
  const unit = rawUnit.toLowerCase();

  return { value: Number.isFinite(value) ? value : 0, unit };
}

/**
 * Mappe les catégories OFF vers nos catégories
 */
export function mapCategory(categoriesTags: string[] | undefined): string {
  if (!categoriesTags || categoriesTags.length === 0) return 'Autre';

  const categoryMap: Record<string, string> = {
    beverages: 'Boissons',
    dairies: 'Produits laitiers',
    meats: 'Viandes',
    'plant-based-foods': 'Fruits et légumes',
    snacks: 'Snacks',
    groceries: 'Épicerie',
    'frozen-foods': 'Surgelés',
  };

  for (const tag of categoriesTags) {
    const key = tag.replace('en:', '').toLowerCase();
    if (categoryMap[key]) return categoryMap[key];
  }

  return 'Autre';
}

/**
 * Mappe un produit OFF vers notre modèle Product
 *
 * Point clé exactOptionalPropertyTypes:
 * - ne jamais mettre "prop: undefined"
 * - inclure la prop seulement si elle est définie
 */
export function mapOFFToProduct(off: OFFProduct): Partial<Product> {
  const quantity = parseQuantity(off.quantity);

  const metadataBase = {
    source: 'openfoodfacts',
    lastSync: new Date().toISOString(),
    ...(off.nutriscore_grade !== undefined ? { nutriscore: off.nutriscore_grade } : {}),
    ...(off.ecoscore_grade !== undefined ? { ecoscore: off.ecoscore_grade } : {}),
    ...(off.ingredients_text !== undefined ? { ingredients: off.ingredients_text } : {}),
    ...(off.allergens_tags !== undefined ? { allergens: off.allergens_tags } : {}),
    ...(off.countries_tags !== undefined ? { countries: off.countries_tags } : {}),
  };

  return {
    ean: off.code,
    nom: off.product_name || 'Produit sans nom',
    categorie: mapCategory(off.categories_tags),
    contenance: quantity.value,
    unite: quantity.unit,
    ...(off.brands !== undefined ? { marque: off.brands } : {}),
    ...((off.image_url || off.image_small_url) !== undefined
      ? { imageUrl: off.image_url || off.image_small_url }
      : {}),
    metadata: metadataBase as any,
  };
}

/**
 * Récupère un produit par code-barres (EAN)
 */
export async function getProductByBarcode(ean: string): Promise<OFFProduct | null> {
  try {
    await rateLimit();

    const response = await fetch(`${OFF_API_V2_BASE}/product/${ean}`);

    if (!response.ok) {
      console.warn(`OpenFoodFacts: Product ${ean} not found`);
      return null;
    }

    const data = (await response.json()) as { product?: OFFProduct };
    return data.product ?? null;
  } catch (err) {
    console.warn('OpenFoodFacts: error fetching product', err);
    return null;
  }
}


export default {
  parseQuantity,
  mapCategory,
  mapOFFToProduct,
  getProductByBarcode,
};
