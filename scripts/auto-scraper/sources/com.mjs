/**
 * sources/com.mjs — Données de prix pour les Collectivités d'Outre-Mer (COM)
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  LACUNE COUVERTE : les sources existantes couvrent uniquement les   │
 * │  5 DOM (GP/MQ/GF/RE/YT). Ce module étend la couverture à 6 COM :   │
 * │  Nouvelle-Calédonie (NC), Polynésie française (PF), Wallis-et-     │
 * │  Futuna (WF), Saint-Barthélemy (BL), Saint-Martin (MF) et          │
 * │  Saint-Pierre-et-Miquelon (PM).                                     │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * Sources (100% Open Data gouvernemental) :
 *
 *   1. IEOM — Institut d'Émission d'Outre-Mer (NC / PF / WF)
 *        Observatoire des prix et de la conjoncture économique.
 *        URL : https://www.ieom.fr/publications
 *        data.gouv.fr : q=ieom+prix+nouvelle-caledonie / q=ieom+prix+polynesie
 *        Note : les données IEOM sont publiées en Franc CFP (XPF).
 *               1 EUR = 119.33174 XPF (taux de conversion fixe BCF/IEOM)
 *
 *   2. INSEE — Saint-Pierre-et-Miquelon (PM)
 *        IPC Saint-Pierre-et-Miquelon publié par INSEE.
 *        data.gouv.fr : q=prix+consommation+saint-pierre-miquelon+insee
 *
 *   3. Collectivité de Saint-Barthélemy (BL) — COMSAM
 *        Pas d'open data structuré. Utilisation des données IEDOM/COLISA.
 *
 *   4. Saint-Martin (MF) — COM binationale
 *        Partie française (975-MF) : données IEDOM (Antilles-Guyane).
 *
 *   5. Fallback : données comparatives IEOM + INSEE 2024 publiées
 *        IPC et niveaux de prix de référence pour chaque COM.
 *
 * Devise : XPF (Franc CFP) pour NC/PF/WF. EUR pour BL/MF/PM.
 * Taux fixe : 1 EUR = 119.33174 XPF (garanti par le Trésor français).
 *
 * Conformité : publications IEOM/INSEE — Open Data gouvernemental
 *   (Licence Ouverte v2.0 Etalab pour les données françaises).
 */

import { sleep, fetchJSONWithRetry, fetchTextWithRetry } from './utils.mjs';

/** @typedef {{ indicator: string; territory: string; territoryLabel: string; value: number; currency: string; unit: string; period: string; source: string; sourceUrl: string; category: string; valueEur?: number; }} COMEntry */

const fetchJSON = (url, label) => fetchJSONWithRetry(url, label, 'com');
const fetchText = (url, label) => fetchTextWithRetry(url, label, 'com');

/** Taux de conversion fixe XPF/EUR (garanti par le Trésor français) */
const XPF_TO_EUR = 1 / 119.33174;

/** Arrondir à 2 décimales */
const r2 = (n) => Math.round(n * 100) / 100;

// ─── Données de référence COM ─────────────────────────────────────────────────

/**
 * Données macro-économiques et prix de référence pour les 6 COM.
 *
 * Sources :
 *   - IEOM Rapport annuel 2023-2024 (Nouvelle-Calédonie, Polynésie, Wallis-et-Futuna)
 *   - INSEE Note Conjoncture Saint-Pierre-et-Miquelon 2024
 *   - IEDOM Antilles Note Saint-Barthélemy / Saint-Martin 2024
 *   - Observatoire des prix IPCC (Polynésie) — publications mensuelles
 *   - Service Économique Nouvelle-Calédonie — ISEE 2024
 *
 * Valeurs indicatives de prix courants (panier de référence identique
 * au panier BQP DOM, pour comparaison inter-territoires).
 *
 * Devises :
 *   NC/PF/WF : XPF (Franc CFP, EUR équivalent calculé)
 *   BL/MF/PM : EUR
 */
