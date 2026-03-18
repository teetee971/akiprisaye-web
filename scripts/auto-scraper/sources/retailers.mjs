/**
 * sources/retailers.mjs — Scraper générique articles en quasi-instantané
 *
 * Stratégie : scraping sans navigateur (fetch + HTML parser) ciblant les
 * données structurées JSON-LD (schema.org/Product) ou Open Graph présentes
 * sur la plupart des sites e-commerce modernes.
 *
 * Sources DOM-TOM prioritaires :
 *   1. Open Food Facts API    — données ouvertes EAN → produit + catégorie
 *   2. Open Prices API        — prix contributifs par territoire
 *   3. JSON-LD Product        — pages produit de détaillants publics
 *
 * Utilisation dans scrape.mjs :
 *   import { scrapeProductByEAN, scrapeRetailerPage } from './sources/retailers.mjs';
 *
 *   // Par EAN (code-barres)
 *   const product = await scrapeProductByEAN('3017620422003'); // Nutella
 *
 *   // Par URL de page produit publique
 *   const prices = await scrapeRetailerPage('https://...');
 *
 * Conformité légale :
 *   - Uniquement données publiques sans authentification
 *   - Respect robots.txt via isScrapingAllowed()
 *   - Rate limiting via makeRateLimiter()
 *   - Open Food Facts : ODbL — réutilisation libre
 *   - Open Prices : ODbL — réutilisation libre
 *   - Pages produit publiques : usage non-commercial d'information publique
 */

import { fetchJSONWithRetry, fetchTextWithRetry, isScrapingAllowed, makeRateLimiter } from './utils.mjs';

// ─── Constants ────────────────────────────────────────────────────────────────

const UA = 'akiprisaye-opendata-bot/2.0 (https://github.com/teetee971/akiprisaye-web; contact@akiprisaye.fr)';

/** Codes territoires DOM-TOM reconnus */
const DOM_TERRITORIES = ['gp', 'mq', 'gf', 're', 'yt', '971', '972', '973', '974', '976'];

/** Catégories de produits couramment scrapées */
export const PRODUCT_CATEGORIES = [
  'alimentation',
  'carburant',
  'hygiène',
  'électroménager',
  'high-tech',
  'textile',
  'pharmacie',
  'bricolage',
];

// Rate limiter partagé (800ms entre requêtes vers un même domaine)
const rl = makeRateLimiter(800);

// ─── Open Food Facts ──────────────────────────────────────────────────────────

/**
 * Récupère les informations produit depuis Open Food Facts par code EAN.
 * Retourne null si le produit n'est pas trouvé ou en cas d'erreur.
 *
 * @param {string} ean  Code-barres EAN-8 ou EAN-13
 * @returns {Promise<OFFProduct | null>}
 *
 * @typedef {Object} OFFProduct
 * @property {string} ean
 * @property {string} name
 * @property {string} brand
 * @property {string} category
 * @property {string} imageUrl
 * @property {string} nutriscore
 * @property {number|null} quantity
 * @property {string} unit
 */
