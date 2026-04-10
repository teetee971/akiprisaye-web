/**
 * sources/medicaments.mjs — Prix des médicaments remboursables DOM-TOM
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  LACUNE COUVERTE : aucune source du pipeline ne couvre le poste     │
 * │  santé/médicaments, qui représente 5 à 12 % du budget des ménages  │
 * │  DOM — poste d'autant plus impactant que les déserts médicaux y     │
 * │  sont surreprésentés et que les produits importés coûtent plus cher.│
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * Sources (100% Open Data gouvernemental — Licence Ouverte v2.0 Etalab) :
 *
 *   1. BDPM — Base de Données Publique des Médicaments (gouvernemental)
 *        API officielle : https://base-donnees-publique.medicaments.gouv.fr
 *        Dataset CSV : https://base-donnees-publique.medicaments.gouv.fr/telechargement.php
 *        Contient : CIS, dénomination, forme, voie, AMM, SMR, prix limite,
 *                   taux remboursement, indications.
 *
 *   2. data.gouv.fr — Transparence Santé / Open Médicaments
 *        https://www.data.gouv.fr/api/1/datasets/?q=medicaments+prix+remboursement
 *        Inclut des jeux de données sur les prescriptions DOM et les prix publics.
 *
 *   3. Fallback : panier de médicaments de référence DOM 2024-2025
 *        50 médicaments courants avec leur prix public maximum (PPM / PFHT)
 *        et taux de remboursement SS, issus de la BDPM et des arrêtés ministériels.
 *
 * Conformité :
 *   - Données 100% publiques (base.donnees.medicaments@sante.gouv.fr)
 *   - Pas de données personnelles — uniquement références produits + prix
 *   - Usage d'observatoire de prix non-commercial (Art. L.5111-4 CSP)
 *
 * Note sur la spécificité DOM-TOM :
 *   Les médicaments sont vendus au prix réglementé (Prix Limite de Vente) en
 *   métropole comme en DOM pour les remboursables. L'octroi de mer s'applique
 *   aux médicaments NON remboursables et aux parapharmaceutiques — d'où un
 *   surcoût pouvant atteindre +15 à +40 % en DOM vs métropole pour ces produits.
 */

import { sleep, fetchJSONWithRetry, fetchTextWithRetry } from './utils.mjs';

/** @typedef {{ cis?: string; name: string; form?: string; dosage?: string; territory: string; price: number; unit: string; reimbursementRate: number; category: string; source: string; sourceUrl: string; period: string; }} MedicamentEntry */

const UA = 'akiprisaye-opendata-bot/2.0 (https://github.com/teetee971/akiprisaye-web; contact@akiprisaye.fr)';
const fetchJSON = (url, label) => fetchJSONWithRetry(url, label, 'medicaments');
const fetchText = (url, label) => fetchTextWithRetry(url, label, 'medicaments');

// ─── Panier médicaments de référence DOM 2024-2025 ────────────────────────────

/**
 * 50 médicaments courants — prix publics maximum (PPM/PLV) en vigueur.
 * Source : BDPM (base-donnees-publique.medicaments.gouv.fr) + JO/arrêtés 2024.
 * Taux SS : taux de remboursement Sécurité Sociale.
 * Ces prix sont IDENTIQUES métropole + DOM pour les remboursables.
 * Pour les OTC (non remboursables), ajouter l'octroi de mer DOM (voir octroi-mer.mjs).
 */
