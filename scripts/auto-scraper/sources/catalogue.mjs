/**
 * sources/catalogue.mjs — Scraper catalogues produits des enseignes DOM-TOM
 *
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │  LACUNE COUVERTE : Open Prices est communautaire et ne couvre pas les  │
 * │  catalogues complets des enseignes. Ce module interroge directement    │
 * │  les APIs publiques de catalogues des 10 grandes enseignes DOM-TOM     │
 * │  pour un panier de 25 produits courants × 5 territoires.              │
 * │                                                                         │
 * │  Gain : des centaines de relevés de prix actuels (quotidiens) avec     │
 * │  EAN, nom exact, marque et image — pour toutes les enseignes.          │
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * Sources (APIs publiques des catalogues en ligne — données non protégées) :
 *   - E.Leclerc       : https://www.e.leclerc/api/rest/live-config/product-search-v2
 *   - Intermarché     : https://www.intermarche.com/api/v2/products/search
 *   - Leader Price    : https://www.leaderprice.fr/api/catalog/search
 *   - Super U (CU)    : https://www.coursesu.com/api/2.0/catalog/search
 *   - Cora            : https://www.cora.fr/api/search/product (GP/MQ)
 *   - Carrefour Market: https://www.carrefour.fr/api/cm/v1/product-search
 *   - Aldi            : https://www.aldi.fr/search (GP/MQ — catalogue national)
 *   - Score Réunion   : https://www.score.re/api/v1/products/search (RE, groupe LEAL)
 *   - Auchan          : https://www.auchan.fr/api/v2/catalog/search (RE — Grand Saint-Denis)
 *   - Monoprix        : https://www.monoprix.fr/api/v1/products/search (MQ — Fort-de-France)
 *
 * Conformité légale :
 *   - Uniquement données publiques consultables sans authentification
 *   - Respect robots.txt via isScrapingAllowed()
 *   - Rate limiting (1 req/1.2 s par domaine) + AbortController timeout
 *   - User-Agent explicite incluant le contact du projet
 *   - Usage non-commercial de données publiques à des fins d'observatoire
 *     (Art. L.342-3 CPI, directive 96/9/CE art. 9 — exception statistique/recherche)
 */

import { sleep, fetchWithRetry, isScrapingAllowed, makeRateLimiter } from './utils.mjs';

/** @typedef {{ ean?: string; productName?: string; brand?: string; territory: string; retailer: string; price: number; currency: 'EUR'; unit: string; date: string; source: string; imageUrl?: string; }} CatalogueEntry */

// ─── Constants ────────────────────────────────────────────────────────────────

const UA = 'akiprisaye-opendata-bot/2.0 (https://github.com/teetee971/akiprisaye-web; contact@akiprisaye.fr)';
const TIMEOUT_MS = 15_000;

/** Rate limiter partagé : 1 200 ms min entre deux appels vers le même domaine */
const rl = makeRateLimiter(1_200);

// ─── Panier de produits courants DOM-TOM ─────────────────────────────────────

/**
 * 25 produits courants du panier de vie quotidien DOM-TOM.
 * Ces termes sont assez génériques pour correspondre à des articles dans
 * n'importe quel catalogue d'enseigne grande surface.
 */
const PANIER_QUERIES = [
  // Épicerie
  'lait uht 1l',
  'riz 1kg',
  'sucre 1kg',
  'farine 1kg',
  'huile tournesol 1l',
  'eau minerale 1.5l',
  'cafe moulu 250g',
  'pates 500g',
  // Frais / Réfrigéré
  'beurre 250g',
  'fromage rape 200g',
  'yaourt nature',
  'oeufs 12',
  // Viandes / Poissons
  'poulet entier',
  'thon en boite 160g',
  'jambon 4 tranches',
  // Fruits / Légumes (référence métropole pour comparaison)
  'tomates cerise 250g',
  'bananes',
  // Boissons
  'jus orange 1l',
  'soda cola 1.5l',
  // Droguerie / Hygiène
  'shampooing 400ml',
  'lessive liquide 1.5l',
  'papier toilette 6 rouleaux',
  'dentifrice 75ml',
  'gel douche 400ml',
  // Bébé (poste budget important en DOM-TOM)
  'couches bebe taille 3',
];

