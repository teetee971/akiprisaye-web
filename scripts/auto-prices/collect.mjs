/**
 * collect.mjs — Collecte automatique des prix carburants DOM-TOM
 *
 * Sources :
 *   - prix-carburants.gouv.fr (données officielles gouvernementales, XML)
 *   - Données filtrées sur les départements DOM : 971 (GP), 972 (MQ),
 *     973 (GF), 974 (RE), 976 (YT)
 *
 * Flux :
 *   1. Téléchargement du flux XML gouvernemental
 *   2. Filtrage sur les codes département DOM
 *   3. Calcul des prix moyens par territoire et type de carburant
 *   4. Mise à jour de frontend/public/data/fuel-prices.json
 *   5. Écriture du snapshot dans Firestore (collection fuel_prices_snapshots)
 *   6. Commit + push Git automatique (fait par le workflow GitHub Actions)
 *
 * Usage :
 *   node collect.mjs           → Production
 *   node collect.mjs --dry-run → Simulation (pas d'écriture)
 *
 * Variables d'environnement :
 *   FIREBASE_SERVICE_ACCOUNT — JSON Admin SDK (base64 ou brut)
 *   GITHUB_WORKSPACE         — Chemin vers le dépôt (fourni par GitHub Actions)
 */

import AdmZip from 'adm-zip';
import { XMLParser } from 'fast-xml-parser';
import admin from 'firebase-admin';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

const DRY_RUN = process.argv.includes('--dry-run');
const __dirname = fileURLToPath(new URL('.', import.meta.url));

// ─── Configuration ───────────────────────────────────────────────────────────

/** URL officielle du flux XML gouvernemental — prix carburants quotidiens */
const GOVT_FUEL_URL =
  'https://donnees.roulez-eco.fr/opendata/instantane';

/** Codes INSEE des départements DOM */
const DOM_DEPT_CODES = {
  '971': { code: 'GP', name: 'Guadeloupe', flag: '🏝️' },
  '972': { code: 'MQ', name: 'Martinique', flag: '🌋' },
  '973': { code: 'GF', name: 'Guyane', flag: '🌿' },
  '974': { code: 'RE', name: 'La Réunion', flag: '🏔️' },
  '976': { code: 'YT', name: 'Mayotte', flag: '🌊' },
};

/** Carburants à suivre */
const FUEL_TYPES = ['SP95', 'SP98', 'Gazole', 'E10', 'E85', 'GPLc'];

/** Seuil d'alerte : hausse > X% vs dernier snapshot */
const SHOCK_THRESHOLD_PCT = 5;

// ─── Firebase Admin ───────────────────────────────────────────────────────────

function getFirestore() {
  if (admin.apps.length) return admin.firestore();
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT ?? '';
  if (!raw) {
    console.warn('⚠️  FIREBASE_SERVICE_ACCOUNT non défini — écriture Firestore ignorée');
    return null;
  }
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(
      Buffer.from(raw, 'base64').toString('utf-8'),
    );
  } catch {
    serviceAccount = JSON.parse(raw);
  }
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  return admin.firestore();
}

// ─── Fetch XML ────────────────────────────────────────────────────────────────

