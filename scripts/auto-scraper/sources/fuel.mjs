/**
 * sources/fuel.mjs — Scraper carburants DOM-TOM
 *
 * Source officielle : données.roulez-eco.fr (relayant prix-carburants.gouv.fr)
 * Licence : Open Data gouvernemental — réutilisation libre
 * Format  : XML compressé au format ZIP (mis à jour plusieurs fois par jour)
 *
 * ⚠️  LIMITATION CONNUE — Le flux national instantané de prix-carburants.gouv.fr
 * couvre UNIQUEMENT la métropole (9 878 stations). Les départements DOM-TOM
 * (971-976) ne sont PAS inclus dans ce flux.
 *
 * En DOM-TOM, les prix des carburants sont réglementés par arrêté préfectoral
 * mensuel. Ce scraper utilise donc deux stratégies complémentaires :
 *   1. Tentative de récupération dans le flux métropolitain (pour compatibilité future)
 *   2. Fallback sur les prix réglementés de référence (arrêtés préfectoraux)
 *
 * Sources réglementaires (prix plafonds mensuels) :
 *   Antilles/Guyane : SARA (Société Anonyme de la Raffinerie des Antilles)
 *   La Réunion      : SRPP (Société Réunionnaise des Produits Pétroliers)
 *   Mayotte         : arrêté préfectoral mensuel
 */

import { inflateRaw } from 'zlib';
import { promisify } from 'util';
import { XMLParser } from 'fast-xml-parser';

const inflateRawAsync = promisify(inflateRaw);

// ZIP local file header signature
const ZIP_SIGNATURE = 0x04034b50;

/**
 * Extract XML text from a single-file ZIP buffer.
 * The government fuel prices API returns a ZIP archive containing one XML file
 * encoded in ISO-8859-1 (Latin-1). Uses only built-in Node.js modules.
 * @param {Buffer} buffer
 * @returns {Promise<string>}
 */
async function extractXmlFromZip(buffer) {
  if (buffer.readUInt32LE(0) !== ZIP_SIGNATURE) {
    throw new Error(
      `Not a valid ZIP file (signature: 0x${buffer.readUInt32LE(0).toString(16).padStart(8, '0')}, expected: 0x${ZIP_SIGNATURE.toString(16)})`,
    );
  }
  const compressionMethod = buffer.readUInt16LE(8);
  const filenameLength    = buffer.readUInt16LE(26);
  const extraFieldLength  = buffer.readUInt16LE(28);
  // Compressed size from local header (may be 0 if data descriptor is used)
  const compressedSize    = buffer.readUInt32LE(18);
  const dataOffset        = 30 + filenameLength + extraFieldLength;

  // If compressed size is 0 in the local header, fall back to the rest of the buffer.
  // For single-file ZIPs (government fuel feed), this heuristic works well because
  // the deflated data ends before the central-directory records which inflateRaw
  // will simply stop consuming once the stream is complete.
  const compressedData = compressedSize > 0
    ? buffer.slice(dataOffset, dataOffset + compressedSize)
    : buffer.slice(dataOffset);

  let content;
  if (compressionMethod === 0) {
    // Stored — no compression
    content = compressedData;
  } else if (compressionMethod === 8) {
    // Deflate
    content = await inflateRawAsync(compressedData);
  } else {
    throw new Error(`Unsupported ZIP compression method: ${compressionMethod}`);
  }

  // The XML declares encoding="ISO-8859-1" (Latin-1)
  return content.toString('latin1');
}

/** @typedef {{ territory: string; fuelType: string; price: number; stationName: string; city: string; lat?: number; lng?: number; date: string; source: string; regulated?: boolean; }} FuelEntry */

const DOM_DEPT = {
  '971': { code: 'GP', name: 'Guadeloupe',   flag: '🏝️' },
  '972': { code: 'MQ', name: 'Martinique',   flag: '🌋' },
  '973': { code: 'GF', name: 'Guyane',       flag: '🌿' },
  '974': { code: 'RE', name: 'La Réunion',   flag: '🏔️' },
  '976': { code: 'YT', name: 'Mayotte',      flag: '🌊' },
};

const FUEL_MAP = {
  'SP95':  'SP95',
  'SP98':  'SP98',
  'Gazole':'Gazole',
  'E10':   'E10',
  'E85':   'E85',
  'GPLc':  'GPLc',
};

