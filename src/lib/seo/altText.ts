/**
 * Image Alt Text Generator for SEO and Accessibility
 * Generates descriptive alt text for images
 */

/**
 * Generate alt text for product images
 */
export function generateProductImageAlt(product: {
  name: string;
  brand?: string;
  size?: string;
  category?: string;
}): string {
  const parts: string[] = [];
  
  if (product.brand) {
    parts.push(product.brand);
  }
  
  parts.push(product.name);
  
  if (product.size) {
    parts.push(product.size);
  }
  
  return parts.join(' ');
}

/**
 * Generate alt text for store/location images
 */
export function generateStoreImageAlt(store: {
  name: string;
  city?: string;
  territory?: string;
}): string {
  const parts = [store.name];
  
  if (store.city) {
    parts.push(`à ${store.city}`);
  } else if (store.territory) {
    parts.push(`en ${store.territory}`);
  }
  
  return parts.join(' ');
}

/**
 * Generate alt text for comparison/chart images
 */
export function generateComparisonImageAlt(data: {
  productName?: string;
  territories?: string[];
  type?: 'chart' | 'graph' | 'comparison';
}): string {
  const parts: string[] = [];
  
  if (data.type === 'chart') {
    parts.push('Graphique');
  } else if (data.type === 'comparison') {
    parts.push('Comparaison');
  }
  
  if (data.productName) {
    parts.push(`des prix de ${data.productName}`);
  } else {
    parts.push('des prix');
  }
  
  if (data.territories && data.territories.length > 0) {
    parts.push(`en ${data.territories.join(', ')}`);
  } else {
    parts.push('en Outre-mer');
  }
  
  return parts.join(' ');
}

/**
 * Generate alt text for territory/map images
 */
export function generateTerritoryImageAlt(territory: {
  name: string;
  type?: 'map' | 'flag' | 'photo';
}): string {
  const typeLabel = territory.type === 'map' ? 'Carte de' : 
                    territory.type === 'flag' ? 'Drapeau de' : '';
  
  return `${typeLabel} ${territory.name}`.trim();
}

/**
 * Generate alt text for logo/brand images
 */
export function generateLogoAlt(brandName: string, context?: string): string {
  if (context) {
    return `Logo ${brandName} - ${context}`;
  }
  return `Logo ${brandName}`;
}

/**
 * Generate alt text for UI/icon images
 */
export function generateIconAlt(iconName: string, action?: string): string {
  if (action) {
    return `Icône ${iconName} - ${action}`;
  }
  return `Icône ${iconName}`;
}

/**
 * Sanitize alt text to remove redundant phrases
 */
export function sanitizeAltText(altText: string): string {
  // Remove redundant phrases like "image of", "picture of", etc.
  return altText
    .replace(/^(image|photo|picture|illustration) (de|of) /i, '')
    .trim();
}

/**
 * Validate alt text for best practices
 */
export function validateAltText(altText: string): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  
  if (!altText || altText.trim().length === 0) {
    warnings.push('Alt text is empty');
    return { valid: false, warnings };
  }
  
  if (altText.length > 125) {
    warnings.push(`Alt text too long (${altText.length} chars, recommended: <125)`);
  }
  
  // Check for redundant phrases
  const redundantPhrases = [
    /^image (of|de)/i,
    /^photo (of|de)/i,
    /^picture (of|de)/i,
  ];
  
  for (const pattern of redundantPhrases) {
    if (pattern.test(altText)) {
      warnings.push('Alt text contains redundant phrase (e.g., "image of")');
      break;
    }
  }
  
  return {
    valid: warnings.length === 0,
    warnings,
  };
}
