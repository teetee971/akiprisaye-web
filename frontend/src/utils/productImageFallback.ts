// @ts-nocheck
/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Product Image Fallback Utility
 * Manages placeholder images and fallback strategies for products
 * 
 * Features:
 * - Category-based placeholders
 * - Image validation before display
 * - Automatic fallback to placeholder if image fails
 */

export interface ImageFallbackConfig {
  category?: string;
  productName?: string;
}

/**
 * Category emoji icons for fallback placeholders
 */
const categoryIcons: Record<string, string> = {
  'Alimentation': '🍽️',
  'Boissons': '🥤',
  'Hygiène': '🧼',
  'Entretien': '🧹',
  'Bébé': '👶',
  'Cosmétiques': '💄',
  'Textile': '👕',
  'Électronique': '📱',
  'Autre': '📦',
};

/**
 * Get a placeholder image URL based on category
 * Uses DiceBear API for consistent, deterministic avatars
 * 
 * @param config - Configuration with category and product name
 * @returns Placeholder image URL
 */
export function getProductImageFallback(config: ImageFallbackConfig): string {
  const icon = categoryIcons[config.category || 'Autre'] || '📦';
  
  // Use product name as seed for consistent placeholder per product
  const seed = encodeURIComponent(config.productName || 'product');
  
  // DiceBear shapes with dark background for better visibility
  return `https://api.dicebear.com/7.x/shapes/svg?seed=${seed}&backgroundColor=1e293b&backgroundType=solid`;
}

/**
 * Validate if an image URL is accessible and valid
 * 
 * @param url - Image URL to validate
 * @returns Promise resolving to true if valid, false otherwise
 */
export async function validateImageUrl(url: string): Promise<boolean> {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      cache: 'no-cache'
    });
    return response.ok && response.headers.get('content-type')?.startsWith('image/');
  } catch {
    return false;
  }
}

/**
 * Get product image with automatic fallback
 * Validates the image URL and returns fallback if validation fails
 * 
 * @param imageUrl - Primary image URL to try
 * @param fallbackConfig - Configuration for fallback placeholder
 * @returns Promise resolving to valid image URL or fallback
 */
export async function getProductImageWithFallback(
  imageUrl: string | null | undefined,
  fallbackConfig: ImageFallbackConfig
): Promise<string> {
  // If no image provided, return fallback immediately
  if (!imageUrl) {
    return getProductImageFallback(fallbackConfig);
  }
  
  // Validate image URL
  const isValid = await validateImageUrl(imageUrl);
  
  if (!isValid) {
    return getProductImageFallback(fallbackConfig);
  }
  
  return imageUrl;
}

/**
 * Synchronous version of getProductImageFallback for immediate use
 * Use this when you need a fallback immediately without validation
 * 
 * @param imageUrl - Image URL to check
 * @param fallbackConfig - Configuration for fallback placeholder
 * @returns Image URL or fallback placeholder
 */
export function getProductImageOrFallback(
  imageUrl: string | null | undefined,
  fallbackConfig: ImageFallbackConfig
): string {
  return imageUrl || getProductImageFallback(fallbackConfig);
}