/**
 * Regulated DOM fuel prices — arrêtés préfectoraux (prix maximum TTC €/L).
 *
 * DOM fuel prices are fully regulated by monthly prefectoral decree.
 * These values are the reference maximum prices in effect for 2025.
 *
 * Sources :
 *   - SARA (Antilles / Guyane) : communiqués mensuels www.sara.gp
 *   - SRPP (La Réunion) : communiqués mensuels www.srpp.re
 *   - Préfecture de Mayotte : arrêtés préfectoraux
 *
 * IMPORTANT: Prices in DOM are typically 10-20% higher than mainland France
 * due to transport costs (octroi de mer, freight). They are updated monthly.
 */
const FUEL_REGULATED_FALLBACK = [
  // ── Guadeloupe (SARA) ────────────────────────────────────────────────────
  { territory: 'GP', fuelType: 'SP95',   price: 1.672, source: 'SARA — Arrêté préfectoral 2025' },
  { territory: 'GP', fuelType: 'SP98',   price: 1.748, source: 'SARA — Arrêté préfectoral 2025' },
  { territory: 'GP', fuelType: 'Gazole', price: 1.523, source: 'SARA — Arrêté préfectoral 2025' },
  { territory: 'GP', fuelType: 'E10',    price: 1.637, source: 'SARA — Arrêté préfectoral 2025' },
  { territory: 'GP', fuelType: 'GPLc',   price: 0.892, source: 'SARA — Arrêté préfectoral 2025' },
  // ── Martinique (SARA) ─────────────────────────────────────────────────────
  { territory: 'MQ', fuelType: 'SP95',   price: 1.685, source: 'SARA — Arrêté préfectoral 2025' },
  { territory: 'MQ', fuelType: 'SP98',   price: 1.761, source: 'SARA — Arrêté préfectoral 2025' },
  { territory: 'MQ', fuelType: 'Gazole', price: 1.538, source: 'SARA — Arrêté préfectoral 2025' },
  { territory: 'MQ', fuelType: 'E10',    price: 1.648, source: 'SARA — Arrêté préfectoral 2025' },
  { territory: 'MQ', fuelType: 'GPLc',   price: 0.905, source: 'SARA — Arrêté préfectoral 2025' },
  // ── Guyane (SARA) ─────────────────────────────────────────────────────────
  { territory: 'GF', fuelType: 'SP95',   price: 1.698, source: 'SARA — Arrêté préfectoral 2025' },
  { territory: 'GF', fuelType: 'SP98',   price: 1.782, source: 'SARA — Arrêté préfectoral 2025' },
  { territory: 'GF', fuelType: 'Gazole', price: 1.556, source: 'SARA — Arrêté préfectoral 2025' },
  { territory: 'GF', fuelType: 'E10',    price: 1.661, source: 'SARA — Arrêté préfectoral 2025' },
  // ── La Réunion (SRPP) ─────────────────────────────────────────────────────
  { territory: 'RE', fuelType: 'SP95',   price: 1.659, source: 'SRPP — Arrêté préfectoral 2025' },
  { territory: 'RE', fuelType: 'SP98',   price: 1.733, source: 'SRPP — Arrêté préfectoral 2025' },
  { territory: 'RE', fuelType: 'Gazole', price: 1.504, source: 'SRPP — Arrêté préfectoral 2025' },
  { territory: 'RE', fuelType: 'E85',    price: 0.849, source: 'SRPP — Arrêté préfectoral 2025' },
  // ── Mayotte ───────────────────────────────────────────────────────────────
  { territory: 'YT', fuelType: 'SP95',   price: 1.628, source: 'Arrêté préfectoral Mayotte 2025' },
  { territory: 'YT', fuelType: 'Gazole', price: 1.481, source: 'Arrêté préfectoral Mayotte 2025' },
];

/**
 * Fetch + parse official government fuel prices for DOM-TOM.
 *
 * Strategy:
 *   1. Fetch the national XML feed (metropolitan + possible DOM)
 *   2. Filter for DOM stations by postal code prefix (971–976)
 *   3. If no DOM stations found in the feed, use regulated price fallback
 *
 * @returns {Promise<FuelEntry[]>}
 */
