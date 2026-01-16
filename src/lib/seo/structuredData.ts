/**
 * Structured Data (JSON-LD) Generator for Rich Snippets
 * Generates schema.org markup for better search engine understanding
 */

const BASE_URL = 'https://akiprisaye.pages.dev';
const SITE_NAME = 'A KI PRI SA YÉ';

export interface Organization {
  '@context': 'https://schema.org';
  '@type': 'Organization';
  name: string;
  url: string;
  logo: string;
  description: string;
  sameAs: string[];
  contactPoint?: {
    '@type': 'ContactPoint';
    contactType: string;
    email: string;
  };
}

export interface Product {
  '@context': 'https://schema.org';
  '@type': 'Product';
  name: string;
  description: string;
  image: string;
  brand: string;
  offers: {
    '@type': 'AggregateOffer';
    priceCurrency: 'EUR';
    lowPrice: number;
    highPrice: number;
    offerCount: number;
    availability?: string;
  };
  aggregateRating?: {
    '@type': 'AggregateRating';
    ratingValue: number;
    reviewCount: number;
  };
}

export interface BreadcrumbList {
  '@context': 'https://schema.org';
  '@type': 'BreadcrumbList';
  itemListElement: Array<{
    '@type': 'ListItem';
    position: number;
    name: string;
    item: string;
  }>;
}

export interface WebSite {
  '@context': 'https://schema.org';
  '@type': 'WebSite';
  name: string;
  url: string;
  description: string;
  potentialAction?: {
    '@type': 'SearchAction';
    target: string;
    'query-input': string;
  };
}

export interface LocalBusiness {
  '@context': 'https://schema.org';
  '@type': 'LocalBusiness';
  name: string;
  image: string;
  '@id': string;
  url: string;
  telephone?: string;
  address?: {
    '@type': 'PostalAddress';
    streetAddress: string;
    addressLocality: string;
    postalCode: string;
    addressCountry: string;
  };
  geo?: {
    '@type': 'GeoCoordinates';
    latitude: number;
    longitude: number;
  };
  openingHoursSpecification?: Array<{
    '@type': 'OpeningHoursSpecification';
    dayOfWeek: string[];
    opens: string;
    closes: string;
  }>;
}

/**
 * Generate Organization schema for the site
 */
export function generateOrganizationSchema(): Organization {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: BASE_URL,
    logo: `${BASE_URL}/logo-akiprisaye.svg`,
    description: 'Application citoyenne gratuite qui explique les écarts de prix dans les DOM. Comprendre pourquoi tout coûte plus cher.',
    sameAs: [
      'https://facebook.com/akiprisaye',
      'https://twitter.com/akiprisaye',
      'https://instagram.com/akiprisaye',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'contact@akiprisaye.pages.dev',
    },
  };
}

/**
 * Generate WebSite schema with search functionality
 */
export function generateWebSiteSchema(): WebSite {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: BASE_URL,
    description: 'Application citoyenne d\'information dédiée à la compréhension des prix dans les territoires ultramarins',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${BASE_URL}/comparateur?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Generate Product schema for individual products
 */
export function generateProductSchema(product: {
  name: string;
  description?: string;
  image?: string;
  brand?: string;
  prices?: Array<{ price: number; store?: string }>;
  category?: string;
}): Product {
  const prices = product.prices || [];
  const minPrice = prices.length > 0 ? Math.min(...prices.map((p) => p.price)) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices.map((p) => p.price)) : 0;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || `${product.name} - Comparer les prix en Outre-mer`,
    image: product.image || `${BASE_URL}/images/product-default.jpg`,
    brand: product.brand || 'Divers',
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'EUR',
      lowPrice: minPrice,
      highPrice: maxPrice,
      offerCount: prices.length,
      availability: prices.length > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };
}

/**
 * Generate Breadcrumb schema for navigation
 */
export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
): BreadcrumbList {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${BASE_URL}${item.url}`,
    })),
  };
}

/**
 * Generate LocalBusiness schema for stores
 */
export function generateLocalBusinessSchema(store: {
  name: string;
  image?: string;
  url?: string;
  telephone?: string;
  address?: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}): LocalBusiness {
  const schema: LocalBusiness = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: store.name,
    image: store.image || `${BASE_URL}/images/store-default.jpg`,
    '@id': `${BASE_URL}/store/${encodeURIComponent(store.name)}`,
    url: store.url || BASE_URL,
  };

  if (store.telephone) {
    schema.telephone = store.telephone;
  }

  if (store.address) {
    schema.address = {
      '@type': 'PostalAddress',
      streetAddress: store.address.street,
      addressLocality: store.address.city,
      postalCode: store.address.postalCode,
      addressCountry: store.address.country,
    };
  }

  if (store.coordinates) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: store.coordinates.latitude,
      longitude: store.coordinates.longitude,
    };
  }

  return schema;
}

/**
 * Validate JSON-LD schema
 */
export function validateSchema(schema: Record<string, unknown>): boolean {
  return (
    typeof schema === 'object' &&
    schema !== null &&
    schema['@context'] === 'https://schema.org' &&
    typeof schema['@type'] === 'string'
  );
}
