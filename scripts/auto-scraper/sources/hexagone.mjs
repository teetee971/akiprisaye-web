/**
 * sources/hexagone.mjs — Prix de référence métropolitains (France hexagonale)
 *
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │  OBJECTIF : collecter des prix de référence dans la grande             │
 * │  distribution métropolitaine, pour calculer l'écart DOM ↔ Hexagone.   │
 * │                                                                         │
 * │  Même panier de 25 produits que catalogue.mjs, même technique,         │
 * │  mais sur des magasins de référence en métropole.                       │
 * │                                                                         │
 * │  Sortie : hexagone-prices.json                                          │
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * Sources (APIs publiques des catalogues en ligne — données non protégées) :
 *   - E.Leclerc       : https://www.e.leclerc/api/rest/live-config/product-search-v2
 *   - Intermarché     : https://www.intermarche.com/api/v2/products/search
 *   - Super U (CU)    : https://www.coursesu.com/api/2.0/catalog/search
 *   - Carrefour       : https://www.carrefour.fr/api/cm/v1/product-search
 *
 * Magasins de référence métropolitains — sélection diversifiée géographiquement
 * (Paris/IDF, Lyon, Nantes, Lille, Marseille) pour une moyenne nationale solide :
 *   - Leclerc Croissy-Beaubourg (77, IDF)     — code 7701
 *   - Leclerc Saint-Herblain (44, Nantes)     — code 4401
 *   - Intermarché Lyon Part-Dieu (69)         — code 069100
 *   - Intermarché Lille-Hellemmes (59)        — code 059130
 *   - Super U Rennes-Cesson (35)              — code 035510
 *   - Carrefour Marseille Les Arnavaux (13)   — code 13015
 *
 * Conformité légale :
 *   - Uniquement données publiques consultables sans authentification
 *   - Respect robots.txt via isScrapingAllowed()
 *   - Rate limiting (1 200 ms min entre deux requêtes par domaine)
 *   - User-Agent explicite incluant le contact du projet
 */

import { sleep, fetchWithRetry, isScrapingAllowed, makeRateLimiter } from './utils.mjs';

/** @typedef {{ productName?: string; brand?: string; territory: 'FR'; retailer: string; price: number; currency: 'EUR'; unit: string; date: string; source: string; ean?: string; }} HexagoneEntry */

// ─── Constants ────────────────────────────────────────────────────────────────

const UA = 'akiprisaye-opendata-bot/2.0 (https://github.com/teetee971/akiprisaye-web; contact@akiprisaye.fr)';
const TIMEOUT_MS = 15_000;

/** Rate limiter partagé : 1 200 ms min entre deux appels vers le même domaine */
const rl = makeRateLimiter(1_200);

// ─── Panier de référence (identique à catalogue.mjs) ─────────────────────────

const PANIER_QUERIES = [
  'lait uht 1l',
  'riz 1kg',
  'sucre 1kg',
  'farine 1kg',
  'huile tournesol 1l',
  'eau minerale 1.5l',
  'cafe moulu 250g',
  'pates 500g',
  'beurre 250g',
  'fromage rape 200g',
  'yaourt nature',
  'oeufs 12',
  'poulet entier',
  'thon en boite 160g',
  'jambon 4 tranches',
  'tomates cerise 250g',
  'bananes',
  'jus orange 1l',
  'soda cola 1.5l',
  'shampooing 400ml',
  'lessive liquide 1.5l',
  'papier toilette 6 rouleaux',
  'dentifrice 75ml',
  'gel douche 400ml',
  'couches bebe taille 3',
];

// ─── Enseignes métropolitaines de référence ───────────────────────────────────

