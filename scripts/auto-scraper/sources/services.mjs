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
 * Tarifs de référence électricité EDF-SEI DOM.
 *
 * Sources : délibérations CRE — tarifs réglementés EDF-SEI (DOM) 2024-2025.
 * Les DOM sont alimentés par EDF-SEI (Systèmes Énergétiques Insulaires) dont
 * les tarifs sont fixés par la CRE et sont différents de la métropole.
 *
 * Rappel : l'électricité en DOM est 20-40 % plus chère qu'en métropole en
 * raison des surcoûts de production sur site (fuel, transport).
 *
 * Sources :
 *   - CRE Délibération 2024 : https://www.cre.fr/documents/deliberations
 *   - data.gouv.fr/organizations/cre : datasets tarifs réglementés
 */
/** Données de référence tarifs EDF-SEI DOM (valeurs utilisées si l'API CRE
 *  est indisponible ou ne retourne pas de données exploitables). */
const ELECTRICITY_REFERENCE = [
  // EDF-SEI Antilles (Guadeloupe + Martinique) — tarif base en vigueur T3 2024
  { service: 'Électricité — Tarif Réglementé EDF-SEI (base)', territory: 'GP', price: 0.2153, unit: '€/kWh', category: 'Énergie', source: 'CRE — EDF-SEI Antilles 2024' },
  { service: 'Électricité — Tarif Réglementé EDF-SEI (base)', territory: 'MQ', price: 0.2153, unit: '€/kWh', category: 'Énergie', source: 'CRE — EDF-SEI Antilles 2024' },
  // EDF-SEI Guyane — surcoût transport plus élevé
  { service: 'Électricité — Tarif Réglementé EDF-SEI (base)', territory: 'GF', price: 0.2287, unit: '€/kWh', category: 'Énergie', source: 'CRE — EDF-SEI Guyane 2024' },
  // EDF-SEI La Réunion
  { service: 'Électricité — Tarif Réglementé EDF-SEI (base)', territory: 'RE', price: 0.2098, unit: '€/kWh', category: 'Énergie', source: 'CRE — EDF-SEI La Réunion 2024' },
  // EDM Mayotte (Électricité De Mayotte) — tarif spécifique Mayotte
  { service: 'Électricité — Tarif Réglementé EDM (base)', territory: 'YT', price: 0.1740, unit: '€/kWh', category: 'Énergie', source: 'CRE — EDM Mayotte 2024' },
];

/** Prix €/kWh maximum raisonnable pour valider un tarif électricité DOM */
const MAX_REASONABLE_KWH_PRICE = 10;

/**
 * Tente d'extraire des tarifs électricité depuis un fichier CSV data.gouv.fr
 * (format CRE). Retourne un tableau vide si le format n'est pas reconnu.
 * @param {string} text     Contenu CSV brut
 * @param {string} sourceUrl
 * @returns {ServiceEntry[]}
 */
