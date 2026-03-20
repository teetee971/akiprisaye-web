/**
 * seoHelpers.ts — SEO utility functions
 *
 * Provides helpers for:
 *   - Generating SEO-friendly slugs
 *   - Building JSON-LD Product schema
 *   - Creating meta descriptions
 *   - Territory display names
 */

import type { CompareProduct, CompareSummary, PriceObservationRow } from '../types/compare';

// ── Site constants ─────────────────────────────────────────────────────────────

export const SITE_URL = 'https://teetee971.github.io/akiprisaye-web';
export const SITE_NAME = 'A KI PRI SA YÉ';

// ── Territory display names ────────────────────────────────────────────────────

export const TERRITORY_NAMES: Record<string, string> = {
  GP: 'Guadeloupe',
  MQ: 'Martinique',
  GF: 'Guyane',
  RE: 'La Réunion',
  YT: 'Mayotte',
  PM: 'Saint-Pierre-et-Miquelon',
  BL: 'Saint-Barthélemy',
  MF: 'Saint-Martin',
  WF: 'Wallis-et-Futuna',
  PF: 'Polynésie française',
  NC: 'Nouvelle-Calédonie',
  FR: 'France',
};

/**
 * Get display name for a territory code
 */
export function getTerritoryName(code: string): string {
  return TERRITORY_NAMES[code] ?? code;
}

// ── Slug generation ────────────────────────────────────────────────────────────

/**
 * Generate a URL-safe slug from product name and territory
 */
export function generateProductSlug(name: string, territory: string): string {
  const normalized = `${name}-${getTerritoryName(territory)}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, '')    // Remove special chars
    .replace(/\s+/g, '-')            // Replace spaces with hyphens
    .replace(/-+/g, '-')             // Collapse multiple hyphens
    .replace(/^-|-$/g, '');          // Trim leading/trailing hyphens

  return normalized.slice(0, 80); // Max 80 chars for URL readability
}

/**
 * Generate a URL-safe slug for a category
 */
export function generateCategorySlug(category: string): string {
  return category
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ── Meta description generation ────────────────────────────────────────────────

/**
 * Generate SEO meta description for a product page
 */
export function generateProductMetaDescription(
  product: CompareProduct,
  summary: CompareSummary | null,
  territory: string,
): string {
  const territoryName = getTerritoryName(territory);
  const brand = product.brand ? `${product.brand} ` : '';
  
  if (summary?.min != null) {
    const priceText = `${summary.min.toFixed(2)} €`;
    const savingsText = summary.savings != null && summary.savings > 0
      ? ` — économisez jusqu'à ${summary.savings.toFixed(2)} €`
      : '';
    
    return `Prix ${brand}${product.name} en ${territoryName} : à partir de ${priceText}${savingsText}. Comparez les prix dans ${summary.count} magasins.`;
  }
  
  return `Comparez les prix de ${brand}${product.name} en ${territoryName}. Trouvez le meilleur prix dans les supermarchés locaux.`;
}

/**
 * Generate SEO meta description for a category page
 */
export function generateCategoryMetaDescription(
  categoryName: string,
  territory: string,
  productCount?: number,
): string {
  const territoryName = getTerritoryName(territory);
  const countText = productCount ? ` parmi ${productCount} produits` : '';
  
  return `Comparez les prix des ${categoryName.toLowerCase()} en ${territoryName}${countText}. Trouvez les meilleures offres et économisez sur vos courses.`;
}

// ── JSON-LD Schema generation ──────────────────────────────────────────────────

/**
 * Build JSON-LD Product schema for SEO
 */