async function fetchFuelXML() {
  console.log(`📡 Téléchargement flux carburants : ${GOVT_FUEL_URL}`);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  try {
    const res = await fetch(GOVT_FUEL_URL, {
      signal: controller.signal,
      headers: { 'User-Agent': 'akiprisaye-bot/1.0 (prix-carburants-dom)' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

    // The API returns a ZIP archive containing PrixCarburants_instantane.xml
    // encoded in ISO-8859-1. We must extract and re-encode before parsing.
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const ZIP_MAGIC = [0x50, 0x4b]; // "PK" — ZIP local file header signature
    if (buffer[0] === ZIP_MAGIC[0] && buffer[1] === ZIP_MAGIC[1]) {
      // ZIP magic bytes "PK" — extract the XML entry
      const zip = new AdmZip(buffer);
      const entry = zip.getEntries().find((e) => e.entryName.endsWith('.xml'));
      if (!entry) throw new Error('Aucun fichier XML trouvé dans l\'archive ZIP');
      // The XML is ISO-8859-1 — decode with latin1 then re-encode as UTF-8
      const xmlLatin1 = entry.getData().toString('latin1');
      return xmlLatin1;
    }

    // Fallback: plain XML (old API format)
    return buffer.toString('latin1');
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Parse & aggregate ────────────────────────────────────────────────────────

/**
 * Analyse le XML et calcule les prix moyens par territoire + type carburant.
 * Structure retournée :
 *   { GP: { SP95: { avg, min, max, count, stations: [] }, ... }, ... }
 */
function parseAndAggregate(xmlText) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    isArray: (name) => ['pdv', 'prix'].includes(name),
    maxNestedTags: 500,
  });
  const data = parser.parse(xmlText);
  const stations = data?.pdv_liste?.pdv ?? [];

  /** @type {Record<string, Record<string, { sum: number; min: number; max: number; count: number; stations: string[] }>>} */
  const acc = {};

  for (const pdv of stations) {
    const dept = String(pdv['@_cp'] ?? '').slice(0, 3);
    const territory = DOM_DEPT_CODES[dept];
    if (!territory) continue;

    const tc = territory.code;
    if (!acc[tc]) acc[tc] = {};

    const priceEntries = pdv.prix ?? [];
    for (const entry of priceEntries) {
      const name = entry['@_nom'];
      if (!FUEL_TYPES.includes(name)) continue;
      const val = parseFloat(String(entry['@_valeur']).replace(',', '.'));
      if (isNaN(val) || val <= 0) continue;
      // Divide by 1000 if value seems to be in millièmes (e.g. 1589 → 1.589)
      const price = val > 10 ? val / 1000 : val;

      if (!acc[tc][name]) acc[tc][name] = { sum: 0, min: Infinity, max: -Infinity, count: 0, stations: [] };
      acc[tc][name].sum += price;
      acc[tc][name].min = Math.min(acc[tc][name].min, price);
      acc[tc][name].max = Math.max(acc[tc][name].max, price);
      acc[tc][name].count++;
      const stationName = pdv['@_adresse'] ?? 'Station inconnue';
      if (acc[tc][name].stations.length < 5) acc[tc][name].stations.push(stationName);
    }
  }

  // Convert sums to averages
  /** @type {Record<string, Record<string, { avg: number; min: number; max: number; count: number; stations: string[] }>>} */
  const result = {};
  for (const [tc, fuels] of Object.entries(acc)) {
    result[tc] = {};
    for (const [fuel, stats] of Object.entries(fuels)) {
      result[tc][fuel] = {
        avg: Math.round((stats.sum / stats.count) * 1000) / 1000,
        min: Math.round(stats.min * 1000) / 1000,
        max: Math.round(stats.max * 1000) / 1000,
        count: stats.count,
        stations: stats.stations,
      };
    }
  }
  return result;
}

// ─── Load / save local JSON ───────────────────────────────────────────────────

function getDataFilePath() {
  const workspace = process.env.GITHUB_WORKSPACE ?? resolve(__dirname, '../../');
  return join(workspace, 'frontend', 'public', 'data', 'fuel-prices.json');
}

function loadExistingData(filePath) {
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

/** Detect significant price changes vs previous data */
function detectShocks(previous, current, isoDate) {
  const shocks = [];
  if (!previous?.fuelPrices) return shocks;

  for (const entry of previous.fuelPrices) {
    const tc = entry.station?.territory;
    const fuel = entry.fuelType;
    if (!tc || !fuel) continue;

    const newStats = current[tc]?.[fuel];
    if (!newStats) continue;

    const oldPrice = entry.pricePerLiter;
    const newPrice = newStats.avg;
    if (!oldPrice || !newPrice) continue;

    const pct = ((newPrice - oldPrice) / oldPrice) * 100;
    if (Math.abs(pct) >= SHOCK_THRESHOLD_PCT) {
      shocks.push({
        territory: tc,
        fuel,
        oldPrice,
        newPrice,
        pct: Math.round(pct * 10) / 10,
        direction: pct > 0 ? 'hausse' : 'baisse',
        detectedAt: isoDate,
      });
    }
  }
  return shocks;
}

// ─── Build updated JSON ───────────────────────────────────────────────────────

function buildUpdatedJSON(existing, aggregated, isoDate) {
  const metadata = {
    ...(existing?.metadata ?? {}),
    lastUpdated: isoDate,
    description: 'Comparateur de prix des carburants — tous les territoires d\'outre-mer',
    updateFrequency: 'daily',
    dataSource: 'prix-carburants.gouv.fr (données officielles gouvernementales)',
    autoUpdated: true,
  };

  // Rebuild fuelPrices array from aggregated data
  const fuelPrices = [];
  for (const [tc, fuels] of Object.entries(aggregated)) {
    const terrInfo = Object.values(DOM_DEPT_CODES).find((t) => t.code === tc);
    for (const [fuelType, stats] of Object.entries(fuels)) {
      fuelPrices.push({
        id: `price-${tc.toLowerCase()}-auto-${fuelType.toLowerCase()}`,
        station: {
          id: `auto-${tc.toLowerCase()}`,
          name: `Moyenne ${terrInfo?.name ?? tc}`,
          address: `Données agrégées (${stats.count} stations)`,
          city: terrInfo?.name ?? tc,
          territory: tc,
        },
        fuelType,
        pricePerLiter: stats.avg,
        priceMin: stats.min,
        priceMax: stats.max,
        stationCount: stats.count,
        currency: 'EUR',
        observationDate: isoDate,
        source: 'prix-carburants.gouv.fr',
        autoCollected: true,
      });
    }
  }

  return {
    metadata,
    stations: existing?.stations ?? [],
    fuelPrices,
    lastAutoUpdate: isoDate,
  };
}

// ─── Firestore write ──────────────────────────────────────────────────────────

async function writeToFirestore(db, isoDate, aggregated, shocks) {
  if (!db) return;

  const weekId = isoDate.slice(0, 7); // YYYY-MM

  // Write snapshot
  await db.collection('fuel_prices_snapshots').doc(isoDate.slice(0, 10)).set(
    {
      date: isoDate.slice(0, 10),
      aggregated,
      shocks,
      generatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  // Write shocks to dedicated collection for frontend consumption
  if (shocks.length > 0) {
    await db.collection('price_shocks').doc(isoDate.slice(0, 10)).set(
      {
        date: isoDate.slice(0, 10),
        shocks,
        type: 'fuel',
        generatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    console.log(`🚨 ${shocks.length} choc(s) de prix carburant écrits dans Firestore`);
  }

  // Update monthly summary
  await db.collection('fuel_prices_monthly').doc(weekId).set(
    {
      month: weekId,
      lastSnapshot: isoDate.slice(0, 10),
      totalShocks: admin.firestore.FieldValue.increment(shocks.length),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  console.log(`✅ Firestore : snapshot écrit pour ${isoDate.slice(0, 10)}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('⛽ Collecte automatique des prix carburants DOM-TOM');
  console.log(`   Mode : ${DRY_RUN ? 'DRY-RUN (simulation)' : 'PRODUCTION'}`);

  const isoDate = new Date().toISOString();
  const filePath = getDataFilePath();

  // 1. Fetch XML
  let xmlText;
  try {
    xmlText = await fetchFuelXML();
    console.log(`✅ XML téléchargé (${Math.round(xmlText.length / 1024)} Ko)`);
  } catch (err) {
    console.error('❌ Erreur téléchargement XML:', err.message);
    process.exit(1);
  }

  // 2. Parse & aggregate
  let aggregated;
  try {
    aggregated = parseAndAggregate(xmlText);
    const total = Object.values(aggregated).reduce(
      (s, fuels) => s + Object.values(fuels).reduce((fs, f) => fs + f.count, 0),
      0,
    );
    console.log(`📊 Données agrégées : ${Object.keys(aggregated).length} territoire(s), ${total} observations`);
    for (const [tc, fuels] of Object.entries(aggregated)) {
      const terrInfo = Object.values(DOM_DEPT_CODES).find((t) => t.code === tc);
      console.log(`   ${terrInfo?.flag ?? ''} ${tc} — ${Object.keys(fuels).join(', ')}`);
    }
  } catch (err) {
    console.error('❌ Erreur parsing XML:', err.message);
    process.exit(1);
  }

  // 3. Guard: if the feed contains no DOM-TOM stations, preserve existing data.
  // The Metropolitan France feed (roulez-eco.fr/opendata/instantane) does not include
  // overseas territories (971/972/973/974/976). Keep existing data in this case.
  const hasNoDomData = Object.keys(aggregated).length === 0;
  if (hasNoDomData) {
    console.warn('⚠️  Aucune station DOM-TOM trouvée dans le flux XML.');
    console.warn('   Le flux roulez-eco.fr/opendata/instantane couvre uniquement la France métropolitaine.');
    console.warn('   Les données existantes sont conservées.');
    process.exit(0);
  }

  // 4. Load existing data & detect shocks
  const existing = loadExistingData(filePath);
  const shocks = detectShocks(existing, aggregated, isoDate);
  if (shocks.length > 0) {
    console.log(`🚨 ${shocks.length} choc(s) de prix détecté(s) :`);
    shocks.forEach((s) =>
      console.log(`   ${s.direction === 'hausse' ? '🔴' : '🟢'} ${s.territory} ${s.fuel} : ${s.pct > 0 ? '+' : ''}${s.pct}% (${s.oldPrice}€ → ${s.newPrice}€)`),
    );
  } else {
    console.log('✅ Aucun choc de prix détecté');
  }

  // 4. Build updated JSON
  const updated = buildUpdatedJSON(existing, aggregated, isoDate);

  if (!DRY_RUN) {
    // 5. Write local JSON
    writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf-8');
    console.log(`💾 Fichier mis à jour : ${filePath}`);

    // 6. Write to Firestore
    const db = getFirestore();
    await writeToFirestore(db, isoDate, aggregated, shocks);
  } else {
    console.log('ℹ️  DRY-RUN : pas d\'écriture');
    console.log('   Aperçu :', JSON.stringify(updated.fuelPrices.slice(0, 2), null, 2));
  }

  // 7. Summary for GitHub Actions step summary
  const summary = [
    `## ⛽ Mise à jour carburants — ${isoDate.slice(0, 10)}`,
    '',
    `| Territoire | Carburants mis à jour |`,
    `|---|---|`,
    ...Object.entries(aggregated).map(([tc, fuels]) => {
      const terrInfo = Object.values(DOM_DEPT_CODES).find((t) => t.code === tc);
      return `| ${terrInfo?.flag ?? ''} ${terrInfo?.name ?? tc} | ${Object.keys(fuels).join(', ')} |`;
    }),
    '',
    shocks.length > 0
      ? `### 🚨 Chocs détectés (${shocks.length})\n${shocks.map((s) => `- ${s.direction === 'hausse' ? '🔴' : '🟢'} **${s.territory} ${s.fuel}** : ${s.pct > 0 ? '+' : ''}${s.pct}%`).join('\n')}`
      : '### ✅ Prix stables — aucun choc détecté',
  ].join('\n');

  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) {
    const { appendFileSync } = await import('fs');
    appendFileSync(summaryPath, summary + '\n');
  }

  console.log('\n✅ Collecte terminée avec succès');
}

main().catch((err) => {
  console.error('💥 Erreur fatale :', err);
  process.exit(1);
});