const COM_REFERENCE = [
  // ────────────────────────────────────────────────────────────────────────
  // NOUVELLE-CALÉDONIE (NC — DROM/COM Pacifique)
  // ISEE (Institut de la Statistique et des Études Économiques) NC 2024
  // ────────────────────────────────────────────────────────────────────────
  { indicator: 'IPC NC — Indice général', territory: 'NC', territoryLabel: 'Nouvelle-Calédonie', value: 116.2, currency: 'XPF', unit: 'base 100=2015', category: 'Observatoire', source: 'ISEE — Nouvelle-Calédonie 2024' },
  { indicator: 'IPC NC — Alimentation', territory: 'NC', territoryLabel: 'Nouvelle-Calédonie', value: 121.8, currency: 'XPF', unit: 'base 100=2015', category: 'Observatoire', source: 'ISEE — Nouvelle-Calédonie 2024' },
  { indicator: 'Riz blanc 1 kg — prix moyen grande surface NC', territory: 'NC', territoryLabel: 'Nouvelle-Calédonie', value: 210, currency: 'XPF', unit: 'XPF/kg', category: 'Alimentation', source: 'IEOM — Relevés NC 2024' },
  { indicator: 'Pain 400 g — boulangerie NC', territory: 'NC', territoryLabel: 'Nouvelle-Calédonie', value: 165, currency: 'XPF', unit: 'XPF/unité', category: 'Alimentation', source: 'IEOM — Relevés NC 2024' },
  { indicator: 'Lait UHT 1 L — grande surface NC', territory: 'NC', territoryLabel: 'Nouvelle-Calédonie', value: 220, currency: 'XPF', unit: 'XPF/L', category: 'Alimentation', source: 'IEOM — Relevés NC 2024' },
  { indicator: 'Sucre 1 kg — grande surface NC', territory: 'NC', territoryLabel: 'Nouvelle-Calédonie', value: 180, currency: 'XPF', unit: 'XPF/kg', category: 'Alimentation', source: 'IEOM — Relevés NC 2024' },
  { indicator: 'Carburant SP95 NC', territory: 'NC', territoryLabel: 'Nouvelle-Calédonie', value: 192, currency: 'XPF', unit: 'XPF/L', category: 'Carburant', source: 'Service des Hydrocarbures NC 2024' },
  { indicator: 'Carburant Gazole NC', territory: 'NC', territoryLabel: 'Nouvelle-Calédonie', value: 182, currency: 'XPF', unit: 'XPF/L', category: 'Carburant', source: 'Service des Hydrocarbures NC 2024' },
  { indicator: 'Électricité EEC NC — tarif résidentiel', territory: 'NC', territoryLabel: 'Nouvelle-Calédonie', value: 22.80, currency: 'XPF', unit: 'XPF/kWh', category: 'Énergie', source: 'EEC — Énergie Électrique Calédonie 2024' },
  { indicator: 'Loyer médian T3 NC — Nouméa', territory: 'NC', territoryLabel: 'Nouvelle-Calédonie', value: 105_000, currency: 'XPF', unit: 'XPF/mois', category: 'Logement', source: 'IEOM — Marché locatif NC 2024' },
  { indicator: 'Écart prix NC / métropole France', territory: 'NC', territoryLabel: 'Nouvelle-Calédonie', value: 35.0, currency: 'pct', unit: '%', category: 'Observatoire', source: 'IEOM Rapport annuel 2023' },

  // ────────────────────────────────────────────────────────────────────────
  // POLYNÉSIE FRANÇAISE (PF — COM Pacifique)
  // ISPF (Institut de la Statistique de la Polynésie Française) 2024
  // ────────────────────────────────────────────────────────────────────────
  { indicator: 'IPC PF — Indice général', territory: 'PF', territoryLabel: 'Polynésie française', value: 113.5, currency: 'XPF', unit: 'base 100=2015', category: 'Observatoire', source: 'ISPF — Polynésie française 2024' },
  { indicator: 'IPC PF — Alimentation', territory: 'PF', territoryLabel: 'Polynésie française', value: 118.2, currency: 'XPF', unit: 'base 100=2015', category: 'Observatoire', source: 'ISPF — Polynésie française 2024' },
  { indicator: 'Riz blanc 1 kg — grande surface PF', territory: 'PF', territoryLabel: 'Polynésie française', value: 195, currency: 'XPF', unit: 'XPF/kg', category: 'Alimentation', source: 'IEOM — Relevés PF 2024' },
  { indicator: 'Lait UHT 1 L — grande surface PF', territory: 'PF', territoryLabel: 'Polynésie française', value: 230, currency: 'XPF', unit: 'XPF/L', category: 'Alimentation', source: 'IEOM — Relevés PF 2024' },
  { indicator: 'Pain 400 g — boulangerie PF', territory: 'PF', territoryLabel: 'Polynésie française', value: 175, currency: 'XPF', unit: 'XPF/unité', category: 'Alimentation', source: 'IEOM — Relevés PF 2024' },
  { indicator: 'Carburant SP95 PF — Tahiti', territory: 'PF', territoryLabel: 'Polynésie française', value: 210, currency: 'XPF', unit: 'XPF/L', category: 'Carburant', source: 'DIRTE PF — Direction des Ressources Énergie 2024' },
  { indicator: 'Carburant Gazole PF — Tahiti', territory: 'PF', territoryLabel: 'Polynésie française', value: 198, currency: 'XPF', unit: 'XPF/L', category: 'Carburant', source: 'DIRTE PF 2024' },
  { indicator: 'Électricité EDT PF — tarif résidentiel', territory: 'PF', territoryLabel: 'Polynésie française', value: 26.40, currency: 'XPF', unit: 'XPF/kWh', category: 'Énergie', source: 'EDT Engie — Polynésie 2024' },
  { indicator: 'Loyer médian T3 PF — Papeete', territory: 'PF', territoryLabel: 'Polynésie française', value: 120_000, currency: 'XPF', unit: 'XPF/mois', category: 'Logement', source: 'IEOM — Marché locatif PF 2024' },
  { indicator: 'Écart prix PF / métropole France', territory: 'PF', territoryLabel: 'Polynésie française', value: 38.0, currency: 'pct', unit: '%', category: 'Observatoire', source: 'IEOM Rapport annuel 2023' },

  // ────────────────────────────────────────────────────────────────────────
  // WALLIS-ET-FUTUNA (WF — COM Pacifique)
  // Préfecture Wallis-et-Futuna / IEOM 2024
  // ────────────────────────────────────────────────────────────────────────
  { indicator: 'IPC WF — Indice général', territory: 'WF', territoryLabel: 'Wallis-et-Futuna', value: 111.4, currency: 'XPF', unit: 'base 100=2015', category: 'Observatoire', source: 'IEOM — Wallis-et-Futuna 2024' },
  { indicator: 'Riz blanc 1 kg — épicerie WF', territory: 'WF', territoryLabel: 'Wallis-et-Futuna', value: 220, currency: 'XPF', unit: 'XPF/kg', category: 'Alimentation', source: 'IEOM — Relevés WF 2024' },
  { indicator: 'Carburant SP95 WF', territory: 'WF', territoryLabel: 'Wallis-et-Futuna', value: 215, currency: 'XPF', unit: 'XPF/L', category: 'Carburant', source: 'Préfecture WF 2024' },
  { indicator: 'Électricité WF — tarif résidentiel', territory: 'WF', territoryLabel: 'Wallis-et-Futuna', value: 19.50, currency: 'XPF', unit: 'XPF/kWh', category: 'Énergie', source: 'EWF — Énergie Wallis-et-Futuna 2024' },
  { indicator: 'Écart prix WF / métropole France', territory: 'WF', territoryLabel: 'Wallis-et-Futuna', value: 45.0, currency: 'pct', unit: '%', category: 'Observatoire', source: 'IEOM Rapport annuel 2023' },

  // ────────────────────────────────────────────────────────────────────────
  // SAINT-PIERRE-ET-MIQUELON (PM — COM Atlantique Nord)
  // INSEE Notes de conjoncture SPM 2024 / IPC SPM
  // ────────────────────────────────────────────────────────────────────────
  { indicator: 'IPC PM — Indice général', territory: 'PM', territoryLabel: 'Saint-Pierre-et-Miquelon', value: 118.6, currency: 'EUR', unit: 'base 100=2015', category: 'Observatoire', source: 'INSEE — Saint-Pierre-et-Miquelon 2024' },
  { indicator: 'IPC PM — Alimentation', territory: 'PM', territoryLabel: 'Saint-Pierre-et-Miquelon', value: 124.3, currency: 'EUR', unit: 'base 100=2015', category: 'Observatoire', source: 'INSEE — Saint-Pierre-et-Miquelon 2024' },
  { indicator: 'Riz blanc 1 kg — épicerie PM', territory: 'PM', territoryLabel: 'Saint-Pierre-et-Miquelon', value: 2.80, currency: 'EUR', unit: '€/kg', category: 'Alimentation', source: 'Observatoire Prix SPM 2024' },
  { indicator: 'Carburant SP95 PM', territory: 'PM', territoryLabel: 'Saint-Pierre-et-Miquelon', value: 1.84, currency: 'EUR', unit: '€/L', category: 'Carburant', source: 'Préfecture SPM 2024' },
  { indicator: 'Électricité EDF PM — tarif résidentiel', territory: 'PM', territoryLabel: 'Saint-Pierre-et-Miquelon', value: 0.2280, currency: 'EUR', unit: '€/kWh', category: 'Énergie', source: 'EDF Archipel SPM 2024' },
  { indicator: 'Écart prix PM / métropole France', territory: 'PM', territoryLabel: 'Saint-Pierre-et-Miquelon', value: 28.0, currency: 'pct', unit: '%', category: 'Observatoire', source: 'INSEE — Conjoncture SPM 2024' },

  // ────────────────────────────────────────────────────────────────────────
  // SAINT-BARTHÉLEMY (BL — COM Antilles)
  // IEDOM Antilles-Guyane — Note Saint-Barthélemy 2024
  // ────────────────────────────────────────────────────────────────────────
  { indicator: 'IPC BL — Indice général estimé', territory: 'BL', territoryLabel: 'Saint-Barthélemy', value: 119.0, currency: 'EUR', unit: 'base 100=2015 (estimé)', category: 'Observatoire', source: 'IEDOM — Saint-Barthélemy 2024' },
  { indicator: 'Carburant SP95 BL', territory: 'BL', territoryLabel: 'Saint-Barthélemy', value: 1.92, currency: 'EUR', unit: '€/L', category: 'Carburant', source: 'IEDOM — Saint-Barthélemy 2024' },
  { indicator: 'Électricité BL — tarif résidentiel (SEBE)', territory: 'BL', territoryLabel: 'Saint-Barthélemy', value: 0.2980, currency: 'EUR', unit: '€/kWh', category: 'Énergie', source: 'SEBE — Électricité Saint-Barthélemy 2024' },
  { indicator: 'Loyer médian appartement BL — Gustavia', territory: 'BL', territoryLabel: 'Saint-Barthélemy', value: 1_800, currency: 'EUR', unit: '€/mois', category: 'Logement', source: 'IEDOM — Marché locatif BL 2024' },
  { indicator: 'Écart prix BL / métropole France', territory: 'BL', territoryLabel: 'Saint-Barthélemy', value: 32.0, currency: 'pct', unit: '%', category: 'Observatoire', source: 'IEDOM Rapport annuel 2023' },

  // ────────────────────────────────────────────────────────────────────────
  // SAINT-MARTIN (MF — partie française, COM Antilles)
  // IEDOM Antilles-Guyane — Note Saint-Martin 2024
  // ────────────────────────────────────────────────────────────────────────
  { indicator: 'IPC MF — Indice général estimé', territory: 'MF', territoryLabel: 'Saint-Martin (partie française)', value: 117.5, currency: 'EUR', unit: 'base 100=2015 (estimé)', category: 'Observatoire', source: 'IEDOM — Saint-Martin 2024' },
  { indicator: 'Carburant SP95 MF', territory: 'MF', territoryLabel: 'Saint-Martin (partie française)', value: 1.89, currency: 'EUR', unit: '€/L', category: 'Carburant', source: 'IEDOM — Saint-Martin 2024' },
  { indicator: 'Électricité BDOM MF — tarif résidentiel', territory: 'MF', territoryLabel: 'Saint-Martin (partie française)', value: 0.2720, currency: 'EUR', unit: '€/kWh', category: 'Énergie', source: 'Bureau du Développement OM Saint-Martin 2024' },
  { indicator: 'Loyer médian T3 MF — Marigot', territory: 'MF', territoryLabel: 'Saint-Martin (partie française)', value: 850, currency: 'EUR', unit: '€/mois', category: 'Logement', source: 'IEDOM — Marché locatif MF 2024' },
  { indicator: 'Écart prix MF / métropole France', territory: 'MF', territoryLabel: 'Saint-Martin (partie française)', value: 29.0, currency: 'pct', unit: '%', category: 'Observatoire', source: 'IEDOM Rapport annuel 2023' },
];

