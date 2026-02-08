/**
 * Product Name Normalization Service
 * 
 * Normalizes product names for better deduplication and matching
 */

/**
 * Normalize a product name for comparison
 * 
 * Steps:
 * 1. Convert to lowercase
 * 2. Remove special characters
 * 3. Remove extra spaces
 * 4. Remove common prefixes/suffixes
 * 5. Standardize units
 */
export function normalizeProductName(name: string): string {
  if (!name || typeof name !== 'string') {
    return '';
  }

  let normalized = name;

  // Convert to lowercase
  normalized = normalized.toLowerCase();

  // Remove accents and diacritics
  normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Remove brand markers and common prefixes
  const prefixesToRemove = [
    'marque',
    'brand',
    'produit',
    'product',
    'lot',
    'pack',
    'paquet',
  ];
  prefixesToRemove.forEach((prefix) => {
    const regex = new RegExp(`^${prefix}\\s+`, 'gi');
    normalized = normalized.replace(regex, '');
  });

  // Standardize units
  const unitReplacements: Record<string, string> = {
    'kilogramme': 'kg',
    'kilogrammes': 'kg',
    'gramme': 'g',
    'grammes': 'g',
    'litre': 'l',
    'litres': 'l',
    'millilitre': 'ml',
    'millilitres': 'ml',
    'centilitre': 'cl',
    'centilitres': 'cl',
  };

  Object.entries(unitReplacements).forEach(([full, abbr]) => {
    const regex = new RegExp(`\\b${full}\\b`, 'gi');
    normalized = normalized.replace(regex, abbr);
  });

  // Remove special characters except spaces, hyphens, and alphanumeric
  normalized = normalized.replace(/[^a-z0-9\s\-]/g, ' ');

  // Replace multiple spaces with single space
  normalized = normalized.replace(/\s+/g, ' ');

  // Trim
  normalized = normalized.trim();

  return normalized;
}

/**
 * Extract quantity from product name if present
 */
export function extractQuantity(name: string): string | null {
  if (!name) return null;

  // Common patterns: "500g", "1.5L", "2 x 500ml", etc.
  const patterns = [
    /(\d+(?:[.,]\d+)?)\s*(?:kg|g|l|ml|cl)/gi,
    /(\d+)\s*x\s*(\d+(?:[.,]\d+)?)\s*(?:kg|g|l|ml|cl)/gi,
  ];

  for (const pattern of patterns) {
    const match = name.match(pattern);
    if (match) {
      return match[0];
    }
  }

  return null;
}

/**
 * Clean product name by removing quantity information
 */
export function cleanProductName(name: string): string {
  if (!name) return '';

  let cleaned = name;

  // Remove quantity patterns
  cleaned = cleaned.replace(/\d+(?:[.,]\d+)?\s*(?:kg|g|l|ml|cl)\b/gi, '');
  cleaned = cleaned.replace(/\d+\s*x\s*\d+(?:[.,]\d+)?\s*(?:kg|g|l|ml|cl)\b/gi, '');

  // Remove trailing/leading spaces and hyphens
  cleaned = cleaned.replace(/^[\s\-]+|[\s\-]+$/g, '');

  // Replace multiple spaces with single space
  cleaned = cleaned.replace(/\s+/g, ' ');

  return cleaned.trim();
}

/**
 * Generate search variations of a product name
 */
export function generateSearchVariations(name: string): string[] {
  const variations: string[] = [];
  const normalized = normalizeProductName(name);

  // Add the normalized version
  variations.push(normalized);

  // Add without quantity
  const withoutQuantity = normalizeProductName(cleanProductName(name));
  if (withoutQuantity !== normalized) {
    variations.push(withoutQuantity);
  }

  // Add individual words (for partial matching)
  const words = normalized.split(/\s+/).filter((w) => w.length > 2);
  variations.push(...words);

  // Remove duplicates
  return Array.from(new Set(variations));
}
