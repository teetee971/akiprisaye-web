/**
 * sources/fuel.mjs — Scraper carburants DOM-TOM
 *
 * Source officielle : données.roulez-eco.fr (relayant prix-carburants.gouv.fr)
 * Licence : Open Data gouvernemental — réutilisation libre
 * Format  : XML compressé au format ZIP (mis à jour plusieurs fois par jour)
 *
 * Territoires couverts : Guadeloupe (971), Martinique (972),
 *   Guyane (973), La Réunion (974), Mayotte (976)
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
    throw new Error('Not a valid ZIP local file header');
  }
  const compressionMethod = buffer.readUInt16LE(8);
  const filenameLength    = buffer.readUInt16LE(26);
  const extraFieldLength  = buffer.readUInt16LE(28);
  // Compressed size from local header (may be 0 if data descriptor is used)
  const compressedSize    = buffer.readUInt32LE(18);
  const dataOffset        = 30 + filenameLength + extraFieldLength;

  // If compressed size is 0 in the local header, read until end-of-central-directory
  // For our use case (single well-formed ZIP), fall back to the rest of the buffer
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

/** @typedef {{ territory: string; fuelType: string; price: number; stationName: string; city: string; lat?: number; lng?: number; date: string; source: string; }} FuelEntry */

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
 * Fetch + parse official government fuel prices for DOM-TOM.
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

  if (!xmlText) {
    console.log('  ❌ [fuel] Aucune source disponible');
    return [];
  }

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
    return [];
  }

  const stations = data?.pdv_liste?.pdv ?? [];
  const isoDate = new Date().toISOString();
  /** @type {FuelEntry[]} */
  const entries = [];

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
      });
    }
  }

  console.log(`  📊 [fuel] ${entries.length} entrées extraites pour ${Object.keys(DOM_DEPT).length} départements DOM`);
  return entries;
}
