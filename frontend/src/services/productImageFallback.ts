/**
 * Product Image Fallback Service
 *
 * Provides category-based fallback icons/illustrations when product images
 * are not available from Open Food Facts or other sources.
 *
 * Features:
 * - Category-based SVG icons
 * - Color-coded by category
 * - Responsive and accessible
 * - No external dependencies
 *
 * @module productImageFallback
 */

import type { ProductCategory as BaseProductCategory } from '../types/product';

// Extend with additional fallback-specific categories if needed
export type ProductCategory = BaseProductCategory;

export interface FallbackIcon {
  category: ProductCategory;
  icon: string; // Emoji or SVG data URI
  color: string; // Hex color for background
  label: string;
}

/**
 * Category icon mapping with emojis
 * Using emojis for simplicity and universal support
 */
const CATEGORY_ICONS: Record<ProductCategory, FallbackIcon> = {
  alimentaire: {
    category: 'alimentaire',
    icon: '🍽️',
    color: '#4CAF50',
    label: 'Alimentation',
  },
  boissons: {
    category: 'boissons',
    icon: '🥤',
    color: '#2196F3',
    label: 'Boissons',
  },
  hygiene: {
    category: 'hygiene',
    icon: '🧴',
    color: '#9C27B0',
    label: 'Hygiène',
  },
  entretien: {
    category: 'entretien',
    icon: '🧹',
    color: '#FF9800',
    label: 'Entretien',
  },
  bebe: {
    category: 'bebe',
    icon: '👶',
    color: '#E91E63',
    label: 'Bébé',
  },
  viande: {
    category: 'viande',
    icon: '🥩',
    color: '#D32F2F',
    label: 'Viande',
  },
  poisson: {
    category: 'poisson',
    icon: '🐟',
    color: '#0097A7',
    label: 'Poisson',
  },
  'fruits-legumes': {
    category: 'fruits-legumes',
    icon: '🥗',
    color: '#689F38',
    label: 'Fruits & Légumes',
  },
  'pain-patisserie': {
    category: 'pain-patisserie',
    icon: '🥖',
    color: '#F57C00',
    label: 'Pain & Pâtisserie',
  },
  'produits-laitiers': {
    category: 'produits-laitiers',
    icon: '🥛',
    color: '#1976D2',
    label: 'Produits Laitiers',
  },
  epicerie: {
    category: 'epicerie',
    icon: '🛒',
    color: '#7B1FA2',
    label: 'Épicerie',
  },
  surgeles: {
    category: 'surgeles',
    icon: '🧊',
    color: '#0288D1',
    label: 'Surgelés',
  },
  autre: {
    category: 'autre',
    icon: '📦',
    color: '#757575',
    label: 'Autre',
  },
};

/**
 * Get fallback icon for a product category
 *
 * @param category - Product category
 * @returns Fallback icon data
 */
export function getFallbackIcon(category: ProductCategory | string): FallbackIcon {
  const normalizedCategory = category.toLowerCase() as ProductCategory;
  return CATEGORY_ICONS[normalizedCategory] || CATEGORY_ICONS['autre'];
}

/**
 * Generate a data URI for an SVG fallback image
 *
 * @param category - Product category
 * @param size - Image size in pixels (default: 200)
 * @returns Data URI for SVG image
 */