// ─── Configuration enseignes ─────────────────────────────────────────────────

/**
 * Configuration de chaque enseigne :
 *   baseUrl     — URL de l'API amont (identique aux fonctions functions/api/)
 *   territories — codes territoire → identifiant magasin/PDV
 *   buildUrl    — construit l'URL de requête pour un terme et un identifiant de magasin
 *   parseResult — extrait les produits depuis la réponse JSON brute
 */
const RETAILERS = [
  {
    name: 'leclerc',
    label: 'E.Leclerc',
    baseUrl: 'https://www.e.leclerc',
    territories: {
      GP: ['6520', '6521', '6522', '6523'],
      MQ: ['9720', '9721', '9722', '9723'],
      RE: ['9740', '9741', '9742'],
      GF: ['9730'],
      // Mayotte : E.Leclerc est présent à Mayotte depuis l'ouverture du magasin
      // de Kawéni (2022). Un seul code de magasin confirmé à ce jour.
      YT: ['9760'],
    },
    /** @param {string} query @param {string[]} storeCodes */
    buildUrl(query, storeCodes) {
      const p = new URLSearchParams({ query, page: '1', pageSize: '20' });
      for (const code of storeCodes.slice(0, 2)) p.append('storeCodes[]', code);
      return `${this.baseUrl}/api/rest/live-config/product-search-v2?${p.toString()}`;
    },
    /** @param {any} json @returns {Array<{ean?:string,name?:string,brand?:string,price:number,unit:string,imageUrl?:string}>} */
    parseResult(json) {
      const items = _extractArray(json, ['products', 'items', 'results', 'data', 'hits']);
      return items.map((p) => ({
        ean: _str(p.code ?? p.ean ?? p.barcode),
        name: _str(p.libelle ?? p.label ?? p.name ?? p.productName),
        brand: _str(p.marque ?? p.brand),
        price: _num(p.offers?.[0]?.price ?? p.offers?.[0]?.sellingPrice ?? p.price ?? p.sellingPrice ?? p.priceValue),
        unit: _unit(p.offers?.[0]?.unit ?? p.offers?.[0]?.priceUnit ?? p.unit),
        imageUrl: _str(p.imageUrl ?? p.photo),
      })).filter((r) => r.price > 0);
    },
  },
  {
    name: 'intermarche',
    label: 'Intermarché',
    baseUrl: 'https://www.intermarche.com',
    territories: {
      GP: '097100',
      MQ: '097200',
      RE: '097400',
      GF: '097300',
      YT: '097600',
    },
    buildUrl(query, storeId) {
      const p = new URLSearchParams({ q: query, limit: '20', lang: 'fr' });
      if (storeId) p.set('storeId', storeId);
      return `${this.baseUrl}/api/v2/products/search?${p.toString()}`;
    },
    parseResult(json) {
      const unwrapped = json?.content ?? json;
      const items = _extractArray(unwrapped, ['products', 'items', 'results', 'data', 'hits']);
      return items.map((p) => ({
        ean: _str(p.ean ?? p.code ?? p.gtinCode),
        name: _str(p.label ?? p.name ?? p.title ?? p.productName),
        brand: _str(p.brand ?? p.marque ?? p.brandLabel),
        price: _num(p.offers?.[0]?.promotionPrice ?? p.offers?.[0]?.price ?? p.offers?.[0]?.sellingPrice ?? p.price ?? p.sellingPrice),
        unit: _unit(p.offers?.[0]?.unitLabel ?? p.offers?.[0]?.unit ?? p.unitLabel ?? p.unit),
        imageUrl: _str(p.image ?? p.imageUrl ?? p.photo ?? p.thumbnail),
      })).filter((r) => r.price > 0);
    },
  },
  {
    name: 'leader_price',
    label: 'Leader Price',
    baseUrl: 'https://www.leaderprice.fr',
    // Leader Price ne filtre pas par magasin en DOM-TOM — les prix sont nationaux
    territories: { GP: null, MQ: null, RE: null, GF: null, YT: null },
    buildUrl(query) {
      const p = new URLSearchParams({ q: query, pageSize: '20', page: '1' });
      return `${this.baseUrl}/api/catalog/search?${p.toString()}`;
    },
    parseResult(json) {
      const items = _extractArray(json, ['products', 'items', 'results', 'data', 'hits']);
      return items.map((p) => ({
        ean: _str(p.ean ?? p.code ?? p.gtin),
        name: _str(p.name ?? p.label ?? p.title ?? p.libelle),
        brand: _str(p.brand ?? p.marque),
        price: _num(p.offers?.[0]?.promotionPrice ?? p.offers?.[0]?.price ?? p.price ?? p.sellingPrice ?? p.promotionPrice),
        unit: _unit(p.offers?.[0]?.unitOfMeasure ?? p.offers?.[0]?.unit ?? p.unit ?? p.unitOfMeasure),
        imageUrl: _str(p.imageUrl ?? p.image ?? p.photo ?? p.thumbnail),
      })).filter((r) => r.price > 0);
    },
  },
  {
    name: 'courses_u',
    label: 'Super U / Hyper U',
    baseUrl: 'https://www.coursesu.com',
    territories: {
      GP: '076170',
      MQ: '097200',
      RE: '097410',
      GF: '097300',
      YT: '097600',
    },
    buildUrl(query, pdvCode) {
      const p = new URLSearchParams({ query, page: '1', pageSize: '20' });
      if (pdvCode) p.set('pdvCode', pdvCode);
      return `${this.baseUrl}/api/2.0/catalog/search?${p.toString()}`;
    },
    parseResult(json) {
      const unwrapped = json?.response ?? json;
      const items = _extractArray(unwrapped, ['products', 'items', 'results', 'data', 'hits']);
      return items.map((p) => {
        const imgs = Array.isArray(p.images) ? p.images : [];
        const firstImg = imgs[0];
        const imageUrl = _str(
          typeof firstImg === 'string' ? firstImg : firstImg?.url,
        ) ?? _str(p.imageUrl ?? p.photo ?? p.thumbnail);
        return {
          ean: _str(p.code ?? p.ean ?? p.gtin ?? p.gtinNumber),
          name: _str(p.name ?? p.label ?? p.libelle ?? p.productName ?? p.title),
          brand: _str(p.brand ?? p.marque ?? p.brandName),
          price: _num(
            p.offers?.[0]?.promotionPrice ?? p.offers?.[0]?.discountedPrice ??
            p.offers?.[0]?.price ?? p.offers?.[0]?.normalPrice ??
            p.price ?? p.normalPrice ?? p.priceValue ?? p.sellingPrice,
          ),
          unit: _unit(p.offers?.[0]?.unitOfMeasure ?? p.offers?.[0]?.unit ?? p.unitOfMeasure ?? p.unit),
          imageUrl,
        };
      }).filter((r) => r.price > 0);
    },
  },
  {
    name: 'cora',
    label: 'Cora',
    baseUrl: 'https://www.cora.fr',
    // Cora est présent en Guadeloupe (Baie-Mahault) et Martinique (Le Lamentin).
    territories: {
      GP: '97163',  // Cora Baie-Mahault (Guadeloupe)
      MQ: '97232',  // Cora Le Lamentin (Martinique)
      // Cora n'est pas présent en RE, GF, YT
    },
    buildUrl(query, storeId) {
      const p = new URLSearchParams({ q: query, page: '1', pageSize: '20', lang: 'fr' });
      if (storeId) p.set('storeId', storeId);
      return `${this.baseUrl}/api/search/product?${p.toString()}`;
    },
    parseResult(json) {
      const items = _extractArray(json, ['products', 'items', 'results', 'data', 'hits', 'content']);
      return items.map((p) => ({
        ean: _str(p.ean ?? p.code ?? p.gtin ?? p.barcode),
        name: _str(p.name ?? p.label ?? p.libelle ?? p.title ?? p.productName),
        brand: _str(p.brand ?? p.marque ?? p.brandName),
        price: _num(
          p.offers?.[0]?.promotionPrice ?? p.offers?.[0]?.price ??
          p.price ?? p.sellingPrice ?? p.normalPrice ?? p.priceValue,
        ),
        unit: _unit(p.offers?.[0]?.unit ?? p.offers?.[0]?.unitOfMeasure ?? p.unit ?? p.unitOfMeasure),
        imageUrl: _str(p.imageUrl ?? p.image ?? p.photo ?? p.thumbnail),
      })).filter((r) => r.price > 0);
    },
  },
  {
    name: 'carrefour',
    label: 'Carrefour Market',
    baseUrl: 'https://www.carrefour.fr',
    // Carrefour Market / Carrefour Express DOM (GP/MQ/RE/GF/YT).
    territories: {
      GP: '971',
      MQ: '972',
      RE: '974',
      GF: '973',
      YT: '976',
    },
    buildUrl(query, storeId) {
      const p = new URLSearchParams({ query, size: '20', lang: 'fr_FR' });
      if (storeId) p.set('storeId', storeId);
      return `${this.baseUrl}/api/cm/v1/product-search?${p.toString()}`;
    },
    parseResult(json) {
      const unwrapped = json?.content ?? json?.results ?? json;
      const items = _extractArray(unwrapped, ['products', 'items', 'results', 'data', 'hits', 'content']);
      return items.map((p) => ({
        ean: _str(p.ean ?? p.code ?? p.gtin ?? p.barcode ?? p.id),
        name: _str(p.description ?? p.name ?? p.label ?? p.title ?? p.libelle),
        brand: _str(p.brand ?? p.brandName ?? p.marque),
        price: _num(
          p.pricing?.salePrice ?? p.pricing?.price ?? p.price ?? p.sellingPrice ??
          p.priceValue ?? p.discountedPrice,
        ),
        unit: _unit(p.pricing?.perUnitLabel ?? p.unit ?? p.unitOfMeasure),
        imageUrl: _str(p.medias?.[0]?.url ?? p.imageUrl ?? p.image ?? p.thumbnail),
      })).filter((r) => r.price > 0);
    },
  },
  {
    name: 'aldi',
    label: 'Aldi',
    baseUrl: 'https://www.aldi.fr',
    // Aldi est présent en Guadeloupe depuis 2022 (Baie-Mahault, Les Abymes)
    // et en Martinique depuis 2023 (Le Lamentin). Présence confirmée DOM 2025.
    territories: {
      GP: null,   // Aldi GP — pas de code magasin exposé dans l'API publique
      MQ: null,   // Aldi MQ — même situation
      // Aldi n'est pas présent en RE, GF, YT
    },
    buildUrl(query) {
      // Aldi France utilise un endpoint de recherche headless (Commerce Layer / Algolia).
      // Le paramètre `q` déclenche la recherche produit nationale (catalogue commun DOM/métropole).
      const p = new URLSearchParams({ q: query, resultsPerPage: '20', lang: 'fr' });
      return `${this.baseUrl}/search?${p.toString()}`;
    },
    parseResult(json) {
      const items = _extractArray(json, ['products', 'hits', 'items', 'results', 'data']);
      return items.map((p) => ({
        ean: _str(p.ean ?? p.barcode ?? p.code ?? p.objectID),
        name: _str(p.name ?? p.title ?? p.label ?? p.productName),
        brand: _str(p.brand ?? p.brandName ?? p.marque),
        price: _num(
          p.price?.value ?? p.price?.amount ?? p.price ??
          p.offers?.[0]?.price ?? p.sellingPrice,
        ),
        unit: _unit(p.unit ?? p.unitOfMeasure ?? p.priceUnit),
        imageUrl: _str(p.image?.url ?? p.imageUrl ?? p.thumbnail),
      })).filter((r) => r.price > 0);
    },
  },
  {
    name: 'score_re',
    label: 'Score Réunion',
    baseUrl: 'https://www.score.re',
    // Score et Jumbo Score sont les leaders de la grande distribution à La Réunion
    // (groupe LEAL). Score.re exploite un site e-commerce avec catalogue en ligne.
    territories: {
      RE: null,   // Score est spécifique RE — pas de code PDV requis, catalogue national
      // Score (groupe LEAL) n'est pas présent en GP, MQ, GF, YT
    },
    buildUrl(query) {
      const p = new URLSearchParams({ q: query, page: '1', pageSize: '20' });
      return `${this.baseUrl}/api/v1/products/search?${p.toString()}`;
    },
    parseResult(json) {
      const unwrapped = json?.data ?? json?.response ?? json;
      const items = _extractArray(unwrapped, ['products', 'items', 'results', 'hits', 'content']);
      return items.map((p) => ({
        ean: _str(p.ean ?? p.barcode ?? p.code ?? p.gtin),
        name: _str(p.name ?? p.label ?? p.title ?? p.libelle ?? p.productName),
        brand: _str(p.brand ?? p.brandName ?? p.marque),
        price: _num(
          p.price?.value ?? p.price?.amount ?? p.price ??
          p.offers?.[0]?.price ?? p.priceValue ?? p.sellingPrice,
        ),
        unit: _unit(p.unit ?? p.unitOfMeasure ?? p.offers?.[0]?.unit),
        imageUrl: _str(p.imageUrl ?? p.image?.url ?? p.photo ?? p.thumbnail),
      })).filter((r) => r.price > 0);
    },
  },
  {
    name: 'auchan',
    label: 'Auchan Réunion',
    baseUrl: 'https://www.auchan.fr',
    // Auchan est présent à La Réunion depuis 2012 (Saint-Denis Grand Marché).
    // Auchan.fr expose une API de recherche produit utilisée par le site e-commerce.
    territories: {
      RE: null,   // Auchan RE — catalogue national auchan.fr (même référentiel)
      // Auchan n'est pas présent en GP, MQ, GF, YT (DOM)
    },
    buildUrl(query) {
      const p = new URLSearchParams({
        query,
        lang: 'fr_FR',
        currentPage: '1',
        pageSize: '20',
      });
      return `${this.baseUrl}/api/v2/catalog/search?${p.toString()}`;
    },
    parseResult(json) {
      const unwrapped = json?.data ?? json?.response ?? json;
      const items = _extractArray(unwrapped, ['products', 'results', 'items', 'hits', 'content']);
      return items.map((p) => ({
        ean: _str(p.ean ?? p.code ?? p.gtin ?? p.barcode ?? p.id),
        name: _str(p.label ?? p.name ?? p.title ?? p.libelle ?? p.description),
        brand: _str(p.brand?.label ?? p.brand ?? p.brandName ?? p.marque),
        price: _num(
          p.price?.value ?? p.price?.amount ?? p.price ??
          p.offers?.[0]?.price ?? p.sellingPrice ?? p.priceValue,
        ),
        unit: _unit(p.price?.unit ?? p.unit ?? p.unitOfMeasure ?? p.offers?.[0]?.unit),
        imageUrl: _str(p.media?.[0]?.url ?? p.imageUrl ?? p.image ?? p.thumbnail),
      })).filter((r) => r.price > 0);
    },
  },
  {
    name: 'monoprix',
    label: 'Monoprix Martinique',
    baseUrl: 'https://www.monoprix.fr',
    // Monoprix est présent en Martinique (Fort-de-France, centre commercial La Galleria).
    // Monoprix.fr propose un site e-commerce avec API de recherche produit.
    territories: {
      MQ: null,   // Monoprix MQ — catalogue national monoprix.fr
      // Monoprix n'est pas présent en GP, RE, GF, YT (DOM)
    },
    buildUrl(query) {
      const p = new URLSearchParams({
        query,
        page: '1',
        pageSize: '20',
        lang: 'fr',
      });
      return `${this.baseUrl}/api/v1/products/search?${p.toString()}`;
    },
    parseResult(json) {
      const unwrapped = json?.data ?? json?.results ?? json;
      const items = _extractArray(unwrapped, ['products', 'items', 'results', 'hits', 'content']);
      return items.map((p) => ({
        ean: _str(p.ean ?? p.gtin ?? p.code ?? p.barcode ?? p.reference),
        name: _str(p.name ?? p.label ?? p.title ?? p.libelle ?? p.description),
        brand: _str(p.brand ?? p.brandName ?? p.marque ?? p.manufacturer),
        price: _num(
          p.price?.value ?? p.price?.amount ?? p.price ??
          p.offers?.[0]?.price ?? p.sellingPrice ?? p.unitPrice,
        ),
        unit: _unit(p.unit ?? p.unitOfMeasure ?? p.price?.unit ?? p.quantityText),
        imageUrl: _str(p.imageUrl ?? p.image?.url ?? p.photo ?? p.thumbnail),
      })).filter((r) => r.price > 0);
    },
  },
  {
    name: 'leclerc_dom_drive',
    label: 'E.Leclerc Drive DOM (123.click)',
    baseUrl: 'https://www.123.click',
    // 123.click est le drive en ligne spécifique Leclerc pour les Antilles.
    // Les prix pratiqués peuvent différer du catalogue e.leclerc national.
    territories: {
      GP: 'guadeloupe',
      MQ: 'martinique',
      // 123.click (E.Leclerc Drive DOM) est spécifique aux Antilles — pas de service en RE, GF, YT
    },
    buildUrl(query, zone) {
      const p = new URLSearchParams({ q: query, pageSize: '20' });
      if (zone) p.set('zone', zone);
      return `${this.baseUrl}/api/v1/products/search?${p.toString()}`;
    },
    parseResult(json) {
      const unwrapped = json?.data ?? json?.results ?? json?.content ?? json;
      const items = _extractArray(unwrapped, ['products', 'items', 'results', 'data', 'hits', 'content']);
      return items.map((p) => ({
        ean: _str(p.ean ?? p.code ?? p.gtin ?? p.barcode ?? p.reference),
        name: _str(p.name ?? p.label ?? p.libelle ?? p.title ?? p.productName),
        brand: _str(p.brand ?? p.brandName ?? p.marque),
        price: _num(
          p.price?.value ?? p.price?.amount ?? p.price ??
          p.offers?.[0]?.price ?? p.sellingPrice ?? p.priceValue,
        ),
        unit: _unit(p.unit ?? p.unitOfMeasure ?? p.price?.unit ?? p.offers?.[0]?.unit),
        imageUrl: _str(p.imageUrl ?? p.image?.url ?? p.photo ?? p.thumbnail),
      })).filter((r) => r.price > 0);
    },
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** @param {unknown} v @returns {string | undefined} */
const _str = (v) => (typeof v === 'string' && v.trim().length > 0 ? v.trim() : undefined);

/** @param {unknown} v @returns {number} */
const _num = (v) => {
  if (typeof v === 'number' && Number.isFinite(v) && v > 0) return v;
  if (typeof v === 'string') {
    const n = parseFloat(v.replace(',', '.'));
    return Number.isFinite(n) && n > 0 ? n : 0;
  }
  return 0;
};

/** Normalise les chaînes d'unité en 'unit'|'kg'|'l' */
const _unit = (v) => {
  const s = _str(v)?.toLowerCase() ?? '';
  if (s.includes('kg') || s.includes('kilo')) return 'kg';
  if (s.includes('litre') || s.includes('liter') || s === 'l') return 'l';
  return 'unit';
};

/**
 * Extrait le premier tableau trouvé dans un objet JSON sous les clés candidates.
 * @param {any} obj
 * @param {string[]} keys
 */
const _extractArray = (obj, keys) => {
  if (!obj || typeof obj !== 'object') return [];
  for (const k of keys) {
    if (Array.isArray(obj[k])) return obj[k];
  }
  if (Array.isArray(obj)) return obj;
  return [];
};

// ─── Core scraper ─────────────────────────────────────────────────────────────

/**
 * Scrape le catalogue d'une enseigne pour un produit et un territoire donnés.
 * @param {typeof RETAILERS[0]} retailer
 * @param {string}              query
 * @param {string}              territory  Ex: 'GP'
 * @returns {Promise<CatalogueEntry[]>}
 */
async function scrapeOne(retailer, query, territory) {
  const storeId = retailer.territories[territory];
  const url = retailer.buildUrl(query, storeId);

  // Robots.txt check
  const { allowed } = await isScrapingAllowed(url);
  if (!allowed) {
    console.log(`  🤖 [catalogue] robots.txt interdit : ${retailer.label} ${territory}`);
    return [];
  }

  await rl.wait(url);

  const res = await fetchWithRetry(url, {
    timeoutMs: TIMEOUT_MS,
    label: `${retailer.label}/${territory}/${query.slice(0, 20)}`,
    headers: {
      'User-Agent': UA,
      Accept: 'application/json',
      'Accept-Language': 'fr-FR,fr;q=0.9',
      Referer: retailer.baseUrl + '/',
    },
  });

  if (!res || !res.ok) return [];

  let json;
  try { json = await res.json(); } catch { return []; }

  const today = new Date().toISOString().slice(0, 10);
  const parsed = retailer.parseResult(json);

  return parsed.map((p) => ({
    ean:         p.ean,
    productName: p.name,
    brand:       p.brand,
    territory,
    retailer:    retailer.label,
    price:       Math.round(p.price * 100) / 100,
    currency:    'EUR',
    unit:        p.unit,
    date:        today,
    source:      retailer.baseUrl,
    imageUrl:    p.imageUrl,
  }));
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Scrape les catalogues des 4 grandes enseignes DOM-TOM pour un panier de
 * 25 produits courants × 5 territoires.
 *
 * Stratégie rate-limit :
 *   - 1 200 ms min entre deux requêtes vers un même domaine
 *   - Timeout 15 s par requête
 *   - Ré-essai automatique ×3 sur erreurs transitoires (via fetchWithRetry)
 *
 * @returns {Promise<CatalogueEntry[]>}
 */
export async function scrapeCataloguePrices() {
  console.log('  🛒 [catalogue] Scraping catalogues enseignes DOM-TOM…');

  /** @type {CatalogueEntry[]} */
  const allEntries = [];
  const territories = ['GP', 'MQ', 'RE', 'GF', 'YT'];

  for (const retailer of RETAILERS) {
    console.log(`  📦 [catalogue] ${retailer.label}…`);
    let retailerTotal = 0;

    for (const territory of territories) {
      // Skip territories where this retailer doesn't operate
      if (!(territory in retailer.territories)) continue;
      for (const query of PANIER_QUERIES) {
        const entries = await scrapeOne(retailer, query, territory);
        if (entries.length > 0) {
          allEntries.push(...entries);
          retailerTotal += entries.length;
        }
        // Petit délai supplémentaire entre deux produits (poli)
        await sleep(200);
      }
      console.log(`       ${territory}: ${allEntries.filter((e) => e.retailer === retailer.label && e.territory === territory).length} produits`);
      // Pause entre territoires
      await sleep(500);
    }

    console.log(`  ✅ [catalogue] ${retailer.label} : ${retailerTotal} relevés collectés`);
    // Pause entre enseignes
    await sleep(1_000);
  }

  // Déduplication par (ean + retailer + territory) — garde le premier (le plus récent)
  const seen = new Set();
  const deduped = allEntries.filter((e) => {
    const key = `${e.ean ?? e.productName}::${e.retailer}::${e.territory}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`  📊 [catalogue] ${deduped.length} entrées catalogue (${allEntries.length} avant dédup)`);
  return deduped;
}
