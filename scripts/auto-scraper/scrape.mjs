/**
 * scrape.mjs — Orchestrateur de scraping automatique multi-sources
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  SOURCES DE DONNÉES SCRAPÉES (100% Open Data légal)                  │
 * ├──────────────────────────────────────────────────────────────────────┤
 * │  ⛽ Carburants  prix-carburants.gouv.fr (XML officiel quotidien)      │
 * │  🥦 Alimentaire Open Prices / Open Food Facts (ODbL + CC-BY-SA)      │
 * │  📋 BQP         data.gouv.fr — DGCCRF / Préfectures DOM              │
 * │  📡 Services    ARCEP + CRE + INSEE BDM (Licence Ouverte v2)         │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * Flux complet :
 *   1. Scraping en parallèle de toutes les sources
 *   2. Normalisation + déduplication des données
 *   3. Détection des chocs de prix vs données précédentes
 *   4. Mise à jour des fichiers JSON statiques (Git commit via workflow)
 *   5. Écriture des nouvelles observations dans Firestore
 *   6. Génération d'un rapport IA (GPT-4o-mini) sur les données collectées
 *   7. Step summary GitHub Actions
 *
 * Usage :
 *   node scrape.mjs                    → toutes sources
 *   node scrape.mjs --source fuel      → carburants uniquement
 *   node scrape.mjs --source food      → alimentaire uniquement
 *   node scrape.mjs --source bqp       → BQP uniquement
 *   node scrape.mjs --source services  → services uniquement
 *   node scrape.mjs --dry-run          → simulation (pas d'écriture)
 *
 * Variables d'environnement :
 *   FIREBASE_SERVICE_ACCOUNT  — Credentials Firebase Admin SDK (requis)
 *   OPENAI_API_KEY            — Clé OpenAI (optionnel, pour rapport IA)
 *   GITHUB_WORKSPACE          — Chemin du dépôt (fourni par GitHub Actions)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';
import OpenAI from 'openai';
import { timedSource, isScrapingAllowed } from './sources/utils.mjs';

import { scrapeFuelPrices }    from './sources/fuel.mjs';
import { scrapeFoodPrices }    from './sources/food.mjs';
import { scrapeBQPPrices }     from './sources/bqp.mjs';
import { scrapeServicePrices } from './sources/services.mjs';

const DRY_RUN   = process.argv.includes('--dry-run');
const SOURCE_FILTER = (() => {
  const idx = process.argv.indexOf('--source');
  return idx >= 0 ? process.argv[idx + 1] : 'all';
})();
const NOW       = new Date();
const ISO_NOW   = NOW.toISOString();
const DATE_ID   = ISO_NOW.slice(0, 10);
const __dirname = fileURLToPath(new URL('.', import.meta.url));

// ─── Firebase Admin ───────────────────────────────────────────────────────────

function getFirestore() {
  if (admin.apps.length) return admin.firestore();
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT ?? '';
  if (!raw) { console.warn('⚠️  FIREBASE_SERVICE_ACCOUNT non défini — Firestore ignoré'); return null; }
  let sa;
  try { sa = JSON.parse(Buffer.from(raw, 'base64').toString('utf-8')); }
  catch { sa = JSON.parse(raw); }
  admin.initializeApp({ credential: admin.credential.cert(sa) });
  return admin.firestore();
}

// ─── File paths ───────────────────────────────────────────────────────────────

function getDataDir() {
  const ws = process.env.GITHUB_WORKSPACE ?? resolve(__dirname, '../../');
  return join(ws, 'frontend', 'public', 'data');
}

function loadJSON(filePath) {
  if (!existsSync(filePath)) return null;
  try { return JSON.parse(readFileSync(filePath, 'utf-8')); } catch { return null; }
}

function saveJSON(filePath, data) {
  const dir = filePath.split('/').slice(0, -1).join('/');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

// ─── Normalization helpers ────────────────────────────────────────────────────

/** Aggregate fuel entries → territory+fuelType averages */
function aggregateFuelEntries(entries) {
  const map = new Map();
  for (const e of entries) {
    const key = `${e.territory}|${e.fuelType}`;
    if (!map.has(key)) map.set(key, { ...e, prices: [] });
    map.get(key).prices.push(e.price);
  }
  const results = [];
  for (const [, v] of map) {
    const avg = v.prices.reduce((s, p) => s + p, 0) / v.prices.length;
    results.push({
      id: `price-${v.territory.toLowerCase()}-auto-${v.fuelType.toLowerCase()}-${DATE_ID}`,
      station: { territory: v.territory, id: `auto-${v.territory.toLowerCase()}`, name: `Moyenne ${v.territory}`, city: '', address: `${v.prices.length} stations` },
      fuelType: v.fuelType,
      pricePerLiter: Math.round(avg * 1000) / 1000,
      priceMin: Math.min(...v.prices),
      priceMax: Math.max(...v.prices),
      stationCount: v.prices.length,
      currency: 'EUR',
      observationDate: ISO_NOW,
      source: v.source,
      autoCollected: true,
    });
  }
  return results;
}