export function buildProductJsonLd(
  product: CompareProduct,
  observations: PriceObservationRow[],
  territory: string,
): Record<string, unknown> {
  const territoryName = getTerritoryName(territory);
  const slug = generateProductSlug(product.name, territory);
  const productUrl = `${SITE_URL}/produit/${slug}`;
  
  // Find best (lowest) price offer
  const sortedPrices = [...observations].sort((a, b) => a.price - b.price);
  const bestOffer = sortedPrices[0];
  
  const offers = sortedPrices.slice(0, 5).map((obs) => ({
    '@type': 'Offer',
    price: obs.price.toFixed(2),
    priceCurrency: 'EUR',
    availability: 'https://schema.org/InStock',
    seller: {
      '@type': 'Organization',
      name: obs.retailer,
    },
    areaServed: {
      '@type': 'AdministrativeArea',
      name: territoryName,
    },
    priceValidUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${productUrl}#product`,
    name: product.name,
    description: `${product.name}${product.brand ? ` de ${product.brand}` : ''} — comparez les prix en ${territoryName}`,
    image: product.image || `${SITE_URL}/icon-512.png`,
    sku: product.barcode || product.id,
    gtin13: product.barcode?.length === 13 ? product.barcode : undefined,
    brand: product.brand
      ? {
          '@type': 'Brand',
          name: product.brand,
        }
      : undefined,
    category: product.category,
    url: productUrl,
    offers: offers.length > 1
      ? {
          '@type': 'AggregateOffer',
          lowPrice: bestOffer?.price.toFixed(2),
          highPrice: sortedPrices[sortedPrices.length - 1]?.price.toFixed(2),
          priceCurrency: 'EUR',
          offerCount: observations.length,
          offers,
        }
      : offers[0],
  };
}

/**
 * Build JSON-LD BreadcrumbList for product pages
 */
export function buildProductBreadcrumbJsonLd(
  product: CompareProduct,
  territory: string,
): Record<string, unknown> {
  const territoryName = getTerritoryName(territory);
  const slug = generateProductSlug(product.name, territory);
  
  const items = [
    { name: 'Accueil', url: SITE_URL },
    { name: 'Comparateur', url: `${SITE_URL}/comparateur` },
  ];
  
  if (product.category) {
    items.push({
      name: product.category,
      url: `${SITE_URL}/categorie/${generateCategorySlug(product.category)}`,
    });
  }
  
  items.push({
    name: product.name,
    url: `${SITE_URL}/produit/${slug}`,
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Build JSON-LD ItemList for category pages
 */
export function buildCategoryJsonLd(
  categoryName: string,
  categorySlug: string,
  products: Array<{ name: string; slug: string; price?: number }>,
  territory: string,
): Record<string, unknown> {
  const territoryName = getTerritoryName(territory);
  const categoryUrl = `${SITE_URL}/categorie/${categorySlug}`;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${categoryUrl}#list`,
    name: `${categoryName} en ${territoryName}`,
    description: `Liste des prix pour ${categoryName.toLowerCase()} en ${territoryName}`,
    url: categoryUrl,
    numberOfItems: products.length,
    itemListElement: products.slice(0, 10).map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: product.name,
      url: `${SITE_URL}/produit/${product.slug}`,
    })),
  };
}

// ── SEO Title generation ───────────────────────────────────────────────────────

/**
 * Generate SEO title for product page
 */
export function generateProductTitle(
  product: CompareProduct,
  territory: string,
): string {
  const territoryName = getTerritoryName(territory);
  const brand = product.brand ? `${product.brand} ` : '';
  
  return `Prix ${brand}${product.name} en ${territoryName} — Comparateur`;
}

/**
 * Generate SEO title for category page
 */
export function generateCategoryTitle(
  categoryName: string,
  territory: string,
): string {
  const territoryName = getTerritoryName(territory);
  
  return `Prix ${categoryName} en ${territoryName} — Comparateur Outre-mer`;
}

// ── Canonical URL generation ───────────────────────────────────────────────────

/**
 * Generate canonical URL for product page
 */
export function generateProductCanonical(
  product: CompareProduct,
  territory: string,
): string {
  const slug = generateProductSlug(product.name, territory);
  return `${SITE_URL}/produit/${slug}?territory=${territory}`;
}

/**
 * Generate canonical URL for category page
 */
export function generateCategoryCanonical(
  categorySlug: string,
  territory: string,
): string {
  return `${SITE_URL}/categorie/${categorySlug}?territory=${territory}`;
}
