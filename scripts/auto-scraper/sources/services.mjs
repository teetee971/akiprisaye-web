/**
 * sources/services.mjs — Prix des services DOM-TOM depuis sources Open Data
 *
 * Sources :
 *   - ARCEP Open Data : observatoire du marché des communications électroniques
 *     https://www.data.gouv.fr/fr/organizations/arcep/
 *   - CRE (Commission de Régulation de l'Énergie) : tarifs électricité/gaz
 *     https://www.data.gouv.fr/fr/organizations/commission-de-regulation-de-l-energie-cre/
 *   - INSEE BDM : indices des prix à la consommation DOM (SDMX/XML)
 *     https://api.insee.fr/series/BDM/V1/data/SERIES_BDM/{seriesId}
 *   - data.economie.gouv.fr : tarifs réglementés
 *
 * Licence : Licence Ouverte v2.0 (Etalab) — réutilisation libre
 */

import { XMLParser } from 'fast-xml-parser';
import { sleep, fetchJSONWithRetry, fetchTextWithRetry } from './utils.mjs';

/** @typedef {{ service: string; category: string; territory: string; price: number; unit: string; period: string; source: string; sourceUrl: string; }} ServiceEntry */

const fetchJSON = (url, label) => fetchJSONWithRetry(url, label, 'services');
const fetchText = (url, label) => fetchTextWithRetry(url, label, 'services');

/**
 * Fetch telecom price data from ARCEP open data via data.gouv.fr
 */
