/**
 * Service OpenFoodFacts - Synchronisation des produits alimentaires
 */

import type {
  OFFProduct,
  OFFSearchOptions,
  OFFSearchResponse,
  SyncResult,
  BulkSyncResult,
  Product,
  QuantityParsed,
} from './types';

const OFF_API_BASE = 'https://world.openfoodfacts.org';
const OFF_API_V2_BASE = `${OFF_API_BASE}/api/v2`;
const OFF_SEARCH_BASE = `${OFF_API_BASE}/cgi`;

// Rate limiting: 100 req/min max
const RATE_LIMIT_DELAY = 600; // ms between requests
let lastRequestTime = 0;

/**
 * Applique un rate limiting simple
 */
async function rateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest));
  }
  
  lastRequestTime = Date.now();
}

/**
 * Parse une quantité (ex: "500 g", "1.5 L")
 */
export function parseQuantity(quantity: string | undefined): QuantityParsed {
  if (!quantity) {
    return { value: 0, unit: '' };
  }

  const match = quantity.match(/^([\d.,]+)\s*([a-zA-Z]+)$/);
  if (!match) {
    return { value: 0, unit: '' };
  }

  const valuePart = match?.[1];
  const unitPart = match?.[2];
  if (!valuePart || !unitPart) {
    return { value: 0, unit: '' };
  }

  const value = parseFloat(valuePart.replace(',', '.'));
  const unit = unitPart.toLowerCase();

  return { value, unit };
}

/**
 * Mappe les catégories OFF vers nos catégories
 */
export function mapCategory(categoriesTags: string[] | undefined): string {
  if (!categoriesTags || categoriesTags.length === 0) {
    return 'Autre';
  }

  const categoryMap: Record<string, string> = {
    'beverages': 'Boissons',
    'dairies': 'Produits laitiers',
    'meats': 'Viandes',
    'plant-based-foods': 'Fruits et légumes',
    'snacks': 'Snacks',
    'groceries': 'Épicerie',
    'frozen-foods': 'Surgelés',
  };

  for (const tag of categoriesTags) {
    const key = tag.replace('en:', '').toLowerCase();
    if (categoryMap[key]) {
      return categoryMap[key];
    }
  }

  return 'Autre';
}

/**
 * Mappe un produit OFF vers notre modèle Product
 */
export function mapOFFToProduct(off: OFFProduct): Partial<Product> {
  const quantity = parseQuantity(off.quantity);

  return {
    ean: off.code,
    nom: off.product_name || 'Produit sans nom',
    marque: off.brands || undefined,
    categorie: mapCategory(off.categories_tags),
    contenance: quantity.value,
    unite: quantity.unit,
    imageUrl: off.image_url || off.image_small_url || undefined,
    metadata: {
      ...(off.nutriscore_grade ? { nutriscore: off.nutriscore_grade } : {}),
      ...(off.ecoscore_grade ? { ecoscore: off.ecoscore_grade } : {}),
      source: 'openfoodfacts',
      lastSync: new Date().toISOString(),
      ...(off.ingredients_text ? { ingredients: off.ingredients_text } : {}),
      ...(off.allergens_tags ? { allergens: off.allergens_tags } : {}),
      ...(off.countries_tags ? { countries: off.countries_tags } : {}),
    },
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

    const data = await response.json();
    
    if (data.status !== 1 || !data.product) {
      return null;
    }

    return data.product;
  } catch (error) {
    console.error('Error fetching product from OpenFoodFacts:', error);
    return null;
  }
}

/**
 * Recherche de produits
 */
export async function searchProducts(
  query: string,
  options: OFFSearchOptions = {}
): Promise<OFFProduct[]> {
  try {
    await rateLimit();

    const params = new URLSearchParams({
      search_terms: query,
      page: String(options.page || 1),
      page_size: String(options.page_size || 20),
      json: '1',
    });

    if (options.country) {
      params.append('countries_tags', options.country);
    }

    const response = await fetch(`${OFF_SEARCH_BASE}/search.pl?${params}`);
    
    if (!response.ok) {
      throw new Error('Failed to search products');
    }

    const data: OFFSearchResponse = await response.json();
    
    return data.products || [];
  } catch (error) {
    console.error('Error searching products on OpenFoodFacts:', error);
    return [];
  }
}

/**
 * Recherche avancée de produits (API v2)
 */