export function generateFallbackImageDataUri(
  category: ProductCategory | string,
  size: number = 200
): string {
  const fallback = getFallbackIcon(category);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="${size}" height="${size}" fill="${fallback.color}" opacity="0.1" rx="12"/>
      <text
        x="50%"
        y="50%"
        font-size="${size * 0.4}"
        text-anchor="middle"
        dominant-baseline="middle"
      >
        ${fallback.icon}
      </text>
      <text
        x="50%"
        y="${size * 0.85}"
        font-size="${size * 0.08}"
        text-anchor="middle"
        fill="#666"
        font-family="system-ui, -apple-system, sans-serif"
      >
        ${fallback.label}
      </text>
    </svg>
  `;

  // Encode SVG to data URI
  const encodedSvg = encodeURIComponent(svg).replace(/'/g, '%27').replace(/"/g, '%22');

  return `data:image/svg+xml,${encodedSvg}`;
}

/**
 * Get all available categories with their icons
 *
 * @returns Array of all category icons
 */
export function getAllCategoryIcons(): FallbackIcon[] {
  return Object.values(CATEGORY_ICONS);
}

/**
 * Detect category from product name or description
 * Simple heuristic-based detection
 *
 * @param productName - Product name or description
 * @returns Detected category or 'autre'
 */
export function detectCategoryFromName(productName: string): ProductCategory {
  if (!productName) return 'autre';

  const name = productName.toLowerCase();

  // Boissons
  if (/(eau|jus|soda|coca|pepsi|limonade|thé|café|vin|bière)/i.test(name)) {
    return 'boissons';
  }

  // Viande
  if (/(viande|poulet|boeuf|porc|agneau|steak|saucisse|jambon)/i.test(name)) {
    return 'viande';
  }

  // Poisson
  if (/(poisson|thon|saumon|sardine|crevette|fruits de mer)/i.test(name)) {
    return 'poisson';
  }

  // Fruits & Légumes
  if (/(fruit|légume|pomme|banane|orange|tomate|salade|carotte)/i.test(name)) {
    return 'fruits-legumes';
  }

  // Pain & Pâtisserie
  if (/(pain|baguette|croissant|brioche|gâteau|pâtisserie)/i.test(name)) {
    return 'pain-patisserie';
  }

  // Produits laitiers
  if (/(lait|yaourt|fromage|beurre|crème fraîche)/i.test(name)) {
    return 'produits-laitiers';
  }

  // Hygiène
  if (/(savon|shampoing|dentifrice|déodorant|gel douche|crème)/i.test(name)) {
    return 'hygiene';
  }

  // Entretien
  if (/(lessive|détergent|nettoyant|javel|éponge|papier toilette)/i.test(name)) {
    return 'entretien';
  }

  // Bébé
  if (/(bébé|couche|lait infantile|biberon|tétine)/i.test(name)) {
    return 'bebe';
  }

  // Surgelés
  if (/(surgelé|congelé|glace|sorbet)/i.test(name)) {
    return 'surgeles';
  }

  // Default to alimentaire for food-related terms, else 'autre'
  if (/(alimentaire|aliment|nourriture|cuisine)/i.test(name)) {
    return 'alimentaire';
  }

  return 'autre';
}

/**
 * Create a complete fallback image object
 *
 * @param category - Product category
 * @param productName - Optional product name for category detection
 * @returns Image data with fallback
 */
export function createFallbackImage(
  category?: ProductCategory | string,
  productName?: string
): {
  url: string;
  thumbnailUrl: string;
  source: 'fallback';
  category: ProductCategory;
  fallback: FallbackIcon;
} {
  // Detect category from name if not provided
  const detectedCategory = category
    ? (category as ProductCategory)
    : detectCategoryFromName(productName || '');

  const fallback = getFallbackIcon(detectedCategory);

  return {
    url: generateFallbackImageDataUri(detectedCategory, 400),
    thumbnailUrl: generateFallbackImageDataUri(detectedCategory, 100),
    source: 'fallback',
    category: detectedCategory,
    fallback,
  };
}

/**
 * Check if an image URL is a fallback image
 *
 * @param url - Image URL
 * @returns True if the URL is a fallback data URI
 */
export function isFallbackImage(url: string): boolean {
  return url.startsWith('data:image/svg+xml,');
}

/**
 * Generate a placeholder loading image
 *
 * @param size - Image size in pixels
 * @returns Data URI for loading placeholder
 */
export function generateLoadingPlaceholder(size: number = 200): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="${size}" height="${size}" fill="#f0f0f0" rx="12"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.15}" fill="#ccc">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite"/>
      </circle>
    </svg>
  `;

  const encodedSvg = encodeURIComponent(svg).replace(/'/g, '%27').replace(/"/g, '%22');

  return `data:image/svg+xml,${encodedSvg}`;
}

/**
 * Generate an error placeholder image
 *
 * @param size - Image size in pixels
 * @returns Data URI for error placeholder
 */
export function generateErrorPlaceholder(size: number = 200): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="${size}" height="${size}" fill="#ffebee" rx="12"/>
      <text
        x="50%"
        y="50%"
        font-size="${size * 0.3}"
        text-anchor="middle"
        dominant-baseline="middle"
      >
        ❌
      </text>
      <text
        x="50%"
        y="${size * 0.8}"
        font-size="${size * 0.08}"
        text-anchor="middle"
        fill="#c62828"
        font-family="system-ui, -apple-system, sans-serif"
      >
        Image non disponible
      </text>
    </svg>
  `;

  const encodedSvg = encodeURIComponent(svg).replace(/'/g, '%27').replace(/"/g, '%22');

  return `data:image/svg+xml,${encodedSvg}`;
}