export async function scrapeProductByEAN(ean) {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(ean)}?fields=product_name,brands,categories_tags,image_front_url,nutriscore_grade,product_quantity,quantity_unit`;

  const { allowed } = await isScrapingAllowed(url, UA);
  if (!allowed) {
    console.log(`  ⚠️  [retailers] robots.txt interdit : ${url}`);
    return null;
  }

  await rl.wait(url);
  const data = await fetchJSONWithRetry(url, `OFF EAN ${ean}`, 'retailers');
  if (!data?.product) return null;

  const p = data.product;
  return {
    ean,
    name:      p.product_name ?? '',
    brand:     p.brands ?? '',
    category:  (p.categories_tags ?? [])[0]?.replace('en:', '') ?? 'unknown',
    imageUrl:  p.image_front_url ?? '',
    nutriscore: p.nutriscore_grade ?? '',
    quantity:  p.product_quantity ? parseFloat(p.product_quantity) : null,
    unit:      p.quantity_unit ?? '',
    source:    'openfoodfacts',
    scrapedAt: new Date().toISOString(),
  };
}

// ─── Open Prices par EAN + territoire ─────────────────────────────────────────

/**
 * Récupère les prix déclarés pour un EAN dans un ou plusieurs territoires DOM.
 *
 * @param {string}   ean
 * @param {string[]} [territories]  Ex: ['gp','mq'] — défaut tous les DOM
 * @returns {Promise<PriceEntry[]>}
 *
 * @typedef {Object} PriceEntry
 * @property {string} ean
 * @property {string} territory
 * @property {number} price
 * @property {string} currency
 * @property {string} storeName
 * @property {string} observedAt
 */
export async function scrapePricesByEAN(ean, territories = DOM_TERRITORIES) {
  const url = `https://prices.openfoodfacts.org/api/v1/prices?product_code=${encodeURIComponent(ean)}&size=100`;

  const { allowed } = await isScrapingAllowed(url, UA);
  if (!allowed) return [];

  await rl.wait(url);
  const data = await fetchJSONWithRetry(url, `OpenPrices EAN ${ean}`, 'retailers');
  if (!data?.items) return [];

  const domPrices = data.items.filter((item) => {
    const loc = (item.location_country ?? '').toLowerCase();
    return territories.some((t) => loc === t || loc.includes(t));
  });

  return domPrices.map((item) => ({
    ean,
    territory:  item.location_country?.toLowerCase() ?? 'unknown',
    price:      item.price,
    currency:   item.currency ?? 'EUR',
    storeName:  item.location_osm_name ?? item.proof_id ?? '',
    observedAt: item.date ?? new Date().toISOString(),
    source:     'openprices',
  }));
}

// ─── JSON-LD Product scraper ──────────────────────────────────────────────────

/**
 * Extrait les données structurées JSON-LD (schema.org/Product ou Offer) d'une
 * URL de page produit publique.
 *
 * Compatible avec : sites WooCommerce, PrestaShop, Shopify, pages WordPress
 * qui exposent des métadonnées JSON-LD.
 *
 * @param {string} pageUrl  URL publique de la page produit
 * @returns {Promise<ScrapedProduct | null>}
 *
 * @typedef {Object} ScrapedProduct
 * @property {string}      url
 * @property {string}      name
 * @property {string}      brand
 * @property {number|null} price
 * @property {string}      currency
 * @property {string}      availability
 * @property {string}      ean
 * @property {string}      imageUrl
 * @property {string}      description
 * @property {string}      scrapedAt
 */
export async function scrapeRetailerPage(pageUrl) {
  const { allowed, crawlDelay } = await isScrapingAllowed(pageUrl, UA);
  if (!allowed) {
    console.log(`  ⚠️  [retailers] robots.txt interdit : ${pageUrl}`);
    return null;
  }

  await rl.wait(pageUrl);
  if (crawlDelay) {
    await new Promise((r) => setTimeout(r, crawlDelay * 1000));
  }

  const html = await fetchTextWithRetry(pageUrl, pageUrl.slice(0, 60), 'retailers');
  if (!html) return null;

  // Extract all JSON-LD blocks
  const jsonLdBlocks = extractJsonLd(html);

  for (const block of jsonLdBlocks) {
    // Handle @graph arrays
    const items = block['@graph'] ? block['@graph'] : [block];
    for (const item of items) {
      const type = item['@type'];
      if (type === 'Product' || type === 'IndividualProduct') {
        return parseProductJsonLd(item, pageUrl);
      }
    }
  }

  // Fallback: try Open Graph meta tags
  return parseOpenGraph(html, pageUrl);
}

/**
 * Extrait les blocs JSON-LD d'une page HTML.
 * @param {string} html
 * @returns {Array<object>}
 */
function extractJsonLd(html) {
  const results = [];
  const regex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      results.push(parsed);
    } catch {
      // Invalid JSON-LD block — skip
    }
  }
  return results;
}

/**
 * Parse un objet JSON-LD schema.org/Product en ScrapedProduct.
 * @param {object} item
 * @param {string} sourceUrl
 * @returns {ScrapedProduct}
 */