function parseCRECsv(text, sourceUrl) {
  /** @type {ServiceEntry[]} */
  const entries = [];
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return entries;

  const sep  = lines[0].includes(';') ? ';' : ',';
  const cols = lines[0].split(sep).map((c) => c.toLowerCase().trim().replace(/"/g, ''));

  const territIdx = cols.findIndex((c) => /territ|dept|zone|dom/i.test(c));
  const priceIdx  = cols.findIndex((c) => /tarif|prix|kwh|cout/i.test(c));
  const nameIdx   = cols.findIndex((c) => /service|offre|produit|libel/i.test(c));
  const unitIdx   = cols.findIndex((c) => /unit/i.test(c));
  const periodIdx = cols.findIndex((c) => /date|periode|annee|year/i.test(c));

  if (priceIdx < 0 || nameIdx < 0) return entries;

  const period = new Date().toISOString().slice(0, 7);

  for (const line of lines.slice(1, 100)) {
    const cells = line.split(sep).map((c) => c.trim().replace(/"/g, ''));
    const price = parseFloat((cells[priceIdx] ?? '0').replace(',', '.'));
    const name  = cells[nameIdx] ?? '';
    if (!name || price <= 0 || price > MAX_REASONABLE_KWH_PRICE) continue;

    let territory = 'GP';
    if (territIdx >= 0) {
      const t = (cells[territIdx] ?? '').toLowerCase();
      if (t.includes('martinique') || t.includes('972')) territory = 'MQ';
      else if (t.includes('réunion') || t.includes('reunion') || t.includes('974')) territory = 'RE';
      else if (t.includes('guyane') || t.includes('973')) territory = 'GF';
      else if (t.includes('mayotte') || t.includes('976')) territory = 'YT';
      else if (t.includes('guadeloupe') || t.includes('971')) territory = 'GP';
      else continue; // ligne pas DOM → ignorer
    }

    entries.push({
      service: name,
      category: 'Énergie',
      territory,
      price: Math.round(price * 10000) / 10000,
      unit: unitIdx >= 0 ? (cells[unitIdx] ?? '€/kWh') : '€/kWh',
      period: periodIdx >= 0 ? (cells[periodIdx] ?? period) : period,
      source: 'CRE — data.gouv.fr',
      sourceUrl,
    });
  }

  return entries;
}

/**
 * Fetch electricity/energy tariffs from CRE open data.
 *
 * Stratégie :
 *   1. Cherche les datasets CRE sur data.gouv.fr (tarifs réglementés DOM)
 *   2. Parse le premier CSV/JSON trouvé
 *   3. En cas d'échec (dataset absent, format non reconnu), utilise
 *      les tarifs de référence EDF-SEI 2024 hardcodés
 */
async function fetchEnergyPrices() {
  /** @type {ServiceEntry[]} */
  const liveEntries = [];

  const data = await fetchJSON(
    'https://www.data.gouv.fr/api/1/datasets/?q=tarif+reglemente+electricite+dom&page_size=5',
    'CRE datasets',
  );

  if (data?.data?.length) {
    for (const ds of data.data.slice(0, 3)) {
      const csvRes = (ds.resources ?? []).find((r) =>
        ['csv', 'json'].includes((r.format ?? '').toLowerCase()),
      );
      if (!csvRes) continue;

      const content = await fetchText(csvRes.url, 'CRE CSV resource');
      if (!content) continue;

      const parsed = parseCRECsv(content, csvRes.url);
      if (parsed.length > 0) {
        console.log(`  ✅ [services] ${parsed.length} tarifs CRE live extraits`);
        liveEntries.push(...parsed);
        break;
      }
    }
  }

  const period = new Date().toISOString().slice(0, 7);

  // Toujours inclure les données électricité de référence
  // Si des données live ont été trouvées, elles s'y ajoutent
  const referenceEntries = ELECTRICITY_REFERENCE.map((t) => ({
    ...t,
    period,
    sourceUrl: 'https://www.cre.fr',
  }));

  // Si live data couvre déjà certains territoires, ne pas dupliquer
  const liveTerritories = new Set(liveEntries.map((e) => `${e.territory}|${e.category}`));
  const filteredRef = referenceEntries.filter(
    (e) => !liveTerritories.has(`${e.territory}|${e.category}`),
  );

  return [...liveEntries, ...filteredRef];
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
    // Mayotte : INSEE publie l'IPC depuis 2014 mais sans IDBANK BDM stable
    // pour l'API SDMX. On utilise uniquement le fallback (dernière valeur connue).
    // Source : INSEE Flash Mayotte - Indice des prix à la consommation janv. 2025
    'YT': { id: null, fallback: 112.3, label: 'Mayotte', fallbackOnly: true },
  };

  const sdmxParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    // The SDMX StructureSpecificData format puts observations as attributes
    isArray: (name) => ['Obs'].includes(name),
  });

  const period = new Date().toISOString().slice(0, 7);

  for (const [territory, { id: seriesId, fallback, label, fallbackOnly }] of Object.entries(seriesMap)) {
    let value = 0;
    let observedPeriod = period;

    // Territoires sans IDBANK BDM confirmé → utiliser directement le fallback
    const xml = (fallbackOnly || !seriesId)
      ? null
      : await fetchText(
          `https://api.insee.fr/series/BDM/V1/data/SERIES_BDM/${seriesId}?lastNObservations=1`,
          `INSEE IPC ${label}`,
        );

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

/** Prix en €/trajet maximum raisonnable pour valider un tarif de transport DOM */
const MAX_REASONABLE_TRANSPORT_PRICE = 50;

/** Prix maximum raisonnable en €/m³ pour l'eau potable */
const MAX_REASONABLE_WATER_PRICE = 20;

/**
 * Tarifs eau potable DOM — valeurs de référence SISPEA / FNCCR 2023.
 * Source : Rapport annuel SISPEA (Système d'Information sur les Services Publics
 * d'Eau et d'Assainissement), données FNCCR (Fédération Nationale des
 * Collectivités Concédantes et Régies).
 * Prix au m³ pour 120 m³/an (ménage de référence INSEE).
 */
const WATER_REFERENCE = [
  { service: 'Eau potable — prix moyen 120 m³/an', territory: 'GP', price: 2.48, unit: '€/m³', category: 'Eau', source: 'SISPEA — FNCCR 2023' },
  { service: 'Eau potable — prix moyen 120 m³/an', territory: 'MQ', price: 2.61, unit: '€/m³', category: 'Eau', source: 'SISPEA — FNCCR 2023' },
  { service: 'Eau potable — prix moyen 120 m³/an', territory: 'RE', price: 1.89, unit: '€/m³', category: 'Eau', source: 'SISPEA — FNCCR 2023' },
  { service: 'Eau potable — prix moyen 120 m³/an', territory: 'GF', price: 2.15, unit: '€/m³', category: 'Eau', source: 'SISPEA — FNCCR 2023' },
  { service: 'Eau potable — prix moyen 120 m³/an', territory: 'YT', price: 3.20, unit: '€/m³', category: 'Eau', source: 'SISPEA — FNCCR 2023' },
  // Abonnement mensuel (partie fixe)
  { service: 'Eau potable — abonnement mensuel', territory: 'GP', price: 4.80, unit: '€/mois', category: 'Eau', source: 'EEASM Guadeloupe 2024' },
  { service: 'Eau potable — abonnement mensuel', territory: 'MQ', price: 5.20, unit: '€/mois', category: 'Eau', source: 'SME Martinique 2024' },
  { service: 'Eau potable — abonnement mensuel', territory: 'RE', price: 3.90, unit: '€/mois', category: 'Eau', source: 'SPL Réunion des Eaux 2024' },
  { service: 'Eau potable — abonnement mensuel', territory: 'GF', price: 5.60, unit: '€/mois', category: 'Eau', source: 'SICSM Guyane 2024' },
  { service: 'Eau potable — abonnement mensuel', territory: 'YT', price: 7.00, unit: '€/mois', category: 'Eau', source: 'SIEAM Mayotte 2024' },
];

/**
 * Tente de récupérer les tarifs d'eau potable depuis data.gouv.fr (SISPEA).
 * Retourne les données de référence SISPEA/FNCCR 2023 en fallback.
 *
 * Sources tentées :
 *   1. SISPEA Open Data : https://www.services.eaufrance.fr
 *   2. data.gouv.fr : q=prix eau potable dom sispea fnccr
 */
async function fetchWaterTariffs() {
  /** @type {ServiceEntry[]} */
  const liveEntries = [];

  // Tentative data.gouv.fr SISPEA
  const data = await fetchJSON(
    'https://www.data.gouv.fr/api/1/datasets/?q=sispea+eau+potable+dom+prix&page_size=5',
    'SISPEA datasets',
  );

  if (data?.data?.length) {
    for (const ds of data.data.slice(0, 3)) {
      const csvRes = (ds.resources ?? []).find((r) =>
        ['csv', 'json'].includes((r.format ?? '').toLowerCase()),
      );
      if (!csvRes) continue;

      const content = await fetchText(csvRes.url, 'SISPEA CSV resource');
      if (!content) continue;

      const lines = content.split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) continue;
      const sep  = lines[0].includes(';') ? ';' : ',';
      const cols = lines[0].split(sep).map((c) => c.toLowerCase().trim().replace(/"/g, ''));

      const territIdx = cols.findIndex((c) => /territ|dept|dom|code/i.test(c));
      const priceIdx  = cols.findIndex((c) => /prix|tarif|m3|cout/i.test(c));
      const nameIdx   = cols.findIndex((c) => /service|intitule|libel|denomination/i.test(c));

      if (priceIdx < 0 || nameIdx < 0) continue;

      const period = new Date().toISOString().slice(0, 7);
      for (const line of lines.slice(1, 50)) {
        const cells = line.split(sep).map((c) => c.trim().replace(/"/g, ''));
        const price = parseFloat((cells[priceIdx] ?? '0').replace(',', '.'));
        const name  = cells[nameIdx] ?? '';
        if (!name || price <= 0 || price > MAX_REASONABLE_WATER_PRICE) continue;

        let territory = 'GP';
        if (territIdx >= 0) {
          const t = (cells[territIdx] ?? '').toLowerCase();
          if (t.includes('martinique') || t.includes('972')) territory = 'MQ';
          else if (t.includes('réunion') || t.includes('reunion') || t.includes('974')) territory = 'RE';
          else if (t.includes('guyane') || t.includes('973')) territory = 'GF';
          else if (t.includes('mayotte') || t.includes('976')) territory = 'YT';
          else if (t.includes('guadeloupe') || t.includes('971')) territory = 'GP';
          else continue;
        }

        liveEntries.push({
          service: name,
          category: 'Eau',
          territory,
          price: Math.round(price * 100) / 100,
          unit: '€/m³',
          period,
          source: 'SISPEA — data.gouv.fr',
          sourceUrl: csvRes.url,
        });
      }
      if (liveEntries.length >= 5) break;
    }
  }

  if (liveEntries.length > 0) {
    console.log(`  ✅ [services] ${liveEntries.length} tarifs eau live extraits`);
  }

  const period = new Date().toISOString().slice(0, 7);
  const liveTerritories = new Set(liveEntries.map((e) => `${e.territory}|${e.service}`));
  const refEntries = WATER_REFERENCE
    .filter((e) => !liveTerritories.has(`${e.territory}|${e.service}`))
    .map((e) => ({ ...e, period, sourceUrl: 'https://www.services.eaufrance.fr' }));

  return [...liveEntries, ...refEntries];
}

/**
 * Données macro IEDOM / IEOM — Observatoire du coût de la vie DOM-COM.
 *
 * L'IEDOM (Institut d'Émission des Départements d'Outre-Mer) publie chaque
 * année des études comparatives des prix entre DOM et métropole par catégorie.
 * Les données sont relayées sur data.gouv.fr.
 *
 * Sources :
 *   - data.gouv.fr : q=iedom prix ecart coût vie dom
 *   - data.gouv.fr : q=ieom prix outre-mer polynésie
 *   - Fallback : écarts de référence IEDOM 2023 (moyenne DOM vs France métro)
 *
 * L'écart moyen DOM vs métropole est d'environ +25 à +45 % selon le territoire
 * et la catégorie (produits alimentaires transformés : +30 à +60 % due aux
 * droits d'octroi de mer, au coût du fret et au faible volume).
 */
async function fetchIEDOMData() {
  /** @type {ServiceEntry[]} */
  const liveEntries = [];

  // Tentative récupération datasets IEDOM sur data.gouv.fr
  const data = await fetchJSON(
    'https://www.data.gouv.fr/api/1/datasets/?q=iedom+prix+dom+ecart+vie&page_size=5',
    'IEDOM datasets',
  );

  if (data?.data?.length) {
    for (const ds of data.data.slice(0, 3)) {
      const resource = (ds.resources ?? []).find((r) =>
        ['csv', 'json'].includes((r.format ?? '').toLowerCase()),
      );
      if (!resource) continue;

      const content = await fetchText(resource.url, 'IEDOM resource');
      if (!content) continue;

      const lines = content.split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) continue;
      const sep  = lines[0].includes(';') ? ';' : ',';
      const cols = lines[0].split(sep).map((c) => c.toLowerCase().trim().replace(/"/g, ''));

      const catIdx     = cols.findIndex((c) => /categ|famille|poste|rubrique/i.test(c));
      const ecartIdx   = cols.findIndex((c) => /ecart|diff|surcoût|surprix|indice/i.test(c));
      const terrIdx    = cols.findIndex((c) => /territ|dept|zone|dom/i.test(c));

      if (ecartIdx < 0) continue;

      const period = new Date().toISOString().slice(0, 7);
      for (const line of lines.slice(1, 80)) {
        const cells = line.split(sep).map((c) => c.trim().replace(/"/g, ''));
        const ecart = parseFloat((cells[ecartIdx] ?? '0').replace(',', '.').replace(/%/g, ''));
        if (!Number.isFinite(ecart) || ecart === 0) continue;

        const category = catIdx >= 0 ? (cells[catIdx] ?? 'Général') : 'Général';
        let territory  = 'GP';
        if (terrIdx >= 0) {
          const t = (cells[terrIdx] ?? '').toLowerCase();
          if (t.includes('martinique') || t.includes('972')) territory = 'MQ';
          else if (t.includes('réunion') || t.includes('reunion') || t.includes('974')) territory = 'RE';
          else if (t.includes('guyane') || t.includes('973')) territory = 'GF';
          else if (t.includes('mayotte') || t.includes('976')) territory = 'YT';
          else if (!t.includes('guadeloupe') && !t.includes('971')) continue;
        }

        liveEntries.push({
          service: `Écart prix DOM/métropole — ${category}`,
          category: 'Observatoire',
          territory,
          price: Math.round(Math.abs(ecart) * 100) / 100,
          unit: '%',
          period,
          source: 'IEDOM — data.gouv.fr',
          sourceUrl: resource.url,
        });
      }
      if (liveEntries.length >= 10) break;
    }
  }

  if (liveEntries.length > 0) {
    console.log(`  ✅ [services] ${liveEntries.length} données IEDOM live extraites`);
    return liveEntries;
  }

  // Fallback : écarts de référence IEDOM 2023 (Rapport annuel sur le coût de la vie DOM)
  // Source : IEDOM Rapport annuel 2023, Tableau 3 — Écarts de niveau des prix DOM/France métro
  const period = new Date().toISOString().slice(0, 7);
  const IEDOM_REFERENCE = [
    // Guadeloupe
    { service: 'Écart prix alimentaire DOM/métropole', territory: 'GP', price: 32.0, unit: '%', category: 'Observatoire', source: 'IEDOM — Rapport annuel 2023' },
    { service: 'Écart prix services DOM/métropole',    territory: 'GP', price: 18.0, unit: '%', category: 'Observatoire', source: 'IEDOM — Rapport annuel 2023' },
    { service: 'Écart prix énergie DOM/métropole',     territory: 'GP', price: 25.0, unit: '%', category: 'Observatoire', source: 'IEDOM — Rapport annuel 2023' },
    { service: 'Écart prix général DOM/métropole',     territory: 'GP', price: 22.0, unit: '%', category: 'Observatoire', source: 'IEDOM — Rapport annuel 2023' },
    // Martinique
    { service: 'Écart prix alimentaire DOM/métropole', territory: 'MQ', price: 31.5, unit: '%', category: 'Observatoire', source: 'IEDOM — Rapport annuel 2023' },
    { service: 'Écart prix services DOM/métropole',    territory: 'MQ', price: 17.0, unit: '%', category: 'Observatoire', source: 'IEDOM — Rapport annuel 2023' },
    { service: 'Écart prix énergie DOM/métropole',     territory: 'MQ', price: 24.5, unit: '%', category: 'Observatoire', source: 'IEDOM — Rapport annuel 2023' },
    { service: 'Écart prix général DOM/métropole',     territory: 'MQ', price: 21.5, unit: '%', category: 'Observatoire', source: 'IEDOM — Rapport annuel 2023' },
    // La Réunion
    { service: 'Écart prix alimentaire DOM/métropole', territory: 'RE', price: 28.0, unit: '%', category: 'Observatoire', source: 'IEDOM — Rapport annuel 2023' },
    { service: 'Écart prix services DOM/métropole',    territory: 'RE', price: 15.0, unit: '%', category: 'Observatoire', source: 'IEDOM — Rapport annuel 2023' },
    { service: 'Écart prix énergie DOM/métropole',     territory: 'RE', price: 22.0, unit: '%', category: 'Observatoire', source: 'IEDOM — Rapport annuel 2023' },
    { service: 'Écart prix général DOM/métropole',     territory: 'RE', price: 19.0, unit: '%', category: 'Observatoire', source: 'IEDOM — Rapport annuel 2023' },
    // Guyane
    { service: 'Écart prix alimentaire DOM/métropole', territory: 'GF', price: 38.0, unit: '%', category: 'Observatoire', source: 'IEDOM — Rapport annuel 2023' },
    { service: 'Écart prix services DOM/métropole',    territory: 'GF', price: 20.0, unit: '%', category: 'Observatoire', source: 'IEDOM — Rapport annuel 2023' },
    { service: 'Écart prix énergie DOM/métropole',     territory: 'GF', price: 28.0, unit: '%', category: 'Observatoire', source: 'IEDOM — Rapport annuel 2023' },
    { service: 'Écart prix général DOM/métropole',     territory: 'GF', price: 26.0, unit: '%', category: 'Observatoire', source: 'IEDOM — Rapport annuel 2023' },
    // Mayotte
    { service: 'Écart prix alimentaire DOM/métropole', territory: 'YT', price: 44.0, unit: '%', category: 'Observatoire', source: 'IEDOM — Rapport annuel 2023' },
    { service: 'Écart prix services DOM/métropole',    territory: 'YT', price: 22.0, unit: '%', category: 'Observatoire', source: 'IEDOM — Rapport annuel 2023' },
    { service: 'Écart prix énergie DOM/métropole',     territory: 'YT', price: 15.0, unit: '%', category: 'Observatoire', source: 'IEDOM — Rapport annuel 2023' },
    { service: 'Écart prix général DOM/métropole',     territory: 'YT', price: 30.0, unit: '%', category: 'Observatoire', source: 'IEDOM — Rapport annuel 2023' },
  ];

  return IEDOM_REFERENCE.map((e) => ({ ...e, period, sourceUrl: 'https://www.iedom.fr' }));
}

/**
 * Tarifs de référence des transports en commun DOM-TOM 2025.
 *
 * Sources :
 *   - CTM  Martinique : Compagnie de Transport de Martinique — tarifs officiels
 *   - SGTM Guadeloupe : Société Guadeloupéenne de Transports Multimodaux
 *   - GTFS DOM        : transport.data.gouv.fr (GTFS si disponible)
 *   - TAN  La Réunion : Trans'Ecobus / CITALIS / CAR JAUNE
 *   - STGM Guyane     : Société des Transports de Guyane Maritime
 *
 * Licence : tarifs réglementés publiés par les AOT (Autorités Organisatrices
 *   de Transport) — données publiques.
 */
const TRANSPORT_REFERENCE = [
  // ── Martinique — CTM ──────────────────────────────────────────────────────
  { service: 'Bus urbain — ticket unitaire (CTM)', territory: 'MQ', price: 1.30, unit: '€/trajet', category: 'Transport', source: 'CTM Martinique — tarifs 2025' },
  { service: 'Bus urbain — carnet 10 trajets (CTM)', territory: 'MQ', price: 11.00, unit: '€/carnet ×10', category: 'Transport', source: 'CTM Martinique — tarifs 2025' },
  { service: 'Taxi — prise en charge (CTM)', territory: 'MQ', price: 2.50, unit: '€', category: 'Transport', source: 'CTM Martinique — tarifs 2025' },
  // ── Guadeloupe — SGTM/Karu'lis ───────────────────────────────────────────
  { service: 'Bus urbain — ticket unitaire (Karu\'lis)', territory: 'GP', price: 1.20, unit: '€/trajet', category: 'Transport', source: 'Karu\'lis Guadeloupe — tarifs 2025' },
  { service: 'Bus urbain — carnet 10 trajets (Karu\'lis)', territory: 'GP', price: 10.00, unit: '€/carnet ×10', category: 'Transport', source: 'Karu\'lis Guadeloupe — tarifs 2025' },
  // ── La Réunion — Car Jaune / Citalis ─────────────────────────────────────
  { service: 'Bus interurbain — ticket unitaire (Car Jaune)', territory: 'RE', price: 2.00, unit: '€/trajet', category: 'Transport', source: 'Car Jaune La Réunion — tarifs 2025' },
  { service: 'Bus urbain — ticket unitaire (Citalis)', territory: 'RE', price: 1.50, unit: '€/trajet', category: 'Transport', source: 'Citalis La Réunion — tarifs 2025' },
  // ── Guyane ────────────────────────────────────────────────────────────────
  { service: 'Bus urbain — ticket unitaire (TACA)', territory: 'GF', price: 1.50, unit: '€/trajet', category: 'Transport', source: 'TACA Guyane — tarifs 2025' },
  // ── Mayotte ───────────────────────────────────────────────────────────────
  { service: 'Bus urbain — ticket unitaire (Karib\'Oé)', territory: 'YT', price: 1.00, unit: '€/trajet', category: 'Transport', source: 'Karib\'Oé Mayotte — tarifs 2025' },
  { service: 'Barge inter-îles Petite Terre / Grande Terre', territory: 'YT', price: 1.00, unit: '€/trajet', category: 'Transport', source: 'Barge Mayotte — tarifs 2025' },
];

/**
 * Tente de récupérer les tarifs de transport depuis data.gouv.fr (GTFS DOM).
 * En cas d'absence de données structurées, retourne les tarifs de référence.
 */
async function fetchTransportTariffs() {
  /** @type {ServiceEntry[]} */
  const liveEntries = [];

  const data = await fetchJSON(
    'https://www.data.gouv.fr/api/1/datasets/?q=gtfs+transport+dom+tarifs&page_size=5',
    'GTFS DOM datasets',
  );

  if (data?.data?.length) {
    for (const ds of data.data.slice(0, 2)) {
      const csvRes = (ds.resources ?? []).find((r) =>
        ['csv', 'json'].includes((r.format ?? '').toLowerCase()),
      );
      if (!csvRes) continue;

      const content = await fetchText(csvRes.url, 'GTFS/tarifs CSV');
      if (!content) continue;

      const lines = content.split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) continue;
      const sep  = lines[0].includes(';') ? ';' : ',';
      const cols = lines[0].split(sep).map((c) => c.toLowerCase().trim().replace(/"/g, ''));
      const priceIdx = cols.findIndex((c) => /prix|fare|tarif/i.test(c));
      const nameIdx  = cols.findIndex((c) => /service|offre|ligne|route/i.test(c));
      if (priceIdx < 0 || nameIdx < 0) continue;

      const period = new Date().toISOString().slice(0, 7);
      for (const line of lines.slice(1, 30)) {
        const cells = line.split(sep).map((c) => c.trim().replace(/"/g, ''));
        const price = parseFloat((cells[priceIdx] ?? '0').replace(',', '.'));
        const name  = cells[nameIdx] ?? '';
        if (!name || price <= 0 || price > MAX_REASONABLE_TRANSPORT_PRICE) continue;
        liveEntries.push({
          service: name,
          category: 'Transport',
          territory: 'GP',
          price: Math.round(price * 100) / 100,
          unit: '€/trajet',
          period,
          source: 'data.gouv.fr — GTFS DOM',
          sourceUrl: csvRes.url,
        });
      }
      if (liveEntries.length > 0) break;
    }
  }

  const period = new Date().toISOString().slice(0, 7);
  const liveTerritories = new Set(liveEntries.map((e) => e.territory));
  const refEntries = TRANSPORT_REFERENCE
    .filter((e) => !liveTerritories.has(e.territory))
    .map((e) => ({ ...e, period, sourceUrl: 'https://www.data.gouv.fr' }));

  return [...liveEntries, ...refEntries];
}

/**
 * Main services scraper.
 * @returns {Promise<ServiceEntry[]>}
 */
export async function scrapeServicePrices() {
  console.log('  📡 [services] Scraping données services DOM-TOM…');

  const [telecom, energy, water, cpi, transport, iedom] = await Promise.all([
    fetchTelecomPrices(),
    fetchEnergyPrices(),
    fetchWaterTariffs(),
    fetchINSEECPI(),
    fetchTransportTariffs(),
    fetchIEDOMData(),
  ]);

  const all = [...telecom, ...energy, ...water, ...cpi, ...transport, ...iedom];
  console.log(
    `  📊 [services] ${all.length} entrées services collectées` +
    ` (télécom: ${telecom.length}, énergie: ${energy.length}, eau: ${water.length}, IPC: ${cpi.length}, transport: ${transport.length}, IEDOM: ${iedom.length})`,
  );
  return all;
}