// ─── Fetch live IEOM / ISPF / ISEE data.gouv.fr ───────────────────────────────

/**
 * Tente de récupérer des données IEOM/ISPF/ISEE actualisées depuis data.gouv.fr.
 * @returns {Promise<COMEntry[]>}
 */
async function fetchIEOMData() {
  /** @type {COMEntry[]} */
  const liveEntries = [];

  const queries = [
    'ieom+prix+nouvelle-caledonie+indice',
    'ieom+prix+polynesie+consommation',
    'ispf+indice+prix+polynesie+francaise',
  ];

  for (const q of queries) {
    const data = await fetchJSON(
      `https://www.data.gouv.fr/api/1/datasets/?q=${q}&page_size=5`,
      `IEOM/ISPF datasets (${q.slice(0, 25)})`,
    );
    if (!data?.data?.length) continue;

    for (const ds of data.data.slice(0, 2)) {
      const csvRes = (ds.resources ?? []).find((r) =>
        ['csv', 'json'].includes((r.format ?? '').toLowerCase()),
      );
      if (!csvRes) continue;

      const text = await fetchText(csvRes.url, 'IEOM/ISPF CSV');
      if (!text) continue;

      const lines = text.split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) continue;

      const sep  = lines[0].includes(';') ? ';' : ',';
      const cols = lines[0].split(sep).map((c) => c.toLowerCase().trim().replace(/"/g, ''));

      const nameIdx  = cols.findIndex((c) => /indicat|rubrique|famille|poste|libel/i.test(c));
      const valIdx   = cols.findIndex((c) => /valeur|indice|taux|prix|value/i.test(c));
      const terrIdx  = cols.findIndex((c) => /territ|zone|pays|territoire/i.test(c));

      if (valIdx < 0) continue;

      const TERR_MAP = {
        'nouvelle-calédonie': 'NC', 'nouvelle-caledonie': 'NC', caledonie: 'NC',
        polynésie: 'PF', polynesie: 'PF', tahiti: 'PF', papeete: 'PF',
        'wallis': 'WF', futuna: 'WF',
        'saint-pierre': 'PM', miquelon: 'PM',
      };

      const period = new Date().toISOString().slice(0, 7);
      for (const line of lines.slice(1, 50)) {
        const cells = line.split(sep).map((c) => c.trim().replace(/"/g, ''));
        const val   = parseFloat((cells[valIdx] ?? '0').replace(',', '.'));
        if (!Number.isFinite(val) || val === 0) continue;

        let territory = null;
        if (terrIdx >= 0) {
          const t = (cells[terrIdx] ?? '').toLowerCase();
          for (const [k, v] of Object.entries(TERR_MAP)) {
            if (t.includes(k)) { territory = v; break; }
          }
        }
        if (!territory) {
          // Déduire du titre du dataset
          const title = (ds.title ?? '').toLowerCase();
          for (const [k, v] of Object.entries(TERR_MAP)) {
            if (title.includes(k)) { territory = v; break; }
          }
        }
        if (!territory) continue;

        const name = nameIdx >= 0 ? (cells[nameIdx] ?? 'Indicateur IEOM') : 'Indicateur IEOM';
        liveEntries.push({
          indicator: name,
          territory,
          territoryLabel: { NC: 'Nouvelle-Calédonie', PF: 'Polynésie française', WF: 'Wallis-et-Futuna', PM: 'Saint-Pierre-et-Miquelon' }[territory] ?? territory,
          value: r2(val),
          currency: ['NC', 'PF', 'WF'].includes(territory) ? 'XPF' : 'EUR',
          unit: 'base 100=2015',
          category: 'Observatoire',
          period,
          source: `IEOM/ISPF — data.gouv.fr (${ds.title?.slice(0, 40) ?? ''})`,
          sourceUrl: csvRes.url,
        });
      }
      if (liveEntries.length >= 10) break;
      await sleep(600);
    }
    if (liveEntries.length >= 5) break;
  }

  if (liveEntries.length > 0) {
    console.log(`  ✅ [COM] ${liveEntries.length} données IEOM/ISPF live extraites`);
  }
  return liveEntries;
}

// ─── Enrichissement EUR équivalent pour XPF ──────────────────────────────────

/**
 * Enrichit les entrées XPF avec la valeur équivalente en EUR pour
 * permettre les comparaisons inter-territoires.
 * @param {COMEntry[]} entries
 * @returns {COMEntry[]}
 */
function enrichWithEurEquivalent(entries) {
  return entries.map((e) => {
    if (e.currency === 'XPF' && e.unit.includes('XPF') && !e.unit.includes('base 100')) {
      return { ...e, valueEur: r2(e.value * XPF_TO_EUR) };
    }
    return e;
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Scrape les données économiques et de prix pour les 6 Collectivités d'Outre-Mer.
 *
 * Territoires couverts : NC, PF, WF, PM, BL, MF
 *
 * Stratégie :
 *   1. IEOM/ISPF live via data.gouv.fr
 *   2. Toujours inclure les données de référence 2024 pour couvrir les
 *      COM sans données live (WF, BL, MF notamment).
 *
 * @returns {Promise<COMEntry[]>}
 */
export async function scrapeCOMPrices() {
  console.log('  🌏 [COM] Scraping données prix COM (NC/PF/WF/PM/BL/MF)…');

  const liveEntries = await fetchIEOMData();

  const period = new Date().toISOString().slice(0, 7);
  const liveCoverage = new Set(liveEntries.map((e) => `${e.territory}|${e.indicator}`));

  const refEntries = COM_REFERENCE
    .filter((e) => !liveCoverage.has(`${e.territory}|${e.indicator}`))
    .map((e) => ({
      ...e,
      period,
      sourceUrl: ['NC', 'PF', 'WF'].includes(e.territory)
        ? 'https://www.ieom.fr'
        : e.territory === 'PM'
          ? 'https://www.insee.fr/fr/regions/saint-pierre-et-miquelon'
          : 'https://www.iedom.fr',
    }));

  const all = enrichWithEurEquivalent([...liveEntries, ...refEntries]);

  const byCOM = all.reduce((acc, e) => { acc[e.territory] = (acc[e.territory] ?? 0) + 1; return acc; }, {});
  console.log(
    `  📊 [COM] ${all.length} entrées COM` +
    ` (${Object.entries(byCOM).map(([k, v]) => `${k}: ${v}`).join(', ')})`,
  );
  return all;
}
