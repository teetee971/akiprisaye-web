 
/**
 * Product Image Enrichment Service
 * 
 * Automatically fetches and enriches product images from Open Food Facts
 * with caching, validation, and fallback mechanisms.
 * 
 * Features:
 * - Automatic image fetching from Open Food Facts API
 * - Image URL validation and caching
 * - Multiple image quality options (thumbnail, small, large, original)
 * - Fallback to category-based icons
 * - GDPR-compliant with no personal data storage
 * 
 * @module enrichProductWithImages
 */

import { fetchProductFromOpenFoodFacts } from '../data/openFoodFacts';
import { safeLocalStorage } from '../utils/safeLocalStorage';

export interface ProductImageData {
  productId: string;
  barcode?: string;
  images: {
    thumbnail?: string;
    small?: string;
    medium?: string;
    large?: string;
    original?: string;
  };
  source: 'openfoodfacts' | 'user' | 'fallback';
  lastUpdated: string;
  validated: boolean;
}

export interface ImageCacheEntry {
  url: string;
  validated: boolean;
  timestamp: number;
  expiresAt: number;
}

// Cache duration: 7 days
const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const IMAGE_CACHE_KEY = 'product_images_cache';

/**
 * Get image cache from safeLocalStorage
 */
function getImageCache(): Map<string, ImageCacheEntry> {
  try {
    const cacheData = safeLocalStorage.getItem(IMAGE_CACHE_KEY);
    if (!cacheData) {
      return new Map();
    }
    const parsed = JSON.parse(cacheData);
    return new Map(Object.entries(parsed));
  } catch (error) {
    console.error('Failed to load image cache:', error);
    return new Map();
  }
}

/**
 * Save image cache to safeLocalStorage
 */
function saveImageCache(cache: Map<string, ImageCacheEntry>): void {
  try {
    const cacheObj = Object.fromEntries(cache);
    safeLocalStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(cacheObj));
  } catch (error) {
    console.error('Failed to save image cache:', error);
  }
}

/**
 * Validate if image URL is accessible
 */
async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok && (response.headers.get('content-type')?.startsWith('image/') ?? false);
  } catch (error) {
    return false;
  }
}

/**
 * Clean expired cache entries
 */
function cleanExpiredCache(cache: Map<string, ImageCacheEntry>): void {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (entry.expiresAt < now) {
      cache.delete(key);
    }
  }
}

/**
 * Enrich product with images from Open Food Facts
 * 
 * @param barcode - Product EAN/barcode
 * @param forceRefresh - Force refresh from API even if cached
 * @returns Product image data or null if not found
 */
export async function enrichProductWithImages(
  barcode: string,
  forceRefresh: boolean = false
): Promise<ProductImageData | null> {
  if (!barcode) {
    return null;
  }

  // Check cache first
  const cache = getImageCache();
  cleanExpiredCache(cache);
  
  const cacheKey = `img_${barcode}`;
  const cached = cache.get(cacheKey);
  
  if (cached && !forceRefresh && cached.validated) {
    // Return cached data if still valid
    return {
      productId: barcode,
      barcode,
      images: {
        original: cached.url,
        large: cached.url,
        medium: cached.url,
        small: cached.url,
        thumbnail: cached.url
      },
      source: 'openfoodfacts',
      lastUpdated: new Date(cached.timestamp).toISOString(),
      validated: true
    };
  }

  try {
    // Fetch from Open Food Facts
    const productData = await fetchProductFromOpenFoodFacts(barcode) as { imageUrl?: string; imageSmallUrl?: string } | null;
    
    if (!productData || !productData.imageUrl) {
      return null;
    }

    // Validate the main image URL
    const isValid = await validateImageUrl(productData.imageUrl);
    
    const imageData: ProductImageData = {
      productId: barcode,
      barcode,
      images: {
        original: productData.imageUrl,
        large: productData.imageUrl,
        medium: productData.imageUrl,
        small: productData.imageSmallUrl || productData.imageUrl,
        thumbnail: productData.imageSmallUrl || productData.imageUrl
      },
      source: 'openfoodfacts',
      lastUpdated: new Date().toISOString(),
      validated: isValid
    };

    // Cache the result
    const now = Date.now();
    cache.set(cacheKey, {
      url: productData.imageUrl,
      validated: isValid,
      timestamp: now,
      expiresAt: now + CACHE_DURATION_MS
    });
    saveImageCache(cache);

    return imageData;
  } catch (error) {
    console.error('Error enriching product with images:', error);
    return null;
  }
}

/**
 * Batch enrich multiple products with images
 * 
 * @param barcodes - Array of product EAN/barcodes
 * @param maxConcurrent - Maximum concurrent API requests (default: 5)
 * @returns Map of barcode to image data
 */
export async function batchEnrichProductImages(
  barcodes: string[],
  maxConcurrent: number = 5
): Promise<Map<string, ProductImageData>> {
  const results = new Map<string, ProductImageData>();
  
  // Process in batches to avoid overwhelming the API
  for (let i = 0; i < barcodes.length; i += maxConcurrent) {
    const batch = barcodes.slice(i, i + maxConcurrent);
    const promises = batch.map(barcode => enrichProductWithImages(barcode));
    const batchResults = await Promise.all(promises);
    
    batchResults.forEach((result, index) => {
      if (result) {
        results.set(batch[index], result);
      }
    });
    
    // Small delay between batches to be respectful to the API
    if (i + maxConcurrent < barcodes.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return results;
}

/**
 * Clear image cache
 */
export function clearImageCache(): void {
  try {
    safeLocalStorage.removeItem(IMAGE_CACHE_KEY);
  } catch (error) {
    console.error('Failed to clear image cache:', error);
  }
}

/**
 * Get cache statistics
 */
export function getImageCacheStats(): {
  totalEntries: number;
  validatedEntries: number;
  expiredEntries: number;
  cacheSize: number;
} {
  const cache = getImageCache();
  const now = Date.now();
  
  let validatedCount = 0;
  let expiredCount = 0;
  
  for (const entry of cache.values()) {
    if (entry.validated) validatedCount++;
    if (entry.expiresAt < now) expiredCount++;
  }
  
  // Estimate cache size in bytes
  const cacheData = safeLocalStorage.getItem(IMAGE_CACHE_KEY);
  const cacheSize = cacheData ? new Blob([cacheData]).size : 0;
  
  return {
    totalEntries: cache.size,
    validatedEntries: validatedCount,
    expiredEntries: expiredCount,
    cacheSize
  };
}

/**
 * Preload images for better UX
 */
export function preloadProductImage(imageUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to preload image'));
    img.src = imageUrl;
  });
}