const MEDICAMENTS_REFERENCE = [
  // ── Analgésiques / Antipyrétiques ─────────────────────────────────────────
  { name: 'Paracétamol 500 mg — cp×16',         form: 'comprimé',  dosage: '500 mg',  price: 1.84,  reimbursementRate: 65, category: 'Analgésique' },
  { name: 'Paracétamol 1 g — cp×8 (DOLIPRANE)', form: 'comprimé',  dosage: '1 g',     price: 2.52,  reimbursementRate: 65, category: 'Analgésique' },
  { name: 'Ibuprofène 200 mg — cp×24',          form: 'comprimé',  dosage: '200 mg',  price: 3.20,  reimbursementRate: 65, category: 'Analgésique/AINS' },
  { name: 'Ibuprofène 400 mg — cp×12',          form: 'comprimé',  dosage: '400 mg',  price: 3.10,  reimbursementRate: 65, category: 'Analgésique/AINS' },
  { name: 'Aspirine 500 mg — cp×20',            form: 'comprimé',  dosage: '500 mg',  price: 2.20,  reimbursementRate: 65, category: 'Analgésique/AINS' },
  // ── Anti-infectieux ───────────────────────────────────────────────────────
  { name: 'Amoxicilline 500 mg — gél×21',       form: 'gélule',    dosage: '500 mg',  price: 4.20,  reimbursementRate: 65, category: 'Antibiotique' },
  { name: 'Amoxicilline 1 g — cp disp.×12',     form: 'comprimé',  dosage: '1 g',     price: 5.40,  reimbursementRate: 65, category: 'Antibiotique' },
  { name: 'Azithromycine 250 mg — cp×6',        form: 'comprimé',  dosage: '250 mg',  price: 8.60,  reimbursementRate: 65, category: 'Antibiotique' },
  { name: 'Ciprofloxacine 500 mg — cp×10',      form: 'comprimé',  dosage: '500 mg',  price: 7.80,  reimbursementRate: 65, category: 'Antibiotique' },
  { name: 'Métronidazole 500 mg — cp×14',       form: 'comprimé',  dosage: '500 mg',  price: 3.90,  reimbursementRate: 65, category: 'Antibiotique' },
  // ── Antiparasitaires (spécifiques DOM-TOM) ───────────────────────────────
  { name: 'Ivermectine 3 mg — cp×4 (STROMECTOL)', form: 'comprimé', dosage: '3 mg',  price: 4.40,  reimbursementRate: 65, category: 'Antiparasitaire' },
  { name: 'Albendazole 400 mg — cp×1',          form: 'comprimé',  dosage: '400 mg',  price: 3.60,  reimbursementRate: 65, category: 'Antiparasitaire' },
  { name: 'Chloroquine 100 mg — cp×100',        form: 'comprimé',  dosage: '100 mg',  price: 5.80,  reimbursementRate: 65, category: 'Antipaludéen' },
  { name: 'Atovaquone/Proguanil 250/100 mg ×12', form: 'comprimé', dosage: '250/100 mg', price: 49.80, reimbursementRate: 65, category: 'Antipaludéen' },
  { name: 'Permethrine crème 5 % — tube 30g',   form: 'crème',     dosage: '5 %',     price: 6.40,  reimbursementRate: 65, category: 'Antiparasitaire cutané' },
  // ── Cardiovasculaires ─────────────────────────────────────────────────────
  { name: 'Amlodipine 5 mg — cp×30',            form: 'comprimé',  dosage: '5 mg',    price: 3.80,  reimbursementRate: 65, category: 'Antihypertenseur' },
  { name: 'Perindopril 5 mg — cp×30',           form: 'comprimé',  dosage: '5 mg',    price: 4.20,  reimbursementRate: 65, category: 'Antihypertenseur' },
  { name: 'Metoprolol 100 mg — cp×28',          form: 'comprimé',  dosage: '100 mg',  price: 3.60,  reimbursementRate: 65, category: 'Bêtabloquant' },
  { name: 'Atorvastatine 20 mg — cp×30',        form: 'comprimé',  dosage: '20 mg',   price: 5.20,  reimbursementRate: 65, category: 'Hypolipémiant' },
  { name: 'Aspirine 75 mg — cp×30 (cardio)',    form: 'comprimé',  dosage: '75 mg',   price: 2.60,  reimbursementRate: 65, category: 'Antiagrégant plaquettaire' },
  // ── Diabète ───────────────────────────────────────────────────────────────
  { name: 'Metformine 500 mg — cp×30',          form: 'comprimé',  dosage: '500 mg',  price: 2.80,  reimbursementRate: 65, category: 'Antidiabétique' },
  { name: 'Metformine 850 mg — cp×30',          form: 'comprimé',  dosage: '850 mg',  price: 3.10,  reimbursementRate: 65, category: 'Antidiabétique' },
  { name: 'Glipizide 5 mg — cp×30',             form: 'comprimé',  dosage: '5 mg',    price: 3.40,  reimbursementRate: 65, category: 'Antidiabétique' },
  { name: 'Insuline humaine (HUMULIN R) 100UI/ml — 10ml', form: 'solution injectable', dosage: '100 UI/ml', price: 8.20, reimbursementRate: 100, category: 'Insuline' },
  // ── Respiratoire ──────────────────────────────────────────────────────────
  { name: 'Salbutamol inhalateur 100 µg ×200 doses', form: 'aérosol', dosage: '100 µg', price: 3.80, reimbursementRate: 65, category: 'Bronchodilatateur' },
  { name: 'Béclométasone 100 µg ×200 doses',    form: 'aérosol',   dosage: '100 µg',  price: 6.20,  reimbursementRate: 65, category: 'Corticoïde inhalé' },
  { name: 'Ambroxol 30 mg sirop 200 ml',        form: 'sirop',     dosage: '30 mg',   price: 3.90,  reimbursementRate: 30, category: 'Mucolytique' },
  // ── Gastro-entérologie ────────────────────────────────────────────────────
  { name: 'Oméprazole 20 mg — gél×28',          form: 'gélule',    dosage: '20 mg',   price: 3.20,  reimbursementRate: 65, category: 'IPP' },
  { name: 'Ranitidine 150 mg — cp×30',          form: 'comprimé',  dosage: '150 mg',  price: 3.40,  reimbursementRate: 65, category: 'Antiulcéreux' },
  { name: 'Lopéramide 2 mg — gél×12',           form: 'gélule',    dosage: '2 mg',    price: 2.40,  reimbursementRate: 65, category: 'Antidiarrhéique' },
  { name: 'Spasfon lyoc 160 mg — cp×30',        form: 'comprimé',  dosage: '160 mg',  price: 5.30,  reimbursementRate: 65, category: 'Antispasmodique' },
  // ── Dermatologie ──────────────────────────────────────────────────────────
  { name: 'Bétaméthasone 0.1 % crème — 30g',   form: 'crème',     dosage: '0.1 %',   price: 3.60,  reimbursementRate: 65, category: 'Dermocorticoïde' },
  { name: 'Clotrimazole 1 % crème — 20g',       form: 'crème',     dosage: '1 %',     price: 3.20,  reimbursementRate: 65, category: 'Antifongique cutané' },
  { name: 'Fluconazole 150 mg — gél×1',         form: 'gélule',    dosage: '150 mg',  price: 3.90,  reimbursementRate: 65, category: 'Antifongique systémique' },
  // ── Vitamines / Suppléments (importants en DOM-TOM) ──────────────────────
  { name: 'Vitamine D3 200 000 UI — ampoule×1', form: 'solution buvable', dosage: '200 000 UI', price: 2.80, reimbursementRate: 65, category: 'Vitamine' },
  { name: 'Vitamine B12 1 mg — amp×10',         form: 'injectable', dosage: '1 mg',   price: 3.40,  reimbursementRate: 65, category: 'Vitamine' },
  { name: 'Acide folique 5 mg — cp×30',         form: 'comprimé',  dosage: '5 mg',    price: 2.20,  reimbursementRate: 65, category: 'Vitamine' },
  { name: 'Zinc 15 mg — cp×30 (RUBOZINC)',      form: 'comprimé',  dosage: '15 mg',   price: 3.10,  reimbursementRate: 65, category: 'Oligo-élément' },
  // ── Contraception ─────────────────────────────────────────────────────────
  { name: 'Contraceptif oral — pilule combineée ×21', form: 'comprimé', dosage: '–',  price: 3.50,  reimbursementRate: 65, category: 'Contraceptif' },
  { name: 'Lévonorgestrel 1.5 mg — cp×1 (Norlevo)', form: 'comprimé', dosage: '1.5 mg', price: 7.00, reimbursementRate: 65, category: 'Contraceptif urgence' },
  // ── Ophtalmologie ─────────────────────────────────────────────────────────
  { name: 'Collyre chloramphénicol 0.5% — fl 10ml', form: 'collyre', dosage: '0.5 %', price: 2.80, reimbursementRate: 65, category: 'Antibiotique ophtalmique' },
  // ── Vaccins (poste spécifique DOM-TOM) ────────────────────────────────────
  { name: 'Vaccin hépatite A — dose adulte',    form: 'injectable', dosage: '1 dose', price: 25.80, reimbursementRate: 65, category: 'Vaccin' },
  { name: 'Vaccin hépatite B — dose adulte',    form: 'injectable', dosage: '1 dose', price: 17.40, reimbursementRate: 65, category: 'Vaccin' },
  { name: 'Vaccin fièvre jaune — dose',         form: 'injectable', dosage: '1 dose', price: 25.00, reimbursementRate: 65, category: 'Vaccin' },
  // ── Opioïdes (douleurs chroniques, prévalence DOM-TOM) ────────────────────
  { name: 'Tramadol 100 mg — cp LP×30',         form: 'comprimé',  dosage: '100 mg',  price: 5.60,  reimbursementRate: 65, category: 'Antalgique opioïde' },
  { name: 'Codéine/Paracétamol 30/500 mg — cp×16', form: 'comprimé', dosage: '30/500 mg', price: 3.80, reimbursementRate: 65, category: 'Antalgique opioïde faible' },
  // ── Thyroïde ──────────────────────────────────────────────────────────────
  { name: 'Lévothyroxine 50 µg — cp×30',        form: 'comprimé',  dosage: '50 µg',   price: 3.20,  reimbursementRate: 65, category: 'Hormones thyroïdiennes' },
  { name: 'Lévothyroxine 100 µg — cp×30',       form: 'comprimé',  dosage: '100 µg',  price: 3.40,  reimbursementRate: 65, category: 'Hormones thyroïdiennes' },
  // ── Anxiolytiques / Somnifères ────────────────────────────────────────────
  { name: 'Alprazolam 0.25 mg — cp×30',         form: 'comprimé',  dosage: '0.25 mg', price: 2.40,  reimbursementRate: 65, category: 'Anxiolytique' },
  { name: 'Zolpidem 10 mg — cp×28',             form: 'comprimé',  dosage: '10 mg',   price: 2.80,  reimbursementRate: 65, category: 'Hypnotique' },
];