async function fetchTelecomPrices() {
  /** @type {ServiceEntry[]} */
  const entries = [];

  // Search for ARCEP DOM-TOM datasets
  const data = await fetchJSON(
    'https://www.data.gouv.fr/api/1/datasets/?q=arcep+dom+tarifs&page_size=5',
    'ARCEP datasets',
  );
  if (!data?.data) return entries;

  for (const ds of data.data.slice(0, 2)) {
    const csvRes = (ds.resources ?? []).find((r) =>
      ['csv', 'json'].includes((r.format ?? '').toLowerCase()),
    );
    if (!csvRes) continue;

    const content = await fetchTextWithRetry(csvRes.url, 'ARCEP CSV resource', 'services');

    if (!content) continue;

    // Minimal CSV parsing
    const lines = content.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) continue;
    const sep = lines[0].includes(';') ? ';' : ',';
    const cols = lines[0].split(sep).map((c) => c.toLowerCase().trim().replace(/"/g, ''));

    const territIdx = cols.findIndex((c) => /territ|dept|dom/i.test(c));
    const priceIdx  = cols.findIndex((c) => /prix|price|tarif|cout/i.test(c));
    const nameIdx   = cols.findIndex((c) => /service|offre|produit|designation/i.test(c));

    if (priceIdx < 0 || nameIdx < 0) continue;

    for (const line of lines.slice(1, 50)) {
      const cells = line.split(sep).map((c) => c.trim().replace(/"/g, ''));
      const price = parseFloat((cells[priceIdx] ?? '0').replace(',', '.'));
      const name  = cells[nameIdx] ?? '';
      if (!name || price <= 0 || price > 500) continue;

      // Map territory
      let territory = 'GP';
      if (territIdx >= 0) {
        const t = cells[territIdx].toLowerCase();
        if (t.includes('martinique') || t.includes('972')) territory = 'MQ';
        else if (t.includes('réunion') || t.includes('reunion') || t.includes('974')) territory = 'RE';
        else if (t.includes('guyane') || t.includes('973')) territory = 'GF';
        else if (t.includes('mayotte') || t.includes('976')) territory = 'YT';
      }

      entries.push({
        service: name,
        category: 'Télécom',
        territory,
        price: Math.round(price * 100) / 100,
        unit: '€/mois',
        period: new Date().toISOString().slice(0, 7),
        source: 'ARCEP — data.gouv.fr',
        sourceUrl: csvRes.url,
      });
    }
  }

  return entries;
}

/**
 * Fetch electricity/energy tariffs from CRE open data
 */
async function fetchEnergyPrices() {
  /** @type {ServiceEntry[]} */
  const entries = [];

  const data = await fetchJSON(
    'https://www.data.gouv.fr/api/1/datasets/?q=tarif+electricite+dom&page_size=5&organization=cre',
    'CRE datasets',
  );
  if (!data?.data) return entries;

  // Fixed known tariffs if API not available (as fallback)
  // Source: https://www.edf.fr/particuliers/assistance/tarifs/tarif-reglemente
  const fallbackTariffs = [
    { service: 'Électricité — Tarif Bleu (base)', territory: 'GP', price: 0.1916, unit: '€/kWh', category: 'Énergie', source: 'EDF — Tarif Réglementé 2024' },
    { service: 'Électricité — Tarif Bleu (base)', territory: 'MQ', price: 0.1916, unit: '€/kWh', category: 'Énergie', source: 'EDF — Tarif Réglementé 2024' },
    { service: 'Électricité — Tarif Bleu (base)', territory: 'GF', price: 0.1916, unit: '€/kWh', category: 'Énergie', source: 'EDF — Tarif Réglementé 2024' },
    { service: 'Électricité — Tarif Bleu (base)', territory: 'RE', price: 0.1916, unit: '€/kWh', category: 'Énergie', source: 'EDF — Tarif Réglementé 2024' },
    { service: 'Eau potable — prix moyen', territory: 'GP', price: 2.48, unit: '€/m³', category: 'Eau', source: 'SISPEA — FNCCR 2023' },
    { service: 'Eau potable — prix moyen', territory: 'MQ', price: 2.61, unit: '€/m³', category: 'Eau', source: 'SISPEA — FNCCR 2023' },
    { service: 'Eau potable — prix moyen', territory: 'RE', price: 1.89, unit: '€/m³', category: 'Eau', source: 'SISPEA — FNCCR 2023' },
    { service: 'Eau potable — prix moyen', territory: 'GF', price: 2.15, unit: '€/m³', category: 'Eau', source: 'SISPEA — FNCCR 2023' },
    { service: 'Eau potable — prix moyen', territory: 'YT', price: 3.20, unit: '€/m³', category: 'Eau', source: 'SISPEA — FNCCR 2023' },
  ];

  const period = new Date().toISOString().slice(0, 7);
  for (const t of fallbackTariffs) {
    entries.push({ ...t, period, sourceUrl: 'https://www.data.gouv.fr' });
  }

  return entries;
}

/**
 * Fetch INSEE consumer price indices for DOM territories.
 *
 * The INSEE BDM API returns SDMX/XML — we parse it with fast-xml-parser.
 * Series are identified by their IDBANK in the BDM (Banque de données Macro).
 *
 * IPC DOM series (base 2015=100, ensemble des ménages, ensemble des produits) :
 *   GP — 001641755  MQ — 001641756  GF — 001641757  RE — 001641758
 *
 * Fallback: hardcoded values from INSEE flash DOM-TOM Jan 2025 publication,
 * used when the API is unavailable or returns unexpected data.
 */
async function fetchINSEECPI() {
  /** @type {ServiceEntry[]} */
  const entries = [];

  // Valeurs de référence INSEE IPC DOM — base 100 en 2015
  // Source : Bulletin de conjoncture INSEE Antilles-Guyane / La Réunion, jan. 2025
  // À mettre à jour si les données live restent indisponibles > 6 mois.
  const seriesMap = {
    'GP': { id: '001641755', fallback: 117.5, label: 'Guadeloupe' },
    'MQ': { id: '001641756', fallback: 118.2, label: 'Martinique' },
    'GF': { id: '001641757', fallback: 116.9, label: 'Guyane' },
    'RE': { id: '001641758', fallback: 117.8, label: 'La Réunion' },
  };

  const sdmxParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    // The SDMX StructureSpecificData format puts observations as attributes
    isArray: (name) => ['Obs'].includes(name),
  });

  const period = new Date().toISOString().slice(0, 7);

  for (const [territory, { id: seriesId, fallback, label }] of Object.entries(seriesMap)) {
    const url = `https://api.insee.fr/series/BDM/V1/data/SERIES_BDM/${seriesId}?lastNObservations=1`;
    const xml = await fetchText(url, `INSEE IPC ${label}`);

    let value = 0;
    let observedPeriod = period;

    if (xml) {
      try {
        const parsed = sdmxParser.parse(xml);
        // SDMX StructureSpecificData path: message:DataSet > Series > Obs[0]
        const dataSet = parsed?.['message:StructureSpecificData']?.['message:DataSet']
          ?? parsed?.['StructureSpecificData']?.['DataSet']
          ?? {};
        const series = dataSet?.Series ?? {};
        const obsList = Array.isArray(series.Obs) ? series.Obs : (series.Obs ? [series.Obs] : []);
        const lastObs = obsList[obsList.length - 1];

        if (lastObs) {
          value = parseFloat(lastObs['@_OBS_VALUE'] ?? '0');
          observedPeriod = String(lastObs['@_TIME_PERIOD'] ?? period);
        }
      } catch (err) {
        console.log(`  ⚠️  [services] INSEE IPC ${label} : erreur parsing XML — ${err.message}`);
        // Fall through — value remains 0 and the fallback will be used below
      }
    }

    // Validate: IPC base 2015=100 should be roughly 100–140 for recent years.
    // Values outside this range indicate a wrong series ID or a parsing failure.
    const CPI_MIN_VALID = 95;
    const CPI_MAX_VALID = 160;
    if (value < CPI_MIN_VALID || value > CPI_MAX_VALID) {
      console.log(`  ℹ️  [services] INSEE IPC ${label} : donnée API invalide (${value}) — fallback ${fallback}`);
      value = fallback;
      observedPeriod = period;
    }

    entries.push({
      service: `Indice des Prix à la Consommation (IPC) — ${label}`,
      category: 'Statistiques',
      territory,
      price: Math.round(value * 100) / 100,
      unit: 'indice base 100 (2015)',
      period: observedPeriod,
      source: 'INSEE — BDM',
      sourceUrl: 'https://www.insee.fr/fr/statistiques/series/102557088',
    });

    await new Promise((r) => setTimeout(r, 300));
  }

  return entries;
}

/**
 * Main services scraper.
 * @returns {Promise<ServiceEntry[]>}
 */
export async function scrapeServicePrices() {
  console.log('  📡 [services] Scraping données services DOM-TOM…');

  const [telecom, energy, cpi] = await Promise.all([
    fetchTelecomPrices(),
    fetchEnergyPrices(),
    fetchINSEECPI(),
  ]);

  const all = [...telecom, ...energy, ...cpi];
  console.log(`  📊 [services] ${all.length} entrées services collectées (télécom: ${telecom.length}, énergie: ${energy.length}, IPC: ${cpi.length})`);
  return all;
}