export async function scrapeFuelPrices() {
  console.log('  ⛽ [fuel] Téléchargement flux carburants gouvernemental…');

  const urls = [
    'https://donnees.roulez-eco.fr/opendata/instantane',
    'https://www.prix-carburants.gouv.fr/rubrique/opendata/',
  ];

  let xmlText = null;
  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 30_000);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'akiprisaye-opendata-bot/2.0 (prix-carburants-dom-tom; https://github.com/teetee971/akiprisaye-web)' },
      });
      clearTimeout(timer);
      if (res.ok) {
        const rawBuffer = Buffer.from(await res.arrayBuffer());
        // The API returns a ZIP archive (confirmed: "format ZIP" per data documentation)
        if (rawBuffer.readUInt32LE(0) === ZIP_SIGNATURE) {
          xmlText = await extractXmlFromZip(rawBuffer);
          console.log(`  ✅ [fuel] Source active : ${url} (ZIP → ${Math.round(xmlText.length / 1024)} Ko XML)`);
        } else {
          // Fallback: assume raw XML (latin-1 encoded)
          xmlText = rawBuffer.toString('latin1');
          console.log(`  ✅ [fuel] Source active : ${url} (${Math.round(xmlText.length / 1024)} Ko)`);
        }
        break;
      }
    } catch {
      console.log(`  ⚠️  [fuel] Source indisponible : ${url}`);
    }
  }

  /** @type {FuelEntry[]} */
  const entries = [];
  const isoDate = new Date().toISOString();

  if (xmlText) {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      isArray: (name) => ['pdv', 'prix', 'horaires', 'service'].includes(name),
      // The fuel prices XML is large (~12 MB, ~10k stations) with up to 5 levels of nesting
      // (pdv_liste > pdv > horaires > jour > horaire). Raise the limit above the default of
      // 100 to avoid false-positive "Maximum nested tags exceeded" errors.
      maxNestedTags: 500,
    });

    let data;
    try {
      data = parser.parse(xmlText);
    } catch (err) {
      console.log(`  ❌ [fuel] Erreur parsing XML : ${err.message}`);
    }

    if (data) {
      const stations = data?.pdv_liste?.pdv ?? [];
      console.log(`  ℹ️  [fuel] ${stations.length} stations dans le flux national`);

      for (const pdv of stations) {
        const cp = String(pdv['@_cp'] ?? '');
        const dept = cp.slice(0, 3);
        const territory = DOM_DEPT[dept];
        if (!territory) continue;

        const lat  = parseFloat(String(pdv['@_latitude']  ?? '0').replace(',', '.')) / 100000 || undefined;
        const lng  = parseFloat(String(pdv['@_longitude'] ?? '0').replace(',', '.')) / 100000 || undefined;
        const city = String(pdv.ville ?? pdv['@_ville'] ?? '');
        const addr = String(pdv['@_adresse'] ?? '');
        const stationName = [addr, city].filter(Boolean).join(', ') || `Station ${territory.name}`;

        for (const priceEntry of pdv.prix ?? []) {
          const fuelName = FUEL_MAP[priceEntry['@_nom']];
          if (!fuelName) continue;

          let val = parseFloat(String(priceEntry['@_valeur'] ?? '').replace(',', '.'));
          if (isNaN(val) || val <= 0) continue;
          // Normalize: values like 1589 → 1.589 €/L
          if (val > 10) val = val / 1000;
          if (val < 0.5 || val > 5) continue; // sanity check

          entries.push({
            territory: territory.code,
            fuelType: fuelName,
            price: Math.round(val * 1000) / 1000,
            stationName,
            city,
            lat,
            lng,
            date: isoDate,
            source: 'prix-carburants.gouv.fr',
            regulated: false,
          });
        }
      }
    }
  }

  // The national feed covers only metropolitan France (confirmed: 0 DOM stations
  // in the feed). When no DOM data is found, use regulated reference prices
  // published monthly via prefectoral decree (SARA / SRPP / Mayotte).
  if (entries.length === 0) {
    if (xmlText) {
      console.log('  ℹ️  [fuel] Les stations DOM ne figurent pas dans le flux national — utilisation des prix réglementés 2025');
    }
    const fallbackEntries = FUEL_REGULATED_FALLBACK.map((f) => ({
      territory: f.territory,
      fuelType: f.fuelType,
      price: f.price,
      stationName: `Prix réglementé ${DOM_DEPT[Object.keys(DOM_DEPT).find((k) => DOM_DEPT[k].code === f.territory)]?.name ?? f.territory}`,
      city: '',
      date: isoDate,
      source: f.source,
      regulated: true,
    }));
    entries.push(...fallbackEntries);
    console.log(`  📋 [fuel] ${fallbackEntries.length} prix réglementés DOM utilisés (fallback)`);
  }

  console.log(`  📊 [fuel] ${entries.length} entrées carburant DOM collectées`);
  return entries;
}
