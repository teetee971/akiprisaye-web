/**
 * sources/fuel.mjs — Scraper carburants DOM-TOM
 *
 * Source officielle : données.roulez-eco.fr (relayant prix-carburants.gouv.fr)
 * Licence : Open Data gouvernemental — réutilisation libre
 * Format  : XML instantané (mis à jour plusieurs fois par jour)
 *
 * Territoires couverts : Guadeloupe (971), Martinique (972),
 *   Guyane (973), La Réunion (974), Mayotte (976)
 */

import { XMLParser } from 'fast-xml-parser';

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
        xmlText = await res.text();
        console.log(`  ✅ [fuel] Source active : ${url} (${Math.round(xmlText.length / 1024)} Ko)`);
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
