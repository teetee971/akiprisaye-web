/**
 * snapshot.mjs — Snapshot hebdomadaire de l'Observatoire des prix
 *
 * Chaque semaine (lundi 8h UTC) :
 *   1. Charge tous les fichiers JSON de prix statiques
 *   2. Calcule les moyennes, tendances, évolutions inter-territoires
 *   3. Génère une analyse éditoriale avec GPT-4o-mini
 *   4. Écrit le snapshot dans Firestore (observatory_snapshots/{weekId})
 *   5. Met à jour la collection observatory_latest
 *
 * Usage :
 *   node snapshot.mjs           → Production
 *   node snapshot.mjs --dry-run → Simulation
 *
 * Variables d'environnement :
 *   FIREBASE_SERVICE_ACCOUNT — Credentials Firebase Admin
 *   OPENAI_API_KEY            — Clé OpenAI
 *   SITE_URL                  — URL du site pour récupérer les JSON
 */

import admin from 'firebase-admin';
import OpenAI from 'openai';

const DRY_RUN = process.argv.includes('--dry-run');
const NOW = new Date();
const WEEK_ID = getWeekId(NOW);
const ISO_NOW = NOW.toISOString();

// ─── Week ID ──────────────────────────────────────────────────────────────────

function getWeekId(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

// ─── Firebase Admin ───────────────────────────────────────────────────────────

function getFirestore() {
  if (admin.apps.length) return admin.firestore();
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT ?? '';
  if (!raw) { console.warn('⚠️  FIREBASE_SERVICE_ACCOUNT non défini'); return null; }
  let sa;
  try { sa = JSON.parse(Buffer.from(raw, 'base64').toString('utf-8')); }
  catch { sa = JSON.parse(raw); }
  admin.initializeApp({ credential: admin.credential.cert(sa) });
  return admin.firestore();
}

// ─── Fetch static data ────────────────────────────────────────────────────────

async function fetchJSON(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`⚠️  Impossible de charger ${url} : ${err.message}`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Aggregate statistics ─────────────────────────────────────────────────────

function computeStats(prices) {
  if (!prices || prices.length === 0) return null;
  const sorted = [...prices].sort((a, b) => a - b);
  const mean = prices.reduce((s, v) => s + v, 0) / prices.length;
  const median = sorted[Math.floor(sorted.length / 2)];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  return {
    mean: Math.round(mean * 100) / 100,
    median: Math.round(median * 100) / 100,
    min: Math.round(min * 100) / 100,
    max: Math.round(max * 100) / 100,
    count: prices.length,
  };
}

function analyzeFuelPrices(fuelData) {
  if (!fuelData?.fuelPrices) return null;
  const byTerritoryFuel = {};
  for (const entry of fuelData.fuelPrices) {
    const tc = entry.station?.territory;
    const fuel = entry.fuelType;
    if (!tc || !fuel) continue;
    const key = `${tc}|${fuel}`;
    if (!byTerritoryFuel[key]) byTerritoryFuel[key] = [];
    byTerritoryFuel[key].push(entry.pricePerLiter);
  }
  const result = {};
  for (const [key, prices] of Object.entries(byTerritoryFuel)) {
    result[key] = computeStats(prices);
  }
  return result;
}

// ─── AI editorial analysis ────────────────────────────────────────────────────

async function generateEditorial(weekId, fuelStats, historicalWeeks) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const openai = new OpenAI({ apiKey: key });

  // Build a compact summary for the prompt
  const fuelSummary = fuelStats
    ? Object.entries(fuelStats)
        .slice(0, 15)
        .map(([k, s]) => `${k}: moy ${s.mean}€/L (min ${s.min}, max ${s.max}, n=${s.count})`)
        .join('\n')
    : 'Données non disponibles';

  const histCount = historicalWeeks?.length ?? 0;

  const prompt = `Tu es l'IA éditoriale de l'Observatoire Citoyen des Prix Outre-mer.
Nous sommes à la semaine ${weekId}.

Données carburants cette semaine (prix moyens par territoire et type) :
${fuelSummary}

Historique disponible : ${histCount} semaine(s) précédente(s).

Génère une analyse hebdomadaire concise (6-8 phrases) en français :
- Résume les niveaux de prix actuels des carburants dans les DOM-TOM
- Compare les territoires entre eux (qui paye le plus cher ?)
- Identifie des tendances si données historiques disponibles
- Termine par un conseil pratique pour les ménages

Réponds en JSON :
{
  "titre": "...",
  "analyse": "...",
  "territoire_plus_cher": "...",
  "territoire_moins_cher": "...",
  "tendance": "hausse|stable|baisse",
  "conseil_citoyen": "..."
}`;

  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 600,
    });
    return JSON.parse(res.choices[0]?.message?.content ?? '{}');
  } catch (err) {
    console.warn('⚠️  Erreur génération éditoriale :', err.message);
    return null;
  }
}

