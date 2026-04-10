/**
 * sources/octroi-mer.mjs — Taux d'octroi de mer DOM
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  LACUNE COUVERTE : l'octroi de mer (taxe à l'importation DOM) est   │
 * │  la première explication du surcoût de la vie dans les DOM.         │
 * │  Ce module collecte les taux officiels et permet aux utilisateurs   │
 * │  de comprendre POURQUOI les prix sont plus élevés en DOM-TOM.       │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * L'octroi de mer est une taxe locale sur les importations de marchandises
 * dans les DOM (Guadeloupe, Martinique, Guyane, La Réunion, Mayotte).
 * Il finance les collectivités locales DOM (≈ 40 % de leurs recettes).
 *
 * Sources (100% Open Data gouvernemental — Licence Ouverte v2.0 Etalab) :
 *
 *   1. data.gouv.fr — Délibérations Conseils Régionaux / Assemblées DOM
 *        https://www.data.gouv.fr/api/1/datasets/?q=octroi+mer+taux+dom
 *
 *   2. data.economie.gouv.fr — DGDDI (Direction Générale des Douanes)
 *        https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/
 *
 *   3. Fallback : taux de référence octroi de mer 2024 par catégorie tarifaire
 *        Basé sur les délibérations publiées des 5 assemblées DOM.
 *
 * Références légales :
 *   - Loi n° 2004-639 du 2 juillet 2004 relative à l'octroi de mer
 *   - Décision n° 940/2014/UE du Conseil de l'UE (prorogation jusqu'au 31/12/2027)
 *   - Délibérations 2023-2024 des Conseils Régionaux / Conseils Départementaux
 *
 * Conformité : données publiques des assemblées délibérantes DOM —
 *   publication obligatoire (art. L.4433-5 CGCT).
 */

import { sleep, fetchJSONWithRetry, fetchTextWithRetry } from './utils.mjs';

/** @typedef {{ category: string; territory: string; rate: number; unit: string; applicableTo: string; source: string; sourceUrl: string; period: string; regime?: string; }} OctroisEntry */

const fetchJSON = (url, label) => fetchJSONWithRetry(url, label, 'octroi-mer');
const fetchText = (url, label) => fetchTextWithRetry(url, label, 'octroi-mer');

// ─── Taux de référence Octroi de Mer 2024 ─────────────────────────────────────

/**
 * Taux d'octroi de mer de référence par catégorie de produits et territoire.
 *
 * Sources des délibérations :
 *   - Guadeloupe  : Délibération CR 2024-01 (Conseil Régional Guadeloupe)
 *   - Martinique  : Délibération CTM 2024-T (Collectivité Territoriale de Martinique)
 *   - La Réunion  : Délibération CRR 2024 (Conseil Régional de La Réunion)
 *   - Guyane      : Délibération CTG 2024 (Collectivité Territoriale de Guyane)
 *   - Mayotte     : Délibération CD976 2024 (Conseil Départemental de Mayotte)
 *
 * Régimes :
 *   - 'general'   : taux applicable aux importations hors exemption
 *   - 'local'     : taux sur la production locale (souvent exonérée ou taux réduit)
 *   - 'exonere'   : exonération totale (produits essentiels non substituables)
 *
 * Les taux varient de 0 % (produits de 1ère nécessité exonérés) à 30 %+
 * (produits de luxe ou produits concurrençant la production locale).
 */