export async function advancedSearch(
  options: OFFSearchOptions = {}
): Promise<OFFSearchResponse> {
  try {
    await rateLimit();

    const params = new URLSearchParams({
      page: String(options.page || 1),
      page_size: String(options.page_size || 20),
    });

    if (options.country) {
      params.append('countries_tags_en', options.country);
    }

    if (options.categories && options.categories.length > 0) {
      params.append('categories_tags', options.categories.join(','));
    }

    if (options.brands && options.brands.length > 0) {
      params.append('brands_tags', options.brands.join(','));
    }

    const response = await fetch(`${OFF_API_V2_BASE}/search?${params}`);
    
    if (!response.ok) {
      throw new Error('Failed to perform advanced search');
    }

    const data: OFFSearchResponse = await response.json();
    
    return data;
  } catch (error) {
    console.error('Error in advanced search on OpenFoodFacts:', error);
    return {
      count: 0,
      page: 1,
      page_count: 0,
      page_size: 0,
      products: [],
    };
  }
}

/**
 * Synchronise un produit avec la base locale
 * Note: Cette fonction nécessite un service de stockage local (à implémenter)
 */
export async function syncProduct(ean: string): Promise<SyncResult> {
  const startTime = new Date();
  const result: SyncResult = {
    success: false,
    itemsProcessed: 0,
    itemsAdded: 0,
    itemsUpdated: 0,
    itemsSkipped: 0,
    errors: [],
    startTime,
    endTime: new Date(),
    duration: 0,
  };

  try {
    const offProduct = await getProductByBarcode(ean);
    
    if (!offProduct) {
      result.errors.push(`Product with EAN ${ean} not found on OpenFoodFacts`);
      result.itemsSkipped = 1;
      result.itemsProcessed = 1;
      return result;
    }

    // TODO: Implémenter la logique de sauvegarde dans la base locale
    // Pour l'instant, on mappe juste le produit
    const mappedProduct = mapOFFToProduct(offProduct);
    console.log('Product mapped:', mappedProduct);

    result.success = true;
    result.itemsProcessed = 1;
    result.itemsAdded = 1;
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
  }

  result.endTime = new Date();
  result.duration = result.endTime.getTime() - result.startTime.getTime();

  return result;
}

/**
 * Synchronisation en masse (liste d'EAN)
 */
export async function bulkSync(eans: string[]): Promise<BulkSyncResult> {
  const startTime = new Date();
  const result: BulkSyncResult = {
    success: true,
    itemsProcessed: 0,
    itemsAdded: 0,
    itemsUpdated: 0,
    itemsSkipped: 0,
    errors: [],
    startTime,
    endTime: new Date(),
    duration: 0,
    totalItems: eans.length,
    batches: 0,
    batchResults: [],
  };

  // Traiter par batch de 50
  const batchSize = 50;
  const batches = Math.ceil(eans.length / batchSize);
  result.batches = batches;

  for (let i = 0; i < batches; i++) {
    const batchStart = i * batchSize;
    const batchEnd = Math.min(batchStart + batchSize, eans.length);
    const batchEans = eans.slice(batchStart, batchEnd);

    console.log(`Processing batch ${i + 1}/${batches}...`);

    for (const ean of batchEans) {
      const syncResult = await syncProduct(ean);
      
      result.itemsProcessed += syncResult.itemsProcessed;
      result.itemsAdded += syncResult.itemsAdded;
      result.itemsUpdated += syncResult.itemsUpdated;
      result.itemsSkipped += syncResult.itemsSkipped;
      result.errors.push(...syncResult.errors);

      if (!syncResult.success) {
        result.success = false;
      }
    }

    // Pause entre les batches pour respecter le rate limit
    if (i < batches - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  result.endTime = new Date();
  result.duration = result.endTime.getTime() - result.startTime.getTime();

  return result;
}

/**
 * Récupère les nouveaux produits depuis une date
 * Note: OpenFoodFacts n'a pas d'API native pour filtrer par date de création
 * Cette fonction est un placeholder pour une implémentation future
 */
export async function getNewProductsSince(
  date: Date,
  country?: string
): Promise<OFFProduct[]> {
  console.warn('getNewProductsSince is not fully implemented - OpenFoodFacts API limitation');
  
  // Pour l'instant, on retourne les produits récents via une recherche générale
  // avec tri par date (si disponible)
  try {
    const result = await advancedSearch({
      country,
      page: 1,
      page_size: 100,
    });

    return result.products || [];
  } catch (error) {
    console.error('Error getting new products:', error);
    return [];
  }
}

/**
 * Export du service
 */
export const openFoodFactsService = {
  getProductByBarcode,
  searchProducts,
  advancedSearch,
  syncProduct,
  bulkSync,
  getNewProductsSince,
  mapOFFToProduct,
  parseQuantity,
  mapCategory,
};

export default openFoodFactsService;
