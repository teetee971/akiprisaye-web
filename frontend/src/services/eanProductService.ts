/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * EAN Product Service with Strict Validation and Traceability
 * Handles EAN-based product lookup with fallback for unknown products
 * 
 * Rules (PR #1 Foundation):
 * - No silent product creation
 * - All data must be sourced and traced
 * - Clear status indication (confirmé/partiel/non_référencé)
 * - Fallback to minimal product structure for unknown EANs
 */

import { validateEan } from './eanValidator';
import type {
  ProductResult,
  Product,
  PartialProduct,
  NonReferencedProduct,
  EanStatus,
  ProductTraceability,
  Territoire,
  DataSource
} from '../types/ean';

/**
 * Product images from Open Food Facts
 */
export interface ProductImages {
  imageUrl: string | null;
  imageThumbnail: string | null;
  imageFront?: string | null;
  imageIngredients?: string | null;
  imageNutrition?: string | null;
  productName?: string | null;
  brands?: string | null;
  quantity?: string | null;
}

const OFF_CACHE = new Map<string, ProductImages>();

/**
 * Product lookup result with validation
 */
export interface ProductLookupResult {
  success: boolean;
  product?: ProductResult;
  error?: string;
  validation: {
    eanValid: boolean;
    format: string | null;
    checksumValid: boolean;
  };
}

/**
 * Options for product lookup
 */
export interface ProductLookupOptions {
  territoire: Territoire;
  source?: DataSource;
  magasin?: string;
}

/**
 * Look up product by EAN with strict validation
 * Returns fallback for valid but unknown EANs
 * 
 * @param ean - EAN code to look up
 * @param options - Lookup options (territoire required)
 * @returns Product lookup result with validation status
 */
export async function lookupProductByEan(
  ean: string,
  options: ProductLookupOptions
): Promise<ProductLookupResult> {
  // Step 1: Validate EAN format and checksum
  const validation = validateEan(ean);

  if (!validation.valid) {
    return {
      success: false,
      error: validation.error || 'Code EAN invalide',
      validation: {
        eanValid: false,
        format: validation.format,
        checksumValid: validation.checksum
      }
    };
  }

  // Step 2: Create traceability metadata
  const traceability: ProductTraceability = {
    source: options.source || 'observation_citoyenne',
    dateObservation: new Date().toISOString(),
    territoire: options.territoire,
    magasin: options.magasin
  };

  // Step 3: Try to fetch product from database
  try {
    const product = await fetchProductFromDatabase(validation.ean);

    if (product) {
      // Step 3a: Enrich with images from Open Food Facts if no image exists
      if (!product.imageUrl) {
        const images = await enrichProductWithImages(validation.ean);
        if (images.imageUrl) {
          product.imageUrl = images.imageUrl;
        }
      }
      
      // Product found - return with confirmed or partial status
      const result = {
        ...product,
        traceability
      } as ProductResult;

      return {
        success: true,
        product: result,
        validation: {
          eanValid: true,
          format: validation.format,
          checksumValid: true
        }
      };
    }
  } catch (error) {
    console.error('Database lookup error:', error);
    // Continue to fallback - don't fail on database errors
  }

  // Step 4: Try Open Food Facts for unknown products
  try {
    const images = await enrichProductWithImages(validation.ean);

    if (images.imageUrl || images.productName || images.brands) {
      // Found in Open Food Facts - create partial product
      const offProduct: PartialProduct = {
        ean: validation.ean,
        status: 'partiel',
        nom: images.productName || `Produit (EAN: ${validation.ean})`,
        marque: images.brands || undefined,
        imageUrl: images.imageUrl || undefined,
        traceability: {
          ...traceability,
          source: 'open_food_facts'
        }
      };
      
      return {
        success: true,
        product: offProduct,
        validation: {
          eanValid: true,
          format: validation.format,
          checksumValid: true
        }
      };
    }
  } catch (error) {
    console.error('Open Food Facts lookup error:', error);
    // Continue to fallback
  }

  // Step 5: Fallback for valid EAN not in database or Open Food Facts
  const fallbackProduct: NonReferencedProduct = {
    ean: validation.ean,
    status: 'non_référencé',
    nom: 'Produit non référencé',
    traceability
  };

  return {
    success: true,
    product: fallbackProduct,
    validation: {
      eanValid: true,
      format: validation.format,
      checksumValid: true
    }
  };
}

/**
 * Enrich product with images from Open Food Facts
 * Fetches product images from Open Food Facts API
 * 
 * @param ean - Product EAN code
 * @returns Product images or null values if not found
 */
async function enrichProductWithImages(ean: string): Promise<ProductImages> {
  const cached = OFF_CACHE.get(ean);
  if (cached) return cached;

  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${ean}.json`,
      {
        headers: {
          'User-Agent': 'AKiPriSaYe/2.1.0 (Contact: app@akiprisaye.fr)'
        }
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        console.warn(`[IMAGES] Open Food Facts rate limit reached for EAN ${ean}. Please retry later.`);
      } else {
        console.warn(`[IMAGES] Open Food Facts API error for EAN ${ean}: ${response.status}`);
      }
      const empty = { imageUrl: null, imageThumbnail: null };
      OFF_CACHE.set(ean, empty);
      return empty;
    }

    const data = await response.json();

    if (data.status === 1 && data.product) {
      const product = data.product;
      const resolved = {
        imageUrl: product.image_url || product.image_front_url || null,
        imageThumbnail: product.image_small_url || product.image_thumb_url || null,
        imageFront: product.image_front_url || null,
        imageIngredients: product.image_ingredients_url || null,
        imageNutrition: product.image_nutrition_url || null,
        productName: product.product_name || null,
        brands: product.brands || null,
        quantity: product.quantity || null,
      };
      OFF_CACHE.set(ean, resolved);
      return resolved;
    }
  } catch (error) {
    console.error('[IMAGES] Error fetching from Open Food Facts:', error);
  }

  const empty = { imageUrl: null, imageThumbnail: null };
  OFF_CACHE.set(ean, empty);
  return empty;
}

/**
 * Fetch product from local database
 * This is a placeholder that should be replaced with actual database logic
 * 
 * @param ean - Validated EAN code
 * @returns Product data or null if not found
 */
async function fetchProductFromDatabase(ean: string): Promise<ProductResult | null> {
  try {
    // Try to fetch from public data file
    const response = await fetch(`${import.meta.env.BASE_URL}data/prices.json`, { cache: 'no-store' });
    
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const found = Array.isArray(data) 
      ? data.filter((p: any) => p.ean === ean)[0]
      : null;

    if (found) {
      // Determine status based on data completeness
      const hasAllRequiredFields = found.nom && found.marque && found.categorie;
      const status: EanStatus = hasAllRequiredFields ? 'confirmé' : 'partiel';

      if (status === 'confirmé' && found.nom && found.marque && found.categorie) {
        // Create a temporary traceability - will be replaced by caller
        const tempTraceability: ProductTraceability = {
          source: 'base_officielle' as DataSource,
          dateObservation: new Date().toISOString(),
          territoire: 'martinique' as Territoire
        };
        
        return {
          ean: found.ean,
          status: 'confirmé',
          nom: found.name || found.nom,
          marque: found.marque || found.brand,
          categorie: found.categorie || found.category,
          contenance: found.contenance || found.size || undefined,
          prix: found.prix || found.price ? parseFloat(String(found.prix || found.price).replace(/[^\d.,]/g, '').replace(',', '.')) : undefined,
          devise: '€',
          imageUrl: found.imageUrl || found.image || undefined,
          description: found.description || undefined,
          traceability: tempTraceability
        } as Product;
      } else if (found.nom || found.name) {
        // Create a temporary traceability - will be replaced by caller
        const tempTraceability: ProductTraceability = {
          source: 'base_officielle' as DataSource,
          dateObservation: new Date().toISOString(),
          territoire: 'martinique' as Territoire
        };
        
        return {
          ean: found.ean,
          status: 'partiel',
          nom: found.name || found.nom,
          marque: found.marque || found.brand || undefined,
          categorie: found.categorie || found.category || undefined,
          traceability: tempTraceability
        } as PartialProduct;
      }
    }

    return null;
  } catch (error) {
    console.error('Error fetching from database:', error);
    return null;
  }
}

/**
 * Check if product is confirmed (has complete data)
 */
export function isConfirmedProduct(product: ProductResult): product is Product {
  return product.status === 'confirmé';
}

/**
 * Check if product is partial (incomplete data)
 */
export function isPartialProduct(product: ProductResult): product is PartialProduct {
  return product.status === 'partiel';
}

/**
 * Check if product is non-referenced (valid EAN but unknown)
 */
export function isNonReferencedProduct(product: ProductResult): product is NonReferencedProduct {
  return product.status === 'non_référencé';
}

/**
 * Get user-friendly status message
 */
export function getProductStatusMessage(status: EanStatus): string {
  switch (status) {
    case 'confirmé':
      return 'Produit confirmé dans notre base de données';
    case 'partiel':
      return 'Produit trouvé mais données incomplètes';
    case 'non_référencé':
      return 'Code EAN valide mais produit non répertorié';
    default:
      return 'Statut inconnu';
  }
}

/**
 * Format product for display with fallback values
 */
export function formatProductForDisplay(product: ProductResult) {
  return {
    ean: product.ean,
    nom: product.nom || 'Produit inconnu',
    marque: isConfirmedProduct(product) ? product.marque : 'Non spécifiée',
    categorie: isConfirmedProduct(product) ? product.categorie : 'Non spécifiée',
    prix: isConfirmedProduct(product) && product.prix 
      ? `${product.prix.toFixed(2)} ${product.devise || '€'}`
      : 'Prix non disponible',
    status: product.status,
    statusMessage: getProductStatusMessage(product.status),
    source: product.traceability.source,
    territoire: product.traceability.territoire,
    magasin: product.traceability.magasin || 'Non spécifié',
    dateObservation: new Date(product.traceability.dateObservation).toLocaleDateString('fr-FR')
  };
}