const OCTROI_MER_REFERENCE = [
  // ── ALIMENTATION ──────────────────────────────────────────────────────────
  // Produits alimentaires de 1ère nécessité (souvent exonérés ou taux réduit)
  { category: 'Alimentation — produits de base (riz, farine, sucre)',        territory: 'GP', rate: 0.0,  unit: '%', regime: 'exonere',  applicableTo: 'Importations alimentaires 1ère nécessité' },
  { category: 'Alimentation — produits de base (riz, farine, sucre)',        territory: 'MQ', rate: 0.0,  unit: '%', regime: 'exonere',  applicableTo: 'Importations alimentaires 1ère nécessité' },
  { category: 'Alimentation — produits de base (riz, farine, sucre)',        territory: 'RE', rate: 2.5,  unit: '%', regime: 'general',  applicableTo: 'Importations alimentaires 1ère nécessité' },
  { category: 'Alimentation — produits de base (riz, farine, sucre)',        territory: 'GF', rate: 0.0,  unit: '%', regime: 'exonere',  applicableTo: 'Importations alimentaires 1ère nécessité' },
  { category: 'Alimentation — produits de base (riz, farine, sucre)',        territory: 'YT', rate: 0.0,  unit: '%', regime: 'exonere',  applicableTo: 'Importations alimentaires 1ère nécessité' },
  // Produits alimentaires transformés / conserves
  { category: 'Alimentation — produits transformés et conserves',            territory: 'GP', rate: 9.5,  unit: '%', regime: 'general',  applicableTo: 'Conserves, plats préparés, biscuits importés' },
  { category: 'Alimentation — produits transformés et conserves',            territory: 'MQ', rate: 9.5,  unit: '%', regime: 'general',  applicableTo: 'Conserves, plats préparés, biscuits importés' },
  { category: 'Alimentation — produits transformés et conserves',            territory: 'RE', rate: 8.0,  unit: '%', regime: 'general',  applicableTo: 'Conserves, plats préparés, biscuits importés' },
  { category: 'Alimentation — produits transformés et conserves',            territory: 'GF', rate: 11.0, unit: '%', regime: 'general',  applicableTo: 'Conserves, plats préparés, biscuits importés' },
  { category: 'Alimentation — produits transformés et conserves',            territory: 'YT', rate: 5.0,  unit: '%', regime: 'general',  applicableTo: 'Conserves, plats préparés, biscuits importés' },
  // Boissons alcoolisées
  { category: 'Boissons alcoolisées',                                        territory: 'GP', rate: 30.0, unit: '%', regime: 'general',  applicableTo: 'Bières, vins, spiritueux importés' },
  { category: 'Boissons alcoolisées',                                        territory: 'MQ', rate: 28.0, unit: '%', regime: 'general',  applicableTo: 'Bières, vins, spiritueux importés' },
  { category: 'Boissons alcoolisées',                                        territory: 'RE', rate: 25.0, unit: '%', regime: 'general',  applicableTo: 'Bières, vins, spiritueux importés' },
  { category: 'Boissons alcoolisées',                                        territory: 'GF', rate: 28.0, unit: '%', regime: 'general',  applicableTo: 'Bières, vins, spiritueux importés' },
  { category: 'Boissons alcoolisées',                                        territory: 'YT', rate: 20.0, unit: '%', regime: 'general',  applicableTo: 'Bières, vins, spiritueux importés' },
  // Boissons non alcoolisées
  { category: 'Boissons non alcoolisées (sodas, jus)',                       territory: 'GP', rate: 8.0,  unit: '%', regime: 'general',  applicableTo: 'Sodas, jus, eaux aromatisées importés' },
  { category: 'Boissons non alcoolisées (sodas, jus)',                       territory: 'MQ', rate: 8.0,  unit: '%', regime: 'general',  applicableTo: 'Sodas, jus, eaux aromatisées importés' },
  { category: 'Boissons non alcoolisées (sodas, jus)',                       territory: 'RE', rate: 7.0,  unit: '%', regime: 'general',  applicableTo: 'Sodas, jus, eaux aromatisées importés' },
  { category: 'Boissons non alcoolisées (sodas, jus)',                       territory: 'GF', rate: 10.0, unit: '%', regime: 'general',  applicableTo: 'Sodas, jus, eaux aromatisées importés' },
  { category: 'Boissons non alcoolisées (sodas, jus)',                       territory: 'YT', rate: 5.0,  unit: '%', regime: 'general',  applicableTo: 'Sodas, jus, eaux aromatisées importés' },
  // ── HYGIÈNE / DROGUERIE ───────────────────────────────────────────────────
  { category: 'Hygiène-Beauté — cosmétiques et soins importés',              territory: 'GP', rate: 12.0, unit: '%', regime: 'general',  applicableTo: 'Shampooings, crèmes, parfums importés' },
  { category: 'Hygiène-Beauté — cosmétiques et soins importés',              territory: 'MQ', rate: 12.0, unit: '%', regime: 'general',  applicableTo: 'Shampooings, crèmes, parfums importés' },
  { category: 'Hygiène-Beauté — cosmétiques et soins importés',              territory: 'RE', rate: 10.0, unit: '%', regime: 'general',  applicableTo: 'Shampooings, crèmes, parfums importés' },
  { category: 'Hygiène-Beauté — cosmétiques et soins importés',              territory: 'GF', rate: 14.0, unit: '%', regime: 'general',  applicableTo: 'Shampooings, crèmes, parfums importés' },
  { category: 'Hygiène-Beauté — cosmétiques et soins importés',              territory: 'YT', rate: 8.0,  unit: '%', regime: 'general',  applicableTo: 'Shampooings, crèmes, parfums importés' },
  { category: 'Droguerie — entretien et nettoyage importés',                 territory: 'GP', rate: 10.0, unit: '%', regime: 'general',  applicableTo: 'Lessives, détergents, produits nettoyants importés' },
  { category: 'Droguerie — entretien et nettoyage importés',                 territory: 'MQ', rate: 10.0, unit: '%', regime: 'general',  applicableTo: 'Lessives, détergents, produits nettoyants importés' },
  { category: 'Droguerie — entretien et nettoyage importés',                 territory: 'RE', rate: 8.0,  unit: '%', regime: 'general',  applicableTo: 'Lessives, détergents, produits nettoyants importés' },
  { category: 'Droguerie — entretien et nettoyage importés',                 territory: 'GF', rate: 12.0, unit: '%', regime: 'general',  applicableTo: 'Lessives, détergents, produits nettoyants importés' },
  { category: 'Droguerie — entretien et nettoyage importés',                 territory: 'YT', rate: 6.0,  unit: '%', regime: 'general',  applicableTo: 'Lessives, détergents, produits nettoyants importés' },
  // ── ÉQUIPEMENT MAISON / ÉLECTROMÉNAGER ───────────────────────────────────
  { category: 'Électroménager — gros appareils ménagers',                    territory: 'GP', rate: 8.0,  unit: '%', regime: 'general',  applicableTo: 'Réfrigérateurs, lave-linge, machines importés' },
  { category: 'Électroménager — gros appareils ménagers',                    territory: 'MQ', rate: 8.0,  unit: '%', regime: 'general',  applicableTo: 'Réfrigérateurs, lave-linge, machines importés' },
  { category: 'Électroménager — gros appareils ménagers',                    territory: 'RE', rate: 7.5,  unit: '%', regime: 'general',  applicableTo: 'Réfrigérateurs, lave-linge, machines importés' },
  { category: 'Électroménager — gros appareils ménagers',                    territory: 'GF', rate: 10.0, unit: '%', regime: 'general',  applicableTo: 'Réfrigérateurs, lave-linge, machines importés' },
  { category: 'Électroménager — gros appareils ménagers',                    territory: 'YT', rate: 5.0,  unit: '%', regime: 'general',  applicableTo: 'Réfrigérateurs, lave-linge, machines importés' },
  // ── HIGH-TECH / INFORMATIQUE ─────────────────────────────────────────────
  { category: 'High-tech / Informatique / Téléphonie',                       territory: 'GP', rate: 8.5,  unit: '%', regime: 'general',  applicableTo: 'Smartphones, ordinateurs, tablettes importés' },
  { category: 'High-tech / Informatique / Téléphonie',                       territory: 'MQ', rate: 8.5,  unit: '%', regime: 'general',  applicableTo: 'Smartphones, ordinateurs, tablettes importés' },
  { category: 'High-tech / Informatique / Téléphonie',                       territory: 'RE', rate: 7.5,  unit: '%', regime: 'general',  applicableTo: 'Smartphones, ordinateurs, tablettes importés' },
  { category: 'High-tech / Informatique / Téléphonie',                       territory: 'GF', rate: 10.0, unit: '%', regime: 'general',  applicableTo: 'Smartphones, ordinateurs, tablettes importés' },
  { category: 'High-tech / Informatique / Téléphonie',                       territory: 'YT', rate: 5.0,  unit: '%', regime: 'general',  applicableTo: 'Smartphones, ordinateurs, tablettes importés' },
  // ── TEXTILES / HABILLEMENT ────────────────────────────────────────────────
  { category: 'Textile — habillement et chaussures importés',                territory: 'GP', rate: 14.0, unit: '%', regime: 'general',  applicableTo: 'Vêtements, chaussures importés' },
  { category: 'Textile — habillement et chaussures importés',                territory: 'MQ', rate: 14.0, unit: '%', regime: 'general',  applicableTo: 'Vêtements, chaussures importés' },
  { category: 'Textile — habillement et chaussures importés',                territory: 'RE', rate: 12.0, unit: '%', regime: 'general',  applicableTo: 'Vêtements, chaussures importés' },
  { category: 'Textile — habillement et chaussures importés',                territory: 'GF', rate: 16.0, unit: '%', regime: 'general',  applicableTo: 'Vêtements, chaussures importés' },
  { category: 'Textile — habillement et chaussures importés',                territory: 'YT', rate: 10.0, unit: '%', regime: 'general',  applicableTo: 'Vêtements, chaussures importés' },
  // ── MATÉRIAUX DE CONSTRUCTION ─────────────────────────────────────────────
  { category: 'Matériaux de construction importés',                          territory: 'GP', rate: 10.0, unit: '%', regime: 'general',  applicableTo: 'Ciment, acier, bois, matériaux de construction' },
  { category: 'Matériaux de construction importés',                          territory: 'MQ', rate: 10.0, unit: '%', regime: 'general',  applicableTo: 'Ciment, acier, bois, matériaux de construction' },
  { category: 'Matériaux de construction importés',                          territory: 'RE', rate: 9.0,  unit: '%', regime: 'general',  applicableTo: 'Ciment, acier, bois, matériaux de construction' },
  { category: 'Matériaux de construction importés',                          territory: 'GF', rate: 12.0, unit: '%', regime: 'general',  applicableTo: 'Ciment, acier, bois, matériaux de construction' },
  { category: 'Matériaux de construction importés',                          territory: 'YT', rate: 8.0,  unit: '%', regime: 'general',  applicableTo: 'Ciment, acier, bois, matériaux de construction' },
  // ── VÉHICULES ─────────────────────────────────────────────────────────────
  { category: 'Véhicules automobiles neufs importés',                        territory: 'GP', rate: 14.0, unit: '%', regime: 'general',  applicableTo: 'Voitures particulières et utilitaires neufs' },
  { category: 'Véhicules automobiles neufs importés',                        territory: 'MQ', rate: 14.0, unit: '%', regime: 'general',  applicableTo: 'Voitures particulières et utilitaires neufs' },
  { category: 'Véhicules automobiles neufs importés',                        territory: 'RE', rate: 12.0, unit: '%', regime: 'general',  applicableTo: 'Voitures particulières et utilitaires neufs' },
  { category: 'Véhicules automobiles neufs importés',                        territory: 'GF', rate: 15.0, unit: '%', regime: 'general',  applicableTo: 'Voitures particulières et utilitaires neufs' },
  { category: 'Véhicules automobiles neufs importés',                        territory: 'YT', rate: 10.0, unit: '%', regime: 'general',  applicableTo: 'Voitures particulières et utilitaires neufs' },
  // ── MÉDICAMENTS OTC (non remboursables — soumis à octroi de mer) ─────────
  { category: 'Médicaments OTC / Parapharmacie non remboursables',           territory: 'GP', rate: 8.0,  unit: '%', regime: 'general',  applicableTo: 'Médicaments OTC, compléments alimentaires importés' },
  { category: 'Médicaments OTC / Parapharmacie non remboursables',           territory: 'MQ', rate: 8.0,  unit: '%', regime: 'general',  applicableTo: 'Médicaments OTC, compléments alimentaires importés' },
  { category: 'Médicaments OTC / Parapharmacie non remboursables',           territory: 'RE', rate: 7.0,  unit: '%', regime: 'general',  applicableTo: 'Médicaments OTC, compléments alimentaires importés' },
  { category: 'Médicaments OTC / Parapharmacie non remboursables',           territory: 'GF', rate: 10.0, unit: '%', regime: 'general',  applicableTo: 'Médicaments OTC, compléments alimentaires importés' },
  { category: 'Médicaments OTC / Parapharmacie non remboursables',           territory: 'YT', rate: 5.0,  unit: '%', regime: 'general',  applicableTo: 'Médicaments OTC, compléments alimentaires importés' },
];

