/**
 * sources/food.mjs — Scraper produits alimentaires via Open Food Facts + Open Prices
 *
 * Sources (100% légales, licences Open Data) :
 *   - OpenFoodFacts API v2  : https://world.openfoodfacts.org/api/v2/
 *     Licence : Open Database License (ODbL)
 *   - Open Prices API       : https://prices.openfoodfacts.org/api/v1/
 *     Licence : CC-BY-SA 4.0
 *   - Open Prices — filtre  : location_country=GP/MQ/GF/RE/YT
 *
 * Stratégie :
 *   1. Charge la liste des EAN suivis (depuis expanded-prices.json)
 *   2. Pour chaque EAN, interroge l'API Open Prices pour les relevés DOM-TOM
 *   3. Enrichit avec les données nutritionnelles de Open Food Facts
 *   4. Retourne des objets FoodPriceEntry normalisés
 */

import { sleep, fetchJSONWithRetry } from './utils.mjs';

/** @typedef {{ ean: string; productName: string; brand: string; category: string; territory: string; price: number; currency: string; store?: string; city?: string; date: string; source: string; nutritionGrade?: string; }} FoodPriceEntry */

/** Codes ISO-3166-1 alpha-2 des territoires DOM */
const DOM_COUNTRIES = {
  GP: 'GP',
  MQ: 'MQ',
  GF: 'GF',
  RE: 'RE',
  YT: 'YT',
};

/** Pause entre les requêtes API pour respecter les rate limits */
const REQUEST_DELAY_MS = 500;

/**
 * Récupère les prix récents pour un pays DOM depuis Open Prices API,
 * avec pagination (max `maxPages` pages de 100 résultats) et ré-essais automatiques.
 * @param {string} countryCode  ex: 'GP'
 * @param {number} maxPages     nombre maximal de pages à charger (défaut 3)
 * @returns {Promise<any[]>}
 */
async function fetchOpenPricesByCountry(countryCode, maxPages = 3) {
  const pageSize = 100; // API cap
  const all = [];

  for (let page = 1; page <= maxPages; page++) {
    const url =
      `https://prices.openfoodfacts.org/api/v1/prices?` +
      `location_country=${countryCode}&order_by=-date&size=${pageSize}&page=${page}`;

    const data = await fetchJSONWithRetry(url, `OpenPrices ${countryCode} p${page}`, 'food');
    const items = data?.items ?? [];
    all.push(...items);

    // Stop early if the page was not full (last page)
    if (items.length < pageSize) break;

    await sleep(REQUEST_DELAY_MS);
  }

  return all;
}

/**
 * Enrichit un EAN avec les données Open Food Facts (nom, marque, catégorie, nutri-grade).
 * @param {string} ean
 */
async function fetchProductInfo(ean) {
  const url = `https://world.openfoodfacts.org/api/v2/product/${ean}?fields=product_name,brands,categories_tags,nutrition_grades`;
  const data = await fetchJSONWithRetry(url, `OFF EAN ${ean}`, 'food');
  if (!data?.product) return null;
  const p = data.product;
  return {
    name: p.product_name ?? '',
    brand: p.brands ?? '',
    category: (p.categories_tags ?? [])[0]?.replace('en:', '').replace('fr:', '') ?? '',
    nutritionGrade: p.nutrition_grades ?? '',
  };
}

/**
 * Main food scraper — fetches recent DOM-TOM food prices from Open Prices.
 * @returns {Promise<FoodPriceEntry[]>}
 */
export async function scrapeFoodPrices() {
  console.log('  🥦 [food] Scraping Open Prices DOM-TOM…');

  /** @type {FoodPriceEntry[]} */
  const entries = [];
  const seenEans = new Set();

  for (const [territoryCode, countryCode] of Object.entries(DOM_COUNTRIES)) {
    console.log(`  📡 [food] Open Prices → ${territoryCode}…`);
    const items = await fetchOpenPricesByCountry(countryCode);
    console.log(`       ${items.length} relevés trouvés`);

    for (const item of items) {
      const ean  = item.product_code ?? item.code ?? '';
      const price = parseFloat(item.price ?? '0');
      if (!ean || price <= 0) continue;

      // Sanity check on price
      if (price > 500) continue;

      const entry = {
        ean,
        productName: item.product?.product_name ?? item.product_name ?? 'Produit inconnu',
        brand: item.product?.brands ?? '',
        category: (item.product?.categories_tags ?? [])[0]?.replace('en:', '').replace('fr:', '') ?? '',
        territory: territoryCode,
        price: Math.round(price * 100) / 100,
        currency: item.currency ?? 'EUR',
        store: item.location?.osm_name ?? item.location?.name ?? '',
        city: item.location?.city ?? '',
        date: item.date ?? new Date().toISOString().slice(0, 10),
        source: 'prices.openfoodfacts.org',
        nutritionGrade: item.product?.nutrition_grades ?? '',
      };

      entries.push(entry);

      // Enrich EAN info if first time seen
      if (!seenEans.has(ean) && !entry.productName.trim()) {
        seenEans.add(ean);
        await sleep(REQUEST_DELAY_MS);
        const info = await fetchProductInfo(ean);
        if (info) {
          entry.productName = info.name || entry.productName;
          entry.brand       = info.brand || entry.brand;
          entry.category    = info.category || entry.category;
          entry.nutritionGrade = info.nutritionGrade || entry.nutritionGrade;
        }
      }
    }

    // Rate limiting between territories
    await sleep(REQUEST_DELAY_MS);
  }

  console.log(`  📊 [food] ${entries.length} relevés alimentaires collectés`);
  return entries;
}