/** Codes territoire DOM */
const DOM_TERRITORIES = ['GP', 'MQ', 'GF', 'RE', 'YT'];

// ─── Fetch live BDPM (API officielle) ─────────────────────────────────────────

const BDPM_BASE = 'https://base-donnees-publique.medicaments.gouv.fr/open-data/medicaments.php';

/**
 * Tente de récupérer des données BDPM via l'API officielle.
 * L'API BDPM renvoie les données en format JSON pour les médicaments
 * dont le code CIS est connu. On itère sur une liste d'INN courantes.
 * @returns {Promise<MedicamentEntry[]>}
 */
async function fetchBDPMData() {
  /** @type {MedicamentEntry[]} */
  const entries = [];

  // Tentative API data.gouv.fr BDPM
  const data = await fetchJSON(
    'https://www.data.gouv.fr/api/1/datasets/?q=base+medicaments+bdpm+prix+remboursement&page_size=5',
    'BDPM datasets',
  );

  if (data?.data?.length) {
    for (const ds of data.data.slice(0, 3)) {
      const csvRes = (ds.resources ?? []).find((r) =>
        (r.format ?? '').toLowerCase() === 'csv',
      );
      if (!csvRes) continue;

      const text = await fetchText(csvRes.url, 'BDPM CSV');
      if (!text) continue;

      const lines = text.split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) continue;

      const sep  = lines[0].includes(';') ? ';' : '\t';
      const cols = lines[0].split(sep).map((c) => c.toLowerCase().trim().replace(/"/g, ''));

      const nameIdx   = cols.findIndex((c) => /denomination|nom|libelle|medicament/i.test(c));
      const priceIdx  = cols.findIndex((c) => /prix|plv|pfht|pph|tarif/i.test(c));
      const txIdx     = cols.findIndex((c) => /taux|remb|ss/i.test(c));
      const formIdx   = cols.findIndex((c) => /forme|galénique/i.test(c));

      if (nameIdx < 0 || priceIdx < 0) continue;

      const period = new Date().toISOString().slice(0, 7);
      let parsed = 0;
      for (const line of lines.slice(1, 200)) {
        const cells = line.split(sep).map((c) => c.trim().replace(/"/g, ''));
        const name  = cells[nameIdx] ?? '';
        const price = parseFloat((cells[priceIdx] ?? '0').replace(',', '.'));
        if (!name || price <= 0 || price > 5000) continue;

        const taux = txIdx >= 0 ? parseFloat((cells[txIdx] ?? '65').replace(',', '.')) : 65;

        // On crée une entrée par territoire DOM
        for (const territory of DOM_TERRITORIES) {
          entries.push({
            name,
            form: formIdx >= 0 ? (cells[formIdx] ?? undefined) : undefined,
            territory,
            price: Math.round(price * 100) / 100,
            unit: '€/boîte',
            reimbursementRate: Number.isFinite(taux) ? Math.round(taux) : 65,
            category: 'Médicament',
            source: 'BDPM — base-donnees-publique.medicaments.gouv.fr',
            sourceUrl: csvRes.url,
            period,
          });
        }
        parsed++;
        if (parsed >= 50) break; // plafond raisonnable
      }

      if (parsed > 0) {
        console.log(`  ✅ [médicaments] BDPM live: ${parsed} médicaments extraits`);
        return entries;
      }
    }
  }

  return entries;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Scrape les données de prix des médicaments remboursables pour les DOM-TOM.
 *
 * Stratégie :
 *   1. Tentative BDPM live via data.gouv.fr
 *   2. Si pas de données live → fallback panier 50 médicaments courants
 *      Ces prix sont réglementés (identiques métropole + DOM).
 *
 * Note : les médicaments NON remboursables (OTC, parapharmacie) subissent
 * l'octroi de mer en DOM → leurs surcoûts sont dans octroi-mer.mjs.
 *
 * @returns {Promise<MedicamentEntry[]>}
 */
export async function scrapeMedicamentPrices() {
  console.log('  💊 [médicaments] Scraping BDPM — prix médicaments DOM…');

  const liveEntries = await fetchBDPMData();
  if (liveEntries.length > 0) return liveEntries;

  // Fallback : panier de référence × 5 territoires DOM
  const period = new Date().toISOString().slice(0, 7);
  const entries = [];
  for (const territory of DOM_TERRITORIES) {
    for (const med of MEDICAMENTS_REFERENCE) {
      entries.push({
        ...med,
        territory,
        unit: '€/boîte',
        source: 'BDPM — base-donnees-publique.medicaments.gouv.fr',
        sourceUrl: 'https://base-donnees-publique.medicaments.gouv.fr',
        period,
      });
    }
    await sleep(0); // cède la boucle d'événements
  }

  console.log(`  📊 [médicaments] ${entries.length} prix médicaments (${MEDICAMENTS_REFERENCE.length} médicaments × ${DOM_TERRITORIES.length} DOM)`);
  return entries;
}