function parseProductJsonLd(item, sourceUrl) {
  // Offers can be a single object or array
  const offers = Array.isArray(item.offers) ? item.offers[0] : item.offers;

  const price    = offers?.price       ? parseFloat(offers.price)    : null;
  const currency = offers?.priceCurrency ?? 'EUR';
  const avail    = offers?.availability ?? '';

  // EAN/GTIN
  const ean = item.gtin13 ?? item.gtin8 ?? item.gtin ?? item.sku ?? '';

  // Brand
  const brand = typeof item.brand === 'object'
    ? (item.brand?.name ?? '')
    : (item.brand ?? '');

  // Image
  const imageUrl = Array.isArray(item.image)
    ? (item.image[0]?.url ?? item.image[0] ?? '')
    : (item.image?.url ?? item.image ?? '');

  return {
    url:          sourceUrl,
    name:         item.name ?? '',
    brand,
    price,
    currency,
    availability: avail.replace('http://schema.org/', ''),
    ean,
    imageUrl:     String(imageUrl),
    description:  (item.description ?? '').slice(0, 300),
    scrapedAt:    new Date().toISOString(),
    source:       'jsonld',
  };
}

/**
 * Fallback : extrait les métadonnées Open Graph (og:title, og:price:amount…).
 * @param {string} html
 * @param {string} sourceUrl
 * @returns {ScrapedProduct | null}
 */
function parseOpenGraph(html, sourceUrl) {
  const get = (prop) => {
    const m = html.match(new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i'));
    return m ? m[1] : '';
  };

  const name  = get('og:title');
  const image = get('og:image');
  const priceStr = get('product:price:amount') || get('og:price:amount');
  const currency = get('product:price:currency') || get('og:price:currency') || 'EUR';

  if (!name) return null;

  return {
    url:          sourceUrl,
    name,
    brand:        '',
    price:        priceStr ? parseFloat(priceStr) : null,
    currency,
    availability: '',
    ean:          '',
    imageUrl:     image,
    description:  '',
    scrapedAt:    new Date().toISOString(),
    source:       'opengraph',
  };
}

// ─── Bulk scan par liste d'EANs ───────────────────────────────────────────────

/**
 * Scane une liste d'EANs en parallèle (par lots de 5 pour respecter les limites
 * d'API) et retourne un tableau combiné de produits + prix DOM.
 *
 * @param {string[]} eans
 * @param {string[]} [territories]
 * @returns {Promise<Array<{product: OFFProduct|null, prices: PriceEntry[]}>>}
 */
export async function bulkScanEANs(eans, territories = DOM_TERRITORIES) {
  const BATCH = 5;
  const results = [];

  for (let i = 0; i < eans.length; i += BATCH) {
    const batch = eans.slice(i, i + BATCH);
    const batchResults = await Promise.all(
      batch.map(async (ean) => {
        const [product, prices] = await Promise.all([
          scrapeProductByEAN(ean),
          scrapePricesByEAN(ean, territories),
        ]);
        return { ean, product, prices };
      }),
    );
    results.push(...batchResults);
  }

  return results;
}

// ─── Catégories de produits prioritaires DOM-TOM ──────────────────────────────

/**
 * Liste d'EANs de produits de première nécessité courants en DOM-TOM.
 * Utilisée pour le scan quotidien des prix de base.
 *
 * Sources : relevés contributifs A KI PRI SA YÉ + référentiels BQP.
 */
export const PANIER_BASE_EANS = [
  // Riz
  '3256220017293', // Onctueux riz long grain 1kg
  '3017620422003', // Nescafé Classic 200g
  // Huile
  '3068320113901', // Huile de tournesol 1L Lesieur
  // Lait
  '3228021290012', // Lait UHT entier 1L Lactel
  // Pain (EAN variable — pas de standard)
  // Sucre
  '3228881013011', // Sucre en poudre 1kg Béghin Say
  // Farine
  '3014000204054', // Farine de blé T55 1kg
  // Pâtes
  '3017620421433', // Pâtes spaghetti Barilla 500g
  // Beurre
  '3228021350052', // Beurre doux 250g Elle & Vire
  // Eau
  '3274080005003', // Eau Évian 1,5L
];
