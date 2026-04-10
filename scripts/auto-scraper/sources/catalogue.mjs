/**
 * sources/catalogue.mjs — Scraper catalogues produits des enseignes DOM-TOM
 *
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │  LACUNE COUVERTE : Open Prices est communautaire et ne couvre pas les  │
 * │  catalogues complets des enseignes. Ce module interroge directement    │
 * │  les APIs publiques de catalogues des 4 grandes enseignes DOM-TOM      │
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