/** Deduplicate food entries by EAN+territory (keep latest/lowest price) */
function deduplicateFoodEntries(entries) {
  const map = new Map();
  for (const e of entries) {
    const key = `${e.ean}|${e.territory}`;
    if (!map.has(key) || e.price < map.get(key).price) {
      map.set(key, e);
    }
  }
  return [...map.values()];
}

// ─── Shock detection ──────────────────────────────────────────────────────────

function detectFuelShocks(existing, newFuelPrices) {
  const shocks = [];
  for (const newEntry of newFuelPrices) {
    const prev = (existing?.fuelPrices ?? []).find(
      (e) => e.station?.territory === newEntry.station?.territory && e.fuelType === newEntry.fuelType,
    );
    if (!prev?.pricePerLiter) continue;
    const pct = ((newEntry.pricePerLiter - prev.pricePerLiter) / prev.pricePerLiter) * 100;
    if (Math.abs(pct) >= 3) {
      shocks.push({
        territory: newEntry.station.territory,
        type: newEntry.fuelType,
        oldPrice: prev.pricePerLiter,
        newPrice: newEntry.pricePerLiter,
        pct: Math.round(pct * 10) / 10,
        direction: pct > 0 ? 'hausse' : 'baisse',
      });
    }
  }
  return shocks.sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct));
}

/**
 * Détecte les chocs de prix alimentaires entre le snapshot précédent et les
 * nouveaux relevés Open Prices.  Seuil : ≥5 % de variation (alimentation
 * fluctue moins que le carburant, donc seuil plus haut).
 *
 * @param {{ prices?: Array<{ean:string, territory:string, price:number}> } | null} existing
 * @param {Array<{ean:string, name?:string, territory:string, price:number}>} newFood
 * @returns {Array<{ean:string, name:string, territory:string, oldPrice:number, newPrice:number, pct:number, direction:string}>}
 */
function detectFoodShocks(existing, newFood) {
  const prevIndex = new Map();
  for (const e of existing?.prices ?? []) {
    prevIndex.set(`${e.ean}|${e.territory}`, e);
  }

  const shocks = [];
  for (const newEntry of newFood) {
    const key  = `${newEntry.ean}|${newEntry.territory}`;
    const prev = prevIndex.get(key);
    if (!prev?.price || !newEntry.price) continue;
    const pct = ((newEntry.price - prev.price) / prev.price) * 100;
    if (Math.abs(pct) >= 5) {
      shocks.push({
        ean:       newEntry.ean,
        name:      newEntry.name ?? newEntry.productName ?? 'Produit inconnu',
        territory: newEntry.territory,
        oldPrice:  prev.price,
        newPrice:  newEntry.price,
        pct:       Math.round(pct * 10) / 10,
        direction: pct > 0 ? 'hausse' : 'baisse',
      });
    }
  }
  return shocks.sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct));
}

// ─── Firestore writes ─────────────────────────────────────────────────────────

