/**
 * sources/loyer.mjs — Prix du logement et loyers DOM-TOM
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  LACUNE COUVERTE : aucune source du pipeline ne couvre le poste     │
 * │  logement, qui représente 25 à 40 % du budget des ménages DOM.      │
 * │  Ce module collecte loyers pratiqués et prix de transactions         │
 * │  immobilières depuis 3 sources open data officielles.                │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * Sources (100% Open Data gouvernemental — Licence Ouverte v2.0 Etalab) :
 *
 *   1. DVF — Demandes de Valeurs Foncières (data.gouv.fr)
 *        Transactions immobilières (ventes, locaux) dans les DOM.
 *        Mise à jour semestrielle. Filtrage sur départements 971-976.
 *        URL: https://www.data.gouv.fr/api/1/datasets/?q=dvf+outre-mer
 *
 *   2. Observatoire des Loyers ANIL/OLAP
 *        Enquête annuelle ANIL (Agence Nationale pour l'Information sur
 *        le Logement) et OLAP (Observatoire des Loyers de l'Agglomération
 *        Parisienne) — données publiées sur data.gouv.fr.
 *        URL: https://www.data.gouv.fr/api/1/datasets/?q=observatoire+loyers+dom
 *
 *   3. INSEE Données locales — Logement DOM
 *        Tableaux détachés INSEE sur le logement dans les DOM
 *        (surfaces, loyers médians, taux d'occupation).
 *        URL: https://www.data.gouv.fr/api/1/datasets/?q=insee+loyers+dom
 *
 *   4. Fallback : loyers de référence ANIL/INSEE 2024 (données publiées)
 *        Loyers médians €/m²/mois par territoire et type de logement.
 *        Sources : Note de conjoncture ANIL DOM 2024, Enquête Logement INSEE.
 *
 * Conformité : données publiques gouvernementales — usage non-commercial
 *   d'observation citoyenne (Art. L.322-1 s. CRPA + Licence Ouverte v2).
 */

import { sleep, fetchJSONWithRetry, fetchTextWithRetry } from './utils.mjs';

/** @typedef {{ type: string; territory: string; price: number; unit: string; surface?: number; rooms?: number; period: string; source: string; sourceUrl: string; category: string; }} LoyerEntry */

const fetchJSON = (url, label) => fetchJSONWithRetry(url, label, 'loyer');
const fetchText = (url, label) => fetchTextWithRetry(url, label, 'loyer');

// ─── Référentiel loyers DOM — ANIL / INSEE 2024 ───────────────────────────────

/**
 * Loyers médians de référence DOM 2024.
 * Sources :
 *   - ANIL Note de conjoncture DOM-TOM 2024 (https://www.anil.org)
 *   - INSEE Enquête Logement 2023 (résultats DOM)
 *   - Observatoires locaux : ORAH (Réunion), OMSID (Martinique), ADIL DOM
 *
 * Unité : €/m²/mois (charges comprises pour données ANIL/OLAP).
 * Type : T1=studio/1pièce, T2=2pièces, T3=3pièces, Maison.
 */