// ─── Load historical snapshots ────────────────────────────────────────────────

async function loadHistoricalSnapshots(db, limit = 8) {
  if (!db) return [];
  try {
    const snap = await db.collection('observatory_snapshots')
      .orderBy('weekId', 'desc')
      .limit(limit)
      .get();
    return snap.docs.map((d) => d.data());
  } catch {
    return [];
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('📊 Snapshot hebdomadaire Observatoire des Prix');
  console.log(`   Semaine : ${WEEK_ID}`);
  console.log(`   Mode : ${DRY_RUN ? 'DRY-RUN' : 'PRODUCTION'}`);

  const db = getFirestore();
  const siteBase = (process.env.SITE_URL ?? 'https://teetee971.github.io/akiprisaye-web').replace(/\/$/, '');

  // 1. Load static data
  console.log('\n📡 Chargement des données…');
  const [fuelData] = await Promise.all([
    fetchJSON(`${siteBase}/data/fuel-prices.json`),
  ]);

  console.log(`   ⛽ Carburants : ${fuelData?.fuelPrices?.length ?? 0} entrées`);

  // 2. Aggregate stats
  console.log('\n📊 Calcul des statistiques…');
  const fuelStats = analyzeFuelPrices(fuelData);
  if (fuelStats) {
    console.log(`   ${Object.keys(fuelStats).length} combinaisons territoire×carburant`);
  }

  // 3. Load historical
  console.log('\n📅 Chargement historique (8 semaines)…');
  const historical = await loadHistoricalSnapshots(db, 8);
  console.log(`   ${historical.length} snapshot(s) historique(s)`);

  // 4. Generate AI editorial
  console.log('\n🤖 Génération analyse éditoriale IA…');
  const editorial = await generateEditorial(WEEK_ID, fuelStats, historical);
  if (editorial) {
    console.log(`   Titre : ${editorial.titre}`);
    console.log(`   Tendance : ${editorial.tendance}`);
    console.log(`   Plus cher : ${editorial.territoire_plus_cher}`);
  }

  // 5. Build snapshot
  const snapshot = {
    weekId: WEEK_ID,
    generatedAt: ISO_NOW,
    fuelStats: fuelStats ?? {},
    editorial: editorial ?? null,
    dataSources: {
      fuelPricesCount: fuelData?.fuelPrices?.length ?? 0,
    },
    historicalWeeksCount: historical.length,
  };

  console.log('\n📋 Snapshot construit');

  if (!DRY_RUN) {
    // 6. Write to Firestore
    if (db) {
      await db.collection('observatory_snapshots').doc(WEEK_ID).set(snapshot, { merge: true });
      await db.collection('observatory_snapshots').doc('_latest').set({
        ...snapshot,
        latestWeekId: WEEK_ID,
      });
      console.log(`✅ Snapshot écrit dans Firestore : observatory_snapshots/${WEEK_ID}`);
    }
  } else {
    console.log('\nℹ️  DRY-RUN — aperçu :');
    console.log(JSON.stringify(snapshot, null, 2).slice(0, 500));
  }

  // 7. Step summary
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) {
    const { appendFileSync } = await import('fs');
    const lines = [
      `## 📊 Snapshot Observatoire — Semaine ${WEEK_ID}`,
      '',
      editorial ? [
        `### ${editorial.titre ?? 'Analyse hebdomadaire'}`,
        `> ${editorial.analyse ?? ''}`,
        '',
        `| Indicateur | Valeur |`,
        `|---|---|`,
        `| Tendance | ${editorial.tendance ?? 'N/A'} |`,
        `| Territoire le plus cher | ${editorial.territoire_plus_cher ?? 'N/A'} |`,
        `| Territoire le moins cher | ${editorial.territoire_moins_cher ?? 'N/A'} |`,
        '',
        editorial.conseil_citoyen ? `**Conseil citoyen :** ${editorial.conseil_citoyen}` : '',
      ].filter(Boolean).join('\n') : '### Données non disponibles',
    ].join('\n');
    appendFileSync(summaryPath, lines + '\n');
  }

  console.log('\n✅ Snapshot terminé');
}

main().catch((err) => {
  console.error('💥 Erreur fatale snapshot :', err);
  process.exit(1);
});