async function writeScrapingResults(db, results, shocks) {
  if (!db) return;

  const batch = db.batch();

  // Scraping session document
  const sessionRef = db.collection('scraping_sessions').doc(DATE_ID);
  batch.set(sessionRef, {
    date: DATE_ID,
    timestamp: ISO_NOW,
    counts: {
      fuel:     results.fuel?.length ?? 0,
      food:     results.food?.length ?? 0,
      bqp:      results.bqp?.length ?? 0,
      services: results.services?.length ?? 0,
    },
    shocksCount: (shocks.fuel?.length ?? 0) + (shocks.food?.length ?? 0),
    status: 'success',
    generatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  // Write fuel shocks
  const allShocks = [...(shocks.fuel ?? []).map(s => ({ ...s, source: 'fuel' })),
                     ...(shocks.food ?? []).map(s => ({ ...s, source: 'food' }))];
  if (allShocks.length > 0) {
    const shocksRef = db.collection('price_shocks').doc(DATE_ID);
    batch.set(shocksRef, {
      date: DATE_ID,
      shocks: allShocks,
      type: 'multi-source',
      generatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  // Store food price observations (batch-write up to 50)
  const foodSample = (results.food ?? []).slice(0, 50);
  for (const entry of foodSample) {
    const ref = db.collection('food_price_observations').doc(`${entry.ean}-${entry.territory}-${DATE_ID}`);
    batch.set(ref, { ...entry, scrapedAt: ISO_NOW }, { merge: true });
  }

  await batch.commit();
  console.log('✅ Données écrites dans Firestore');
}

// ─── AI report ────────────────────────────────────────────────────────────────

async function generateScrapingReport(counts, shocks) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  const openai = new OpenAI({ apiKey: key });

  const allShocks = [...(shocks.fuel ?? []), ...(shocks.food ?? [])];
  const shockSummary = allShocks.length === 0
    ? 'Aucun choc de prix détecté — prix stables.'
    : allShocks.slice(0, 5).map((s) =>
        `${s.direction === 'hausse' ? '🔴' : '🟢'} ${s.territory} ${s.type ?? s.name} : ${s.direction} de ${Math.abs(s.pct)}% (${s.oldPrice}€ → ${s.newPrice}€)`
      ).join('\n');

  const prompt = `Tu es l'IA de collecte de données du projet "A KI PRI SA YÉ".
Date : ${DATE_ID}

Données collectées aujourd'hui :
- ⛽ Carburants : ${counts.fuel} stations / prix moyens DOM-TOM
- 🥦 Alimentaire : ${counts.food} relevés Open Prices
- 📋 BQP : ${counts.bqp} prix officiels plafonnés
- 📡 Services : ${counts.services} tarifs (énergie, télécom, eau, IPC)

Chocs de prix détectés :
${shockSummary}

Génère un rapport de collecte concis (3-5 phrases) en français pour l'équipe :
- Évalue la qualité des données collectées
- Commente les chocs si présents
- Indique si la couverture territoriale est bonne
- Recommande des actions si données insuffisantes

Réponds en JSON :
{
  "titre": "...",
  "rapport": "...",
  "qualite_donnees": "excellente|bonne|moyenne|insuffisante",
  "action_recommandee": "..."
}`;

  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 400,
    });
    return JSON.parse(res.choices[0]?.message?.content ?? '{}');
  } catch (err) {
    console.warn('⚠️  Erreur rapport IA :', err.message);
    return null;
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  🤖 Scraping Automatique Multi-Sources — A KI PRI SA YÉ  ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`   Date    : ${DATE_ID}`);
  console.log(`   Source  : ${SOURCE_FILTER}`);
  console.log(`   Mode    : ${DRY_RUN ? 'DRY-RUN (simulation)' : 'PRODUCTION'}`);
  console.log('');

  const db = getFirestore();
  const dataDir = getDataDir();

  // ── Scraping en parallèle ─────────────────────────────────────────────────
  const shouldRun = (s) => SOURCE_FILTER === 'all' || SOURCE_FILTER === s;

  console.log('📡 Lancement du scraping…\n');
  const [rawFuel, rawFood, rawBQP, rawServices] = await Promise.all([
    shouldRun('fuel')     ? scrapeFuelPrices()    : Promise.resolve([]),
    shouldRun('food')     ? scrapeFoodPrices()     : Promise.resolve([]),
    shouldRun('bqp')      ? scrapeBQPPrices()      : Promise.resolve([]),
    shouldRun('services') ? scrapeServicePrices()  : Promise.resolve([]),
  ]);

  // ── Normalisation ─────────────────────────────────────────────────────────
  console.log('\n🔧 Normalisation des données…');
  const fuelAggregated = aggregateFuelEntries(rawFuel);
  const foodDedup      = deduplicateFoodEntries(rawFood);

  const counts = {
    fuel:     fuelAggregated.length,
    food:     foodDedup.length,
    bqp:      rawBQP.length,
    services: rawServices.length,
  };

  console.log(`   ⛽ Carburants : ${rawFuel.length} relevés → ${counts.fuel} entrées agrégées`);
  console.log(`   🥦 Alimentaire: ${rawFood.length} relevés → ${counts.food} après dédup`);
  console.log(`   📋 BQP        : ${counts.bqp} entrées`);
  console.log(`   📡 Services   : ${counts.services} entrées`);

  // ── Shock detection ───────────────────────────────────────────────────────
  console.log('\n🔍 Détection des chocs de prix…');
  const existingFuel = loadJSON(join(dataDir, 'fuel-prices.json'));
  const existingFood = loadJSON(join(dataDir, 'open-prices-dom.json'));
  const fuelShocks   = detectFuelShocks(existingFuel, fuelAggregated);
  const foodShocks   = detectFoodShocks(existingFood, foodDedup);
  const shocks       = { fuel: fuelShocks, food: foodShocks };
  const allShocks    = [...fuelShocks, ...foodShocks];

  if (allShocks.length > 0) {
    console.log(`   🚨 ${allShocks.length} choc(s) détecté(s) :`);
    allShocks.slice(0, 5).forEach((s) =>
      console.log(`   ${s.direction === 'hausse' ? '🔴' : '🟢'} ${s.territory} ${s.type ?? s.name} : ${s.pct > 0 ? '+' : ''}${s.pct}%`),
    );
  } else {
    console.log('   ✅ Prix stables — aucun choc (carburant + alimentation)');
  }

  if (!DRY_RUN) {
    // ── Update fuel-prices.json ───────────────────────────────────────────
    if (fuelAggregated.length > 0) {
      const updated = {
        metadata: {
          ...(existingFuel?.metadata ?? {}),
          lastUpdated: ISO_NOW,
          autoUpdated: true,
          dataSource: 'prix-carburants.gouv.fr + Open Data',
          scrapedAt: ISO_NOW,
        },
        stations: existingFuel?.stations ?? [],
        fuelPrices: fuelAggregated,
        lastAutoUpdate: ISO_NOW,
      };
      saveJSON(join(dataDir, 'fuel-prices.json'), updated);
      console.log('\n💾 fuel-prices.json mis à jour');
    }

    // ── Update services-prices.json ───────────────────────────────────────
    if (rawServices.length > 0) {
      const existingServices = loadJSON(join(dataDir, 'services-prices.json')) ?? { metadata: {}, services: [] };
      const updatedServices = {
        metadata: { ...existingServices.metadata, lastUpdated: ISO_NOW, autoUpdated: true },
        services: [
          ...existingServices.services.filter((s) => !s.autoCollected),
          ...rawServices.map((s) => ({ ...s, autoCollected: true })),
        ],
      };
      saveJSON(join(dataDir, 'services-prices.json'), updatedServices);
      console.log('💾 services-prices.json mis à jour');
    }

    // ── Save BQP snapshot ─────────────────────────────────────────────────
    if (rawBQP.length > 0) {
      saveJSON(join(dataDir, 'bqp-prices.json'), {
        metadata: { lastUpdated: ISO_NOW, source: 'data.gouv.fr — DGCCRF/Préfectures', autoCollected: true },
        prices: rawBQP,
      });
      console.log('💾 bqp-prices.json mis à jour');
    }

    // ── Save Open Prices food snapshot ────────────────────────────────────
    if (foodDedup.length > 0) {
      saveJSON(join(dataDir, 'open-prices-dom.json'), {
        metadata: { lastUpdated: ISO_NOW, source: 'prices.openfoodfacts.org (ODbL)', autoCollected: true },
        prices: foodDedup,
      });
      console.log('💾 open-prices-dom.json mis à jour');
    }

    // ── Write to Firestore ────────────────────────────────────────────────
    await writeScrapingResults(db, { fuel: fuelAggregated, food: foodDedup, bqp: rawBQP, services: rawServices }, shocks);
  } else {
    console.log('\nℹ️  DRY-RUN — aucune écriture de fichiers');
  }

  // ── AI Report ──────────────────────────────────────────────────────────
  console.log('\n🤖 Génération rapport IA…');
  const report = await generateScrapingReport(counts, shocks);
  if (report) {
    console.log(`   Qualité : ${report.qualite_donnees}`);
    console.log(`   ${report.rapport?.slice(0, 100)}…`);
  }

  // ── GitHub Step Summary ────────────────────────────────────────────────
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) {
    const { appendFileSync } = await import('fs');
    const lines = [
      `## 🤖 Scraping Automatique — ${DATE_ID}`,
      '',
      `| Source | Entrées collectées |`,
      `|---|---|`,
      `| ⛽ Carburants (prix-carburants.gouv.fr) | ${rawFuel.length} relevés → ${counts.fuel} agrégés |`,
      `| 🥦 Alimentaire (Open Prices) | ${rawFood.length} relevés → ${counts.food} dédupliqués |`,
      `| 📋 BQP (data.gouv.fr) | ${counts.bqp} entrées officielles |`,
      `| 📡 Services (ARCEP/CRE/INSEE) | ${counts.services} tarifs |`,
      '',
      allShocks.length === 0
        ? '### ✅ Prix stables — aucun choc détecté'
        : `### 🚨 Chocs détectés (${allShocks.length})\n${allShocks.slice(0, 5).map((s) => `- ${s.direction === 'hausse' ? '🔴' : '🟢'} **${s.territory} ${s.type ?? s.name}** : ${s.pct > 0 ? '+' : ''}${s.pct}%`).join('\n')}`,
      '',
      report ? `### 🤖 Rapport IA\n> **${report.qualite_donnees?.toUpperCase()}** — ${report.rapport}` : '',
    ].filter((l) => l !== undefined).join('\n');
    appendFileSync(summaryPath, lines + '\n');
  }

  const totalEntries = counts.fuel + counts.food + counts.bqp + counts.services;
  console.log(`\n✅ Scraping terminé — ${totalEntries} entrées collectées au total\n`);

  // ── Scraping health file ────────────────────────────────────────────────
  // Written unconditionally (even in dry-run) so the monitoring system can
  // always check when the last successful scrape ran and which sources had data.
  const health = {
    lastScrapedAt: ISO_NOW,
    date: DATE_ID,
    dryRun: DRY_RUN,
    sources: {
      fuel:     { count: counts.fuel,     ok: counts.fuel > 0 },
      food:     { count: counts.food,     ok: counts.food > 0 },
      bqp:      { count: counts.bqp,      ok: counts.bqp > 0 },
      services: { count: counts.services, ok: counts.services > 0 },
    },
    totalEntries,
    shocksDetected: allShocks.length,
    status: totalEntries > 0 ? 'ok' : 'empty',
  };
  saveJSON(join(dataDir, 'scraping-health.json'), health);
  console.log('💾 scraping-health.json mis à jour');
}

main().catch((err) => {
  console.error('💥 Erreur fatale scraper :', err);
  process.exit(1);
});