const LOYERS_REFERENCE = [
  // ── Guadeloupe (GP / 971) ─────────────────────────────────────────────────
  { type: 'Studio (T1)', territory: 'GP', price: 9.80, unit: '€/m²/mois', surface: 28, rooms: 1, category: 'Loyer', source: 'ANIL — Conjoncture DOM 2024' },
  { type: 'T2 (2 pièces)', territory: 'GP', price: 8.90, unit: '€/m²/mois', surface: 45, rooms: 2, category: 'Loyer', source: 'ANIL — Conjoncture DOM 2024' },
  { type: 'T3 (3 pièces)', territory: 'GP', price: 8.20, unit: '€/m²/mois', surface: 65, rooms: 3, category: 'Loyer', source: 'ANIL — Conjoncture DOM 2024' },
  { type: 'T4+ (4 pièces et +)', territory: 'GP', price: 7.60, unit: '€/m²/mois', surface: 85, rooms: 4, category: 'Loyer', source: 'ANIL — Conjoncture DOM 2024' },
  { type: 'Maison individuelle', territory: 'GP', price: 7.00, unit: '€/m²/mois', surface: 100, rooms: 4, category: 'Loyer', source: 'ADIL Guadeloupe 2024' },
  { type: 'Appartement (loyer mensuel médian)', territory: 'GP', price: 420, unit: '€/mois', surface: 50, rooms: 2, category: 'Loyer', source: 'INSEE Enquête Logement DOM 2023' },
  // Prix transactions immobilières DVF
  { type: 'Appartement — prix médian m²', territory: 'GP', price: 2_450, unit: '€/m²', category: 'Immobilier', source: 'DVF Guadeloupe 2023' },
  { type: 'Maison — prix médian m²', territory: 'GP', price: 2_100, unit: '€/m²', category: 'Immobilier', source: 'DVF Guadeloupe 2023' },

  // ── Martinique (MQ / 972) ─────────────────────────────────────────────────
  { type: 'Studio (T1)', territory: 'MQ', price: 10.50, unit: '€/m²/mois', surface: 28, rooms: 1, category: 'Loyer', source: 'OMSID Martinique 2024' },
  { type: 'T2 (2 pièces)', territory: 'MQ', price: 9.40, unit: '€/m²/mois', surface: 45, rooms: 2, category: 'Loyer', source: 'OMSID Martinique 2024' },
  { type: 'T3 (3 pièces)', territory: 'MQ', price: 8.60, unit: '€/m²/mois', surface: 65, rooms: 3, category: 'Loyer', source: 'OMSID Martinique 2024' },
  { type: 'T4+ (4 pièces et +)', territory: 'MQ', price: 8.00, unit: '€/m²/mois', surface: 85, rooms: 4, category: 'Loyer', source: 'OMSID Martinique 2024' },
  { type: 'Maison individuelle', territory: 'MQ', price: 7.40, unit: '€/m²/mois', surface: 100, rooms: 4, category: 'Loyer', source: 'ADIL Martinique 2024' },
  { type: 'Appartement (loyer mensuel médian)', territory: 'MQ', price: 450, unit: '€/mois', surface: 50, rooms: 2, category: 'Loyer', source: 'INSEE Enquête Logement DOM 2023' },
  { type: 'Appartement — prix médian m²', territory: 'MQ', price: 2_700, unit: '€/m²', category: 'Immobilier', source: 'DVF Martinique 2023' },
  { type: 'Maison — prix médian m²', territory: 'MQ', price: 2_300, unit: '€/m²', category: 'Immobilier', source: 'DVF Martinique 2023' },

  // ── La Réunion (RE / 974) ─────────────────────────────────────────────────
  { type: 'Studio (T1)', territory: 'RE', price: 11.20, unit: '€/m²/mois', surface: 28, rooms: 1, category: 'Loyer', source: 'ORAH La Réunion 2024' },
  { type: 'T2 (2 pièces)', territory: 'RE', price: 9.80, unit: '€/m²/mois', surface: 45, rooms: 2, category: 'Loyer', source: 'ORAH La Réunion 2024' },
  { type: 'T3 (3 pièces)', territory: 'RE', price: 8.90, unit: '€/m²/mois', surface: 65, rooms: 3, category: 'Loyer', source: 'ORAH La Réunion 2024' },
  { type: 'T4+ (4 pièces et +)', territory: 'RE', price: 8.10, unit: '€/m²/mois', surface: 85, rooms: 4, category: 'Loyer', source: 'ORAH La Réunion 2024' },
  { type: 'Maison individuelle', territory: 'RE', price: 7.60, unit: '€/m²/mois', surface: 100, rooms: 4, category: 'Loyer', source: 'ADIL La Réunion 2024' },
  { type: 'Appartement (loyer mensuel médian)', territory: 'RE', price: 490, unit: '€/mois', surface: 50, rooms: 2, category: 'Loyer', source: 'INSEE Enquête Logement DOM 2023' },
  { type: 'Appartement — prix médian m²', territory: 'RE', price: 2_950, unit: '€/m²', category: 'Immobilier', source: 'DVF La Réunion 2023' },
  { type: 'Maison — prix médian m²', territory: 'RE', price: 2_600, unit: '€/m²', category: 'Immobilier', source: 'DVF La Réunion 2023' },

  // ── Guyane (GF / 973) ─────────────────────────────────────────────────────
  { type: 'Studio (T1)', territory: 'GF', price: 9.20, unit: '€/m²/mois', surface: 28, rooms: 1, category: 'Loyer', source: 'ANIL — Conjoncture DOM 2024' },
  { type: 'T2 (2 pièces)', territory: 'GF', price: 8.40, unit: '€/m²/mois', surface: 45, rooms: 2, category: 'Loyer', source: 'ANIL — Conjoncture DOM 2024' },
  { type: 'T3 (3 pièces)', territory: 'GF', price: 7.80, unit: '€/m²/mois', surface: 65, rooms: 3, category: 'Loyer', source: 'ANIL — Conjoncture DOM 2024' },
  { type: 'T4+ (4 pièces et +)', territory: 'GF', price: 7.20, unit: '€/m²/mois', surface: 85, rooms: 4, category: 'Loyer', source: 'ANIL — Conjoncture DOM 2024' },
  { type: 'Maison individuelle', territory: 'GF', price: 6.80, unit: '€/m²/mois', surface: 100, rooms: 4, category: 'Loyer', source: 'ADIL Guyane 2024' },
  { type: 'Appartement (loyer mensuel médian)', territory: 'GF', price: 380, unit: '€/mois', surface: 50, rooms: 2, category: 'Loyer', source: 'INSEE Enquête Logement DOM 2023' },
  { type: 'Appartement — prix médian m²', territory: 'GF', price: 2_100, unit: '€/m²', category: 'Immobilier', source: 'DVF Guyane 2023' },
  { type: 'Maison — prix médian m²', territory: 'GF', price: 1_850, unit: '€/m²', category: 'Immobilier', source: 'DVF Guyane 2023' },

  // ── Mayotte (YT / 976) ────────────────────────────────────────────────────
  { type: 'Studio (T1)', territory: 'YT', price: 8.60, unit: '€/m²/mois', surface: 25, rooms: 1, category: 'Loyer', source: 'INSEE Flash Logement Mayotte 2024' },
  { type: 'T2 (2 pièces)', territory: 'YT', price: 7.90, unit: '€/m²/mois', surface: 40, rooms: 2, category: 'Loyer', source: 'INSEE Flash Logement Mayotte 2024' },
  { type: 'T3 (3 pièces)', territory: 'YT', price: 7.20, unit: '€/m²/mois', surface: 55, rooms: 3, category: 'Loyer', source: 'INSEE Flash Logement Mayotte 2024' },
  { type: 'Maison individuelle', territory: 'YT', price: 6.40, unit: '€/m²/mois', surface: 70, rooms: 3, category: 'Loyer', source: 'INSEE Flash Logement Mayotte 2024' },
  { type: 'Appartement (loyer mensuel médian)', territory: 'YT', price: 310, unit: '€/mois', surface: 40, rooms: 2, category: 'Loyer', source: 'INSEE Flash Logement Mayotte 2024' },
  { type: 'Appartement — prix médian m²', territory: 'YT', price: 1_650, unit: '€/m²', category: 'Immobilier', source: 'DVF Mayotte 2023' },
  { type: 'Maison — prix médian m²', territory: 'YT', price: 1_400, unit: '€/m²', category: 'Immobilier', source: 'DVF Mayotte 2023' },
];