const RETAILERS_HEX = [
  {
    name: 'leclerc_metro',
    label: 'E.Leclerc (métropole)',
    baseUrl: 'https://www.e.leclerc',
    // Two geographically distinct stores:
    //   7701 — E.Leclerc Croissy-Beaubourg (Seine-et-Marne, IDF) : code observed
    //           via e.leclerc store-selector API (storeCodes[] param)
    //   4401 — E.Leclerc Saint-Herblain (Loire-Atlantique, Nantes) : idem
    // Both codes verified through the public store-finder on www.e.leclerc/recherche-magasin
    storeCodes: ['7701', '4401'],
    buildUrl(query) {
      const p = new URLSearchParams({ query, page: '1', pageSize: '20' });
      for (const code of this.storeCodes.slice(0, 2)) p.append('storeCodes[]', code);
      return `${this.baseUrl}/api/rest/live-config/product-search-v2?${p.toString()}`;
    },
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
    name: 'intermarche_metro_lyon',
    label: 'Intermarché (métropole)',
    baseUrl: 'https://www.intermarche.com',
    // Lyon Part-Dieu (69100) — 2e ville de France
    // Lille-Hellemmes (59130) — bassin Nord, fort pouvoir d'achat industriel
    // On envoie deux requêtes en série en réutilisant le même parseResult.
    storeIds: ['069100', '059130'],
    buildUrl(query, storeId) {
      const p = new URLSearchParams({ q: query, limit: '20', lang: 'fr' });
      p.set('storeId', storeId);
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
    name: 'courses_u_metro',
    label: 'Super U (métropole)',
    baseUrl: 'https://www.coursesu.com',
    // Super U Rennes-Cesson (35510) — capital breton, marché de référence Grand Ouest
    pdvCode: '035510',
    buildUrl(query) {
      const p = new URLSearchParams({ query, page: '1', pageSize: '20' });
      p.set('pdvCode', this.pdvCode);
      return `${this.baseUrl}/api/2.0/catalog/search?${p.toString()}`;
    },
    parseResult(json) {
      const unwrapped = json?.response ?? json;
      const items = _extractArray(unwrapped, ['products', 'items', 'results', 'data', 'hits']);
      return items.map((p) => {
        const imgs = Array.isArray(p.images) ? p.images : [];
        const firstImg = imgs[0];
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
          imageUrl: _str(typeof firstImg === 'string' ? firstImg : firstImg?.url) ?? _str(p.imageUrl ?? p.photo),
        };
      }).filter((r) => r.price > 0);
    },
  },
  {
    name: 'carrefour_metro',
    label: 'Carrefour (métropole)',
    baseUrl: 'https://www.carrefour.fr',
    // Carrefour Les Arnavaux, Marseille (13015) — 3e ville, bassin Sud-Est
    storeId: '13015',
    buildUrl(query) {
      const p = new URLSearchParams({ query, size: '20', lang: 'fr_FR' });
      p.set('storeId', this.storeId);
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
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const _str = (v) => (typeof v === 'string' && v.trim().length > 0 ? v.trim() : undefined);
const _num = (v) => {
  if (typeof v === 'number' && Number.isFinite(v) && v > 0) return v;
  if (typeof v === 'string') {
    const n = parseFloat(v.replace(',', '.'));
    return Number.isFinite(n) && n > 0 ? n : 0;
  }
  return 0;
};
const _unit = (v) => {
  const s = _str(v)?.toLowerCase() ?? '';
  if (s.includes('kg') || s.includes('kilo')) return 'kg';
  if (s.includes('litre') || s.includes('liter') || s === 'l') return 'l';
  return 'unit';
};
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
 * Scrape une enseigne pour une requête donnée.
 * Si l'enseigne expose plusieurs magasins (`storeIds`), toutes les requêtes
 * sont lancées en série et les résultats fusionnés.
 *
 * @param {typeof RETAILERS_HEX[0]} retailer
 * @param {string} query
 * @returns {Promise<HexagoneEntry[]>}
 */
async function scrapeOne(retailer, query) {
  // Collect store identifiers to query — single or multiple
  const storeIds = retailer.storeIds ?? (retailer.storeId ? [retailer.storeId] : [null]);
  const today = new Date().toISOString().slice(0, 10);
  const allParsed = [];

  for (const sid of storeIds) {
    const url = retailer.buildUrl(query, sid);

    const { allowed } = await isScrapingAllowed(url);
    if (!allowed) {
      console.log(`  🤖 [hexagone] robots.txt interdit : ${retailer.label}`);
      continue;
    }

    await rl.wait(url);

    const res = await fetchWithRetry(url, {
      timeoutMs: TIMEOUT_MS,
      label: `${retailer.label}/${query.slice(0, 20)}`,
      headers: {
        'User-Agent': UA,
        Accept: 'application/json',
        'Accept-Language': 'fr-FR,fr;q=0.9',
        Referer: retailer.baseUrl + '/',
      },
    });

    if (!res || !res.ok) {
      if (res?.status >= 400 && res?.status < 500) {
        console.log(`  ⚠️  [hexagone] ${retailer.label} HTTP ${res.status} — code magasin inconnu ou API indisponible`);
      }
      continue;
    }

    let json;
    try { json = await res.json(); } catch { continue; }

    let parsed;
    try { parsed = retailer.parseResult(json); } catch (err) {
      console.log(`  ⚠️  [hexagone] ${retailer.label} erreur de parsing : ${err.message}`);
      continue;
    }

    allParsed.push(...parsed);
    await sleep(200);
  }

  return allParsed.map((p) => ({
    ean:         p.ean,
    productName: p.name,
    brand:       p.brand,
    territory:   'FR',
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
 * Scrape les prix de référence métropolitains pour les 25 produits du panier.
 *
 * @returns {Promise<HexagoneEntry[]>}
 */
export async function scrapeHexagonePrices() {
  console.log('  🇫🇷 [hexagone] Scraping prix de référence métropolitains…');

  /** @type {HexagoneEntry[]} */
  const allEntries = [];

  for (const retailer of RETAILERS_HEX) {
    console.log(`  📦 [hexagone] ${retailer.label}…`);
    let retailerTotal = 0;

    try {
      for (const query of PANIER_QUERIES) {
        try {
          const entries = await scrapeOne(retailer, query);
          if (entries.length > 0) {
            allEntries.push(...entries);
            retailerTotal += entries.length;
          }
        } catch (err) {
          console.log(`  ⚠️  [hexagone] ${retailer.label} / "${query}" erreur : ${err.message}`);
        }
        await sleep(200);
      }
    } catch (err) {
      console.log(`  ⚠️  [hexagone] Enseigne ${retailer.label} indisponible : ${err.message}`);
    }

    console.log(`  ✅ [hexagone] ${retailer.label} : ${retailerTotal} relevés`);
    await sleep(1_000);
  }

  // Déduplication par (ean + retailer) — garde le premier
  const seen = new Set();
  const deduped = allEntries.filter((e) => {
    const key = `${e.ean ?? e.productName}::${e.retailer}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`  📊 [hexagone] ${deduped.length} entrées (${allEntries.length} avant dédup)`);
  return deduped;
}
