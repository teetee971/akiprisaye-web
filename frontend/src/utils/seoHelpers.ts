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

export const SITE_URL = 'https://akiprisaye-web.pages.dev';
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
    .replace(/[̀-ͯ]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .replace(/^-|-$/g, ''); // Trim leading/trailing hyphens

  return normalized.slice(0, 80); // Max 80 chars for URL readability
}

/**
 * Generate a URL-safe slug for a category
 */
export function generateCategorySlug(category: string): string {
  return category
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ── Meta description generation ────────────────────────────────────────────────

/**
 * Generate SEO meta description for a product page
 * Optimized for CTR: includes price, savings, and call to action.
 */
export function generateProductMetaDescription(
  product: CompareProduct,
  summary: CompareSummary | null,
  territory: string
): string {
  const territoryName = getTerritoryName(territory);
  const brand = product.brand ? `${product.brand} ` : '';

  if (summary?.min != null) {
    const priceText = summary.min.toFixed(2);
    const savingsText =
      summary.savings != null && summary.savings > 0
        ? ` Économisez jusqu'à ${summary.savings.toFixed(2)} €.`
        : '';

    return `Comparez les prix ${brand}${product.name} en ${territoryName}. Meilleur prix aujourd'hui : ${priceText} €.${savingsText} ${summary.count} magasin${summary.count > 1 ? 's' : ''} comparé${summary.count > 1 ? 's' : ''}.`;
  }

  return `Comparez les prix de ${brand}${product.name} en ${territoryName}. Trouvez le meilleur prix et économisez dans les supermarchés locaux.`;
}

/**
 * Generate SEO meta description for a category page
 */
export function generateCategoryMetaDescription(
  categoryName: string,
  territory: string,
  productCount?: number
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
  territory: string
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
    offers:
      offers.length > 1
        ? {
            '@type': 'AggregateOffer',
            lowPrice: bestOffer?.price.toFixed(2),
            highPrice: sortedPrices[sortedPrices.length - 1]?.price.toFixed(2),
            priceCurrency: 'EUR',
            offerCount: observations.length,
            priceValidUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0],
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
  territory: string
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
  territory: string
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
 * Format: "Prix [Produit] en [Territoire] – Comparer et économiser"
 * Optimized for CTR with action-oriented suffix.
 */
export function generateProductTitle(product: CompareProduct, territory: string): string {
  const territoryName = getTerritoryName(territory);
  const brand = product.brand ? `${product.brand} ` : '';

  return `Prix ${brand}${product.name} en ${territoryName} – Comparer et économiser`;
}

/**
 * Generate SEO title for category page
 */
export function generateCategoryTitle(categoryName: string, territory: string): string {
  const territoryName = getTerritoryName(territory);

  return `Prix ${categoryName} en ${territoryName} — Comparateur Outre-mer`;
}

// ── FAQ JSON-LD schema ─────────────────────────────────────────────────────────

/**
 * Build JSON-LD FAQPage schema for product pages.
 * 3 targeted Q&A entries boost rich-result eligibility and indexation.
 */
export function buildFaqJsonLd(
  product: CompareProduct,
  territory: string,
  bestPrice: number | null,
  savings: number | null,
  average: number | null,
  bestRetailer?: string
): Record<string, unknown> {
  const territoryName = getTerritoryName(territory);
  const brandLabel = product.brand ? `${product.brand} ` : '';
  const productLabel = `${brandLabel}${product.name}`;

  const priceAnswer =
    bestPrice != null && bestRetailer
      ? `Selon notre comparateur, le meilleur prix du ${productLabel} en ${territoryName} est de ${bestPrice.toFixed(2)} € chez ${bestRetailer}. Consultez notre comparatif pour voir toutes les enseignes disponibles.`
      : `Utilisez notre comparateur pour trouver le meilleur prix du ${productLabel} en ${territoryName} parmi toutes les enseignes locales.`;

  const averageAnswer =
    average != null
      ? `Le prix moyen du ${productLabel} en ${territoryName} est de ${average.toFixed(2)} € d'après les données collectées dans les principales enseignes (Carrefour, E.Leclerc, Super U, Leader Price…).`
      : `Le prix du ${productLabel} varie selon les enseignes en ${territoryName}. Comparez pour trouver la meilleure offre.`;

  const savingsAnswer =
    savings != null && savings > 0.01
      ? `En comparant les enseignes, vous pouvez économiser jusqu'à ${savings.toFixed(2)} € sur le ${productLabel} en ${territoryName}. Notre comparateur met à jour les prix quotidiennement pour vous garantir les meilleures offres.`
      : `Consultez notre comparateur pour identifier l'enseigne la moins chère pour le ${productLabel} en ${territoryName} et faire des économies sur vos courses.`;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Où acheter ${productLabel} moins cher en ${territoryName} ?`,
        acceptedAnswer: { '@type': 'Answer', text: priceAnswer },
      },
      {
        '@type': 'Question',
        name: `Quel est le prix moyen du ${productLabel} en ${territoryName} ?`,
        acceptedAnswer: { '@type': 'Answer', text: averageAnswer },
      },
      {
        '@type': 'Question',
        name: `Comment économiser sur le ${productLabel} en ${territoryName} ?`,
        acceptedAnswer: { '@type': 'Answer', text: savingsAnswer },
      },
    ],
  };
}

// ── Canonical URL generation ───────────────────────────────────────────────────

/**
 * Generate canonical URL for product page
 */
export function generateProductCanonical(product: CompareProduct, territory: string): string {
  const slug = generateProductSlug(product.name, territory);
  return `${SITE_URL}/produit/${slug}?territory=${territory}`;
}

/**
 * Generate canonical URL for category page
 */
export function generateCategoryCanonical(categorySlug: string, territory: string): string {
  return `${SITE_URL}/categorie/${categorySlug}?territory=${territory}`;
}

// ── New long-tail SEO page helpers ────────────────────────────────────────────

/** Map territory slug name → territory code */
export const TERRITORY_SLUG_MAP: Record<string, string> = {
  guadeloupe: 'GP',
  martinique: 'MQ',
  guyane: 'GF',
  reunion: 'RE',
  'la-reunion': 'RE',
  mayotte: 'YT',
};

/**
 * Build JSON-LD for a local price page (prix/:slug)
 */
export function buildPrixLocalJsonLd(
  productName: string,
  territory: string,
  prices: Array<{ retailer: string; price: number }>
): Record<string, unknown> {
  const territoryName = getTerritoryName(territory);
  const bestPrice = prices.length > 0 ? Math.min(...prices.map((p) => p.price)) : undefined;
  const worstPrice = prices.length > 0 ? Math.max(...prices.map((p) => p.price)) : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: productName,
    description: `${productName} — comparez les prix en ${territoryName}`,
    areaServed: { '@type': 'AdministrativeArea', name: territoryName },
    offers:
      prices.length > 0
        ? {
            '@type': 'AggregateOffer',
            lowPrice: bestPrice?.toFixed(2),
            highPrice: worstPrice?.toFixed(2),
            priceCurrency: 'EUR',
            offerCount: prices.length,
            offers: prices.slice(0, 5).map((p) => ({
              '@type': 'Offer',
              price: p.price.toFixed(2),
              priceCurrency: 'EUR',
              seller: { '@type': 'Organization', name: p.retailer },
              availability: 'https://schema.org/InStock',
            })),
          }
        : undefined,
  };
}

/**
 * Build JSON-LD for a retailer comparison page (comparer/:slug)
 */
export function buildComparaisonJsonLd(
  retailer1: string,
  retailer2: string,
  territory: string
): Record<string, unknown> {
  const territoryName = getTerritoryName(territory);
  const pageUrl = `${SITE_URL}/comparer/${retailer1.toLowerCase().replace(/\s/g, '-')}-vs-${retailer2.toLowerCase().replace(/\s/g, '-')}-${territory.toLowerCase()}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${retailer1} vs ${retailer2} ${territoryName} — Comparatif prix`,
    description: `Comparez les prix ${retailer1} et ${retailer2} en ${territoryName}. Trouvez le supermarché le moins cher.`,
    url: pageUrl,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Comparaison enseignes',
          item: `${SITE_URL}/comparer`,
        },
        { '@type': 'ListItem', position: 3, name: `${retailer1} vs ${retailer2}`, item: pageUrl },
      ],
    },
  };
}

/**
 * Build JSON-LD for an inflation trend page (inflation/:slug)
 */
export function buildInflationJsonLd(
  categoryName: string,
  territory: string,
  year: string
): Record<string, unknown> {
  const territoryName = getTerritoryName(territory);
  const pageUrl = `${SITE_URL}/inflation/${categoryName.toLowerCase().replace(/\s/g, '-')}-${territory.toLowerCase()}-${year}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `Inflation ${categoryName} en ${territoryName} — ${year}`,
    description: `Données d'inflation pour les ${categoryName.toLowerCase()} en ${territoryName} en ${year}. Évolution mensuelle des prix.`,
    url: pageUrl,
    creator: { '@type': 'Organization', name: SITE_NAME },
    temporalCoverage: year,
    spatialCoverage: { '@type': 'Place', name: territoryName },
  };
}

/**
 * Build JSON-LD for a cheapest products page (moins-cher/:territory)
 */
export function buildMoinsChersJsonLd(
  territory: string,
  products: Array<{ name: string; price: number; retailer: string }>
): Record<string, unknown> {
  const territoryName = getTerritoryName(territory);
  const pageUrl = `${SITE_URL}/moins-cher/${territoryName.toLowerCase().replace(/\s/g, '-')}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Produits les moins chers en ${territoryName}`,
    description: `Découvrez les produits les moins chers en ${territoryName} et économisez sur vos courses.`,
    url: pageUrl,
    numberOfItems: products.length,
    itemListElement: products.slice(0, 10).map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: product.name,
      description: `${product.price.toFixed(2)} € chez ${product.retailer}`,
    })),
  };
}