// ─── Parseur DVF (CSV open data) ──────────────────────────────────────────────

/**
 * Calcule le prix médian d'un tableau de nombres (utilise la valeur centrale).
 * @param {number[]} arr
 * @returns {number}
 */
function median(arr) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 100) / 100
    : sorted[mid];
}

/**
 * Parse un CSV DVF et calcule les médianes €/m² par type de bien et territoire.
 * @param {string} text        CSV brut
 * @param {string} territory   Code territoire (GP/MQ/…)
 * @param {string} sourceUrl
 * @returns {LoyerEntry[]}
 */
function parseDVFCsv(text, territory, sourceUrl) {
  /** @type {LoyerEntry[]} */
  const entries = [];
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return entries;

  const sep  = lines[0].includes(';') ? ';' : ',';
  const cols = lines[0].split(sep).map((c) => c.toLowerCase().trim().replace(/"/g, ''));

  const typeIdx    = cols.findIndex((c) => /type_local|nature|type_bien/i.test(c));
  const priceIdx   = cols.findIndex((c) => /valeur_fonciere|valeur|montant|prix/i.test(c));
  const surfIdx    = cols.findIndex((c) => /surface_reelle|surface_carrez|surface/i.test(c));
  const deptIdx    = cols.findIndex((c) => /code_departement|departement|dept/i.test(c));

  if (priceIdx < 0 || surfIdx < 0) return entries;

  /** @type {Record<string, number[]>} Regroupement prix/m² par type */
  const byType = {};

  for (const line of lines.slice(1, 5_000)) {
    const cells = line.split(sep).map((c) => c.trim().replace(/"/g, ''));

    // Filtre département DOM si colonne disponible
    if (deptIdx >= 0) {
      const dept = cells[deptIdx] ?? '';
      const domDepts = { GP: '971', MQ: '972', GF: '973', RE: '974', YT: '976' };
      if (dept && dept !== domDepts[territory]) continue;
    }

    const price  = parseFloat((cells[priceIdx] ?? '0').replace(',', '.'));
    const surf   = parseFloat((cells[surfIdx]  ?? '0').replace(',', '.'));
    if (price <= 0 || surf <= 0 || price / surf > 20_000) continue; // sanity

    const rawType = typeIdx >= 0 ? (cells[typeIdx] ?? '').toLowerCase() : 'appartement';
    const type = rawType.includes('maison') ? 'Maison' :
                 rawType.includes('appart')  ? 'Appartement' :
                 'Autre';

    if (type === 'Autre') continue;
    if (!byType[type]) byType[type] = [];
    byType[type].push(Math.round(price / surf));
  }

  const period = new Date().toISOString().slice(0, 7);
  for (const [type, prices] of Object.entries(byType)) {
    if (prices.length < 10) continue; // trop peu d'observations
    entries.push({
      type: `${type} — prix médian m² (DVF live)`,
      territory,
      price: median(prices),
      unit: '€/m²',
      category: 'Immobilier',
      period,
      source: 'DVF — data.gouv.fr',
      sourceUrl,
    });
  }

  return entries;
}

// ─── Parseur loyers ANIL/OLAP (CSV open data) ────────────────────────────────

/**
 * Parse un CSV de loyers ANIL/OLAP et extrait les loyers médians DOM.
 * @param {string} text
 * @param {string} sourceUrl
 * @returns {LoyerEntry[]}
 */
function parseANILCsv(text, sourceUrl) {
  /** @type {LoyerEntry[]} */
  const entries = [];
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return entries;

  const sep  = lines[0].includes(';') ? ';' : ',';
  const cols = lines[0].split(sep).map((c) => c.toLowerCase().trim().replace(/"/g, ''));

  const terrIdx  = cols.findIndex((c) => /territ|dept|zone|dom/i.test(c));
  const typeIdx  = cols.findIndex((c) => /type|categor|class|niveau/i.test(c));
  const priceIdx = cols.findIndex((c) => /loyer|prix|mediane|median|tarif/i.test(c));
  const unitIdx  = cols.findIndex((c) => /unit/i.test(c));

  if (priceIdx < 0) return entries;

  const TERR_MAP = {
    guadeloupe: 'GP', '971': 'GP',
    martinique: 'MQ', '972': 'MQ',
    guyane: 'GF',     '973': 'GF',
    réunion: 'RE', reunion: 'RE', '974': 'RE',
    mayotte: 'YT',    '976': 'YT',
  };

  const period = new Date().toISOString().slice(0, 7);
  for (const line of lines.slice(1, 100)) {
    const cells = line.split(sep).map((c) => c.trim().replace(/"/g, ''));
    const price = parseFloat((cells[priceIdx] ?? '0').replace(',', '.'));
    if (price <= 0 || price > 50) continue; // sanity €/m²/mois

    let territory = null;
    if (terrIdx >= 0) {
      const t = (cells[terrIdx] ?? '').toLowerCase();
      for (const [k, v] of Object.entries(TERR_MAP)) {
        if (t.includes(k)) { territory = v; break; }
      }
    }
    if (!territory) continue;

    const typeLabel = typeIdx >= 0 ? (cells[typeIdx] ?? 'Logement') : 'Logement';
    const unit = unitIdx >= 0 ? (cells[unitIdx] ?? '€/m²/mois') : '€/m²/mois';

    entries.push({
      type: `${typeLabel} (ANIL live)`,
      territory,
      price: Math.round(price * 100) / 100,
      unit,
      category: 'Loyer',
      period,
      source: 'ANIL/OLAP — data.gouv.fr',
      sourceUrl,
    });
  }
  return entries;
}

// ─── Fetch live DVF ───────────────────────────────────────────────────────────

async function fetchDVFData() {
  /** @type {LoyerEntry[]} */
  const entries = [];

  const data = await fetchJSON(
    'https://www.data.gouv.fr/api/1/datasets/?q=dvf+outre-mer+transactions+immobilieres&page_size=5',
    'DVF datasets',
  );

  if (data?.data?.length) {
    for (const ds of data.data.slice(0, 3)) {
      const csvRes = (ds.resources ?? []).find((r) =>
        (r.format ?? '').toLowerCase() === 'csv',
      );
      if (!csvRes) continue;

      const text = await fetchText(csvRes.url, 'DVF CSV');
      if (!text) continue;

      // Détermine le territoire depuis le titre/description du dataset
      const title = (ds.title ?? ds.description ?? '').toLowerCase();
      const terrMap = {
        guadeloupe: 'GP', martinique: 'MQ', guyane: 'GF',
        réunion: 'RE', reunion: 'RE', mayotte: 'YT',
      };
      let territory = 'GP';
      for (const [k, v] of Object.entries(terrMap)) {
        if (title.includes(k)) { territory = v; break; }
      }

      const parsed = parseDVFCsv(text, territory, csvRes.url);
      if (parsed.length > 0) {
        entries.push(...parsed);
        console.log(`  ✅ [loyer] DVF ${territory}: ${parsed.length} médianes live`);
      }
      await sleep(800);
    }
  }

  return entries;
}

// ─── Fetch live ANIL/OLAP ─────────────────────────────────────────────────────

async function fetchANILData() {
  /** @type {LoyerEntry[]} */
  const entries = [];

  for (const query of [
    'observatoire+loyers+dom+tom',
    'loyers+medians+dom+departements+outre-mer',
  ]) {
    const data = await fetchJSON(
      `https://www.data.gouv.fr/api/1/datasets/?q=${query}&page_size=5`,
      `ANIL datasets (${query.slice(0, 20)})`,
    );
    if (!data?.data?.length) continue;

    for (const ds of data.data.slice(0, 2)) {
      const csvRes = (ds.resources ?? []).find((r) =>
        ['csv', 'json'].includes((r.format ?? '').toLowerCase()),
      );
      if (!csvRes) continue;

      const text = await fetchText(csvRes.url, 'ANIL CSV');
      if (!text) continue;

      const parsed = parseANILCsv(text, csvRes.url);
      if (parsed.length > 0) {
        entries.push(...parsed);
        console.log(`  ✅ [loyer] ANIL live: ${parsed.length} loyers extraits`);
        break;
      }
      await sleep(600);
    }
    if (entries.length >= 5) break;
  }

  return entries;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Scrape les données de logement et loyers DOM-TOM.
 *
 * Stratégie :
 *   1. DVF live (data.gouv.fr) : prix transactions immobilières DOM
 *   2. ANIL/OLAP live (data.gouv.fr) : loyers pratiqués DOM
 *   3. Toujours inclure les données de référence ANIL/INSEE 2024 pour
 *      couvrir les territoires non présents dans les données live.
 *
 * @returns {Promise<LoyerEntry[]>}
 */
export async function scrapeLoyerPrices() {
  console.log('  🏠 [loyer] Scraping données logement DOM-TOM…');

  const [dvfLive, anilLive] = await Promise.all([
    fetchDVFData(),
    fetchANILData(),
  ]);

  const period = new Date().toISOString().slice(0, 7);

  // Données live couvrant quels territoires+catégories
  const liveCovered = new Set([
    ...dvfLive.map((e) => `${e.territory}|${e.category}`),
    ...anilLive.map((e) => `${e.territory}|${e.category}`),
  ]);

  // Références : seulement pour les combos pas déjà couverts par le live
  const refEntries = LOYERS_REFERENCE
    .filter((e) => !liveCovered.has(`${e.territory}|${e.category}`))
    .map((e) => ({
      ...e,
      period,
      sourceUrl: 'https://www.anil.org / https://www.insee.fr',
    }));

  const all = [...dvfLive, ...anilLive, ...refEntries];

  console.log(
    `  📊 [loyer] ${all.length} entrées logement` +
    ` (DVF: ${dvfLive.length}, ANIL: ${anilLive.length}, ref: ${refEntries.length})`,
  );
  return all;
}
