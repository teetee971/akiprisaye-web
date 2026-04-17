/**
 * Admin Product Service
 * CRUD operations for product management
 */

import type { ProductCategory, Unit } from '../../types/product';
import { adminFetchJson } from './adminApiClient';

// ── Static preview fallback ───────────────────────────────────────────────────

interface RawCatalogueItem {
  name?: string;
  price?: number;
  store?: string;
  category?: string;
  observations?: { date: string; store: string; price: number }[];
  tags?: string[];
}

function mapCategoryToProductCategory(raw: string): ProductCategory {
  const u = (raw ?? '').toUpperCase();
  if (u.includes('LÉGUME') || u.includes('LEGUME') || u.includes('FRUIT')) return 'fruits-legumes';
  if (u.includes('LAIT') || u.includes('YAOURT') || u.includes('FROMAGE'))
    return 'produits-laitiers';
  if (u.includes('VIANDE') || u.includes('BOEUF') || u.includes('PORC') || u.includes('VOLAILLE'))
    return 'viande';
  if (u.includes('POISSON') || u.includes('FRUITS DE MER')) return 'poisson';
  if (u.includes('BOISSON') || u.includes('JUS') || u.includes('EAU') || u.includes('SODA'))
    return 'boissons';
  if (u.includes('HYGIÈNE') || u.includes('HYGIENE') || u.includes('BEAUTÉ') || u.includes('SOIN'))
    return 'hygiene';
  if (u.includes('ENTRETIEN') || u.includes('NETTOYAGE') || u.includes('LESSIVE'))
    return 'entretien';
  if (u.includes('BÉBÉ') || u.includes('BEBE')) return 'bebe';
  if (u.includes('SURGELÉ') || u.includes('SURGELE')) return 'surgeles';
  if (
    u.includes('PAIN') ||
    u.includes('PÂTISSERIE') ||
    u.includes('PATISSERIE') ||
    u.includes('BOULANG')
  )
    return 'pain-patisserie';
  if (
    u.includes('ÉPICERIE') ||
    u.includes('EPICERIE') ||
    u.includes('CONSERVE') ||
    u.includes('CONDIMENT')
  )
    return 'epicerie';
  if (u.includes('ALIMENTAIRE') || u.includes('CEREAL') || u.includes('CÉRÉALE'))
    return 'alimentaire';
  return 'autre';
}

function inferUnit(name: string): Unit {
  const u = name.toUpperCase();
  if (/\d+(ML|CL)/.test(u)) return 'ml';
  if (/\d+L\b/.test(u)) return 'L';
  if (/\d+KG/.test(u)) return 'kg';
  if (/\d+G\b/.test(u)) return 'g';
  return 'unité';
}

function slugify(text: string, index: number): string {
  return `static-${index}-${text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 40)}`;
}

let _staticProductsCache: Product[] | null = null;

export async function getProductsStatic(): Promise<Product[]> {
  if (_staticProductsCache) return _staticProductsCache;
  try {
    const res = await fetch('/data/catalogue.json');
    if (!res.ok) throw new Error('catalogue.json not found');
    const raw: RawCatalogueItem[] = await res.json();
    _staticProductsCache = raw.map(
      (item, idx): Product => ({
        id: slugify(item.name ?? `product-${idx}`, idx),
        name: item.name ?? `Produit ${idx + 1}`,
        brand: item.tags?.find((t) => !['LOCAL', 'BIO', 'SOUVERAIN', 'PROMO'].includes(t)),
        category: mapCategoryToProductCategory(item.category ?? ''),
        ean: undefined,
        unit: inferUnit(item.name ?? ''),
        quantity: 1,
      })
    );
    return _staticProductsCache;
  } catch {
    return [];
  }
}

export async function getProductStatic(id: string): Promise<Product | null> {
  const all = await getProductsStatic();
  return all.find((p) => p.id === id) ?? null;
}

export interface Product {
  id: string;
  name: string;
  brand?: string;
  category: ProductCategory;
  ean?: string;
  description?: string;
  unit: Unit;
  quantity: number;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductInput {
  name: string;
  brand?: string;
  category: ProductCategory;
  ean?: string;
  description?: string;
  unit: Unit;
  quantity: number;
  imageUrl?: string;
}

export interface UpdateProductInput {
  name?: string;
  brand?: string;
  category?: ProductCategory;
  ean?: string;
  description?: string;
  unit?: Unit;
  quantity?: number;
  imageUrl?: string;
}

export interface ProductSearchFilters {
  category?: ProductCategory;
  brand?: string;
  search?: string;
  hasEan?: boolean;
}

/**
 * Fetch all products with filters and pagination
 */
export async function getProducts(
  filters: ProductSearchFilters = {},
  page = 1,
  limit = 20
): Promise<{ products: Product[]; total: number; page: number; totalPages: number }> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (filters.category) params.append('category', filters.category);
  if (filters.brand) params.append('brand', filters.brand);
  if (filters.search) params.append('search', filters.search);
  if (filters.hasEan !== undefined) params.append('hasEan', filters.hasEan.toString());

  return adminFetchJson(`/admin/products?${params}`);
}

/**
 * Get a single product by ID
 */
export async function getProduct(id: string): Promise<Product> {
  return adminFetchJson(`/admin/products/${id}`);
}

/**
 * Create a new product
 */
export async function createProduct(data: CreateProductInput): Promise<Product> {
  return adminFetchJson('/admin/products', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update an existing product
 */
export async function updateProduct(id: string, data: UpdateProductInput): Promise<Product> {
  return adminFetchJson(`/admin/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete a product
 */
export async function deleteProduct(id: string): Promise<void> {
  await adminFetchJson(`/admin/products/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Search OpenFoodFacts by EAN
 */
export async function searchOpenFoodFacts(ean: string): Promise<any> {
  const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${ean}.json`);

  if (!response.ok) {
    throw new Error('Product not found on OpenFoodFacts');
  }

  const data = await response.json();

  if (data.status === 0) {
    throw new Error('Product not found on OpenFoodFacts');
  }

  if (!data.product) {
    throw new Error('Invalid product data from OpenFoodFacts');
  }

  return {
    name: data.product.product_name || '',
    brand: data.product.brands || '',
    category: data.product.categories || '',
    imageUrl: data.product.image_url || '',
    quantity: data.product.quantity || '',
  };
}