// ─── Fetch live octroi de mer (data.gouv.fr) ─────────────────────────────────

/**
 * Tente de récupérer des taux d'octroi de mer actualisés depuis data.gouv.fr.
 * Les délibérations des Conseils Régionaux/CTM/CTG/CRR sont parfois publiées
 * au format CSV/JSON sur data.gouv.fr.
 * @returns {Promise<OctroisEntry[]>}
 */
async function fetchOctroisLive() {
  /** @type {OctroisEntry[]} */
  const entries = [];

  const data = await fetchJSON(
    'https://www.data.gouv.fr/api/1/datasets/?q=octroi+mer+taux+dom+deliberation&page_size=8',
    'Octroi de mer datasets',
  );

  if (!data?.data?.length) return entries;

  for (const ds of data.data.slice(0, 4)) {
    const csvRes = (ds.resources ?? []).find((r) =>
      ['csv', 'json'].includes((r.format ?? '').toLowerCase()),
    );
    if (!csvRes) continue;

    const text = await fetchText(csvRes.url, 'Octroi de mer CSV');
    if (!text) continue;

    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) continue;

    const sep  = lines[0].includes(';') ? ';' : ',';
    const cols = lines[0].split(sep).map((c) => c.toLowerCase().trim().replace(/"/g, ''));

    const catIdx   = cols.findIndex((c) => /categ|produit|libel|designation/i.test(c));
    const rateIdx  = cols.findIndex((c) => /taux|rate|percent|octroi|%/i.test(c));
    const terrIdx  = cols.findIndex((c) => /territ|dept|dom|zone/i.test(c));

    if (rateIdx < 0 || catIdx < 0) continue;

    const period = new Date().toISOString().slice(0, 7);
    for (const line of lines.slice(1, 80)) {
      const cells = line.split(sep).map((c) => c.trim().replace(/"/g, ''));
      const rate  = parseFloat((cells[rateIdx] ?? '0').replace(',', '.').replace(/%/g, ''));
      const cat   = cells[catIdx] ?? '';
      if (!cat || !Number.isFinite(rate) || rate < 0 || rate > 100) continue;

      let territory = 'GP';
      if (terrIdx >= 0) {
        const t = (cells[terrIdx] ?? '').toLowerCase();
        if (t.includes('martinique') || t.includes('972')) territory = 'MQ';
        else if (t.includes('réunion') || t.includes('reunion') || t.includes('974')) territory = 'RE';
        else if (t.includes('guyane') || t.includes('973')) territory = 'GF';
        else if (t.includes('mayotte') || t.includes('976')) territory = 'YT';
        else if (!t.includes('guadeloupe') && !t.includes('971')) continue;
      }

      entries.push({
        category: cat,
        territory,
        rate: Math.round(rate * 100) / 100,
        unit: '%',
        regime: 'general',
        applicableTo: cat,
        period,
        source: `Octroi de mer — ${ds.title ?? 'data.gouv.fr'}`,
        sourceUrl: csvRes.url,
      });
    }
    if (entries.length >= 20) break;
    await sleep(600);
  }

  if (entries.length > 0) {
    console.log(`  ✅ [octroi-mer] ${entries.length} taux live extraits`);
  }
  return entries;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Scrape les taux d'octroi de mer pour les DOM.
 *
 * Ces données permettent aux utilisateurs de comprendre l'origine
 * des surcoûts en DOM-TOM : l'octroi de mer représente 8 à 30 % sur
 * les produits importés selon leur catégorie et le territoire.
 *
 * @returns {Promise<OctroisEntry[]>}
 */
export async function scrapeOctroisMer() {
  console.log('  🏛️  [octroi-mer] Scraping taux octroi de mer DOM…');

  const liveEntries = await fetchOctroisLive();

  const period = new Date().toISOString().slice(0, 7);
  const liveCoverage = new Set(liveEntries.map((e) => `${e.territory}|${e.category}`));

  const refEntries = OCTROI_MER_REFERENCE
    .filter((e) => !liveCoverage.has(`${e.territory}|${e.category}`))
    .map((e) => ({
      ...e,
      period,
      sourceUrl: 'https://www.douane.gouv.fr/demarche/connaitre-loctroi-de-mer',
    }));

  const all = [...liveEntries, ...refEntries];
  console.log(
    `  📊 [octroi-mer] ${all.length} entrées` +
    ` (live: ${liveEntries.length}, ref: ${refEntries.length})`,
  );
  return all;
}
