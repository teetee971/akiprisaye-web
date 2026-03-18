#!/usr/bin/env node
/**
 * scrape-product.mjs — Scan on-demand d'un produit par EAN ou URL
 *
 * Permet de récupérer les prix d'un produit en temps quasi-réel sur tous les
 * territoires DOM-TOM en interrogeant Open Food Facts + Open Prices.
 *
 * Usage :
 *   node scrape-product.mjs --ean 3017620422003
 *   node scrape-product.mjs --ean 3017620422003 --territory gp,mq
 *   node scrape-product.mjs --url https://example.com/produit/nutella
 *   node scrape-product.mjs --ean 3017620422003 --output json
 *   node scrape-product.mjs --eans 3017620422003,3068320113901 --territory all
 *
 * Variables d'environnement :
 *   FIREBASE_SERVICE_ACCOUNT — Pour écrire les prix en Firestore (optionnel)
 *   GITHUB_STEP_SUMMARY      — Fourni automatiquement par GitHub Actions
 *
 * Sorties :
 *   - Console : tableau des prix par territoire
 *   - JSON    : fichier frontend/public/data/product-scan-{EAN}.json
 *   - Firestore: collection product_price_scans/{EAN}/{territory}
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

import {
  scrapeProductByEAN,
  scrapePricesByEAN,
  scrapeRetailerPage,
  bulkScanEANs,
  PANIER_BASE_EANS,
} from './sources/retailers.mjs';

// ─── CLI args ─────────────────────────────────────────────────────────────────

const args  = process.argv.slice(2);
const get   = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null; };
const has   = (flag) => args.includes(flag);

const EAN_ARG    = get('--ean');
const EANS_ARG   = get('--eans');  // comma-separated
const URL_ARG    = get('--url');
const TERRITORY  = get('--territory') ?? 'all';
const OUTPUT     = get('--output') ?? 'console';  // console | json | both
const PANIER     = has('--panier');  // Scan le panier de base DOM-TOM

const ALL_DOM = ['gp', 'mq', 'gf', 're', 'yt'];
const territories = TERRITORY === 'all'
  ? ALL_DOM
  : TERRITORY.split(',').map((t) => t.trim().toLowerCase());

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(__dirname, '../..');
const DATA_DIR = join(ROOT, 'frontend/public/data');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function saveJSON(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8');
}

/** Formate un prix avec 2 décimales et devise */
const fmt = (price, currency = 'EUR') =>
  price != null ? `${Number(price).toFixed(2)} ${currency}` : '—';

/** Nom lisible du territoire */
const TERRITORY_NAMES = {
  gp: 'Guadeloupe', mq: 'Martinique', gf: 'Guyane',
  re: 'La Réunion', yt: 'Mayotte',
};

// ─── Firebase (optionnel) ─────────────────────────────────────────────────────

async function getFirestore() {
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!sa) return null;
  try {
    const { default: admin } = await import('firebase-admin');
    if (!admin.apps.length) {
      const cred = sa.startsWith('{')
        ? JSON.parse(sa)
        : JSON.parse(Buffer.from(sa, 'base64').toString());
      admin.initializeApp({ credential: admin.credential.cert(cred) });
    }
    return admin.firestore();
  } catch { return null; }
}

async function saveToFirestore(db, ean, product, pricesByTerritory) {
  if (!db) return;
  const now = new Date().toISOString();
  const batch = db.batch();

  for (const [territory, prices] of Object.entries(pricesByTerritory)) {
    if (!prices.length) continue;
    const ref = db
      .collection('product_price_scans')
      .doc(ean)
      .collection(territory)
      .doc(now.slice(0, 10));
    batch.set(ref, {
      ean,
      territory,
      product: product ? { name: product.name, brand: product.brand, category: product.category } : null,
      prices,
      scannedAt: now,
    }, { merge: true });
  }

  await batch.commit();
  console.log('✅ Firestore — prix enregistrés dans product_price_scans');
}

// ─── Output helpers ───────────────────────────────────────────────────────────

function printProductTable(product, pricesByTerritory) {
  if (product) {
    console.log('\n📦 Produit identifié :');
    console.log(`   Nom       : ${product.name}`);
    console.log(`   Marque    : ${product.brand}`);
    console.log(`   Catégorie : ${product.category}`);
    if (product.nutriscore) console.log(`   Nutri-score: ${product.nutriscore.toUpperCase()}`);
  } else {
    console.log('\n📦 Produit : inconnu (aucune fiche Open Food Facts)');
  }

  console.log('\n💰 Prix par territoire :');
  console.log('─'.repeat(60));
  console.log(`${'Territoire'.padEnd(15)} ${'Prix min'.padEnd(12)} ${'Prix max'.padEnd(12)} ${'Nb relevés'}`);
  console.log('─'.repeat(60));

  for (const territory of territories) {
    const prices = pricesByTerritory[territory] ?? [];
    if (!prices.length) {
      console.log(`${(TERRITORY_NAMES[territory] ?? territory).padEnd(15)} ${'N/D'.padEnd(12)} ${'N/D'.padEnd(12)} 0`);
      continue;
    }
    const vals = prices.map((p) => p.price).filter((v) => v > 0);
    const min  = Math.min(...vals);
    const max  = Math.max(...vals);
    const cur  = prices[0]?.currency ?? 'EUR';
    console.log(
      `${(TERRITORY_NAMES[territory] ?? territory).padEnd(15)} ${fmt(min, cur).padEnd(12)} ${fmt(max, cur).padEnd(12)} ${prices.length}`,
    );
  }
  console.log('─'.repeat(60));
}

async function writeStepSummary(results) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) return;
  const { appendFileSync } = await import('fs');
  const lines = [
    `## 🔍 Scan produit — ${new Date().toISOString().slice(0, 10)}`,
    '',
    ...results.map(({ ean, product, pricesByTerritory }) => {
      const rows = territories.map((t) => {
        const ps = pricesByTerritory[t] ?? [];
        const vals = ps.map((p) => p.price).filter(Boolean);
        return `| ${TERRITORY_NAMES[t] ?? t} | ${vals.length ? `${Math.min(...vals).toFixed(2)} €` : 'N/D'} | ${ps.length} |`;
      });
      return [
        `### 📦 ${product?.name ?? ean} (${ean})`,
        `**Marque:** ${product?.brand ?? '—'} | **Catégorie:** ${product?.category ?? '—'}`,
        '',
        '| Territoire | Prix min | Relevés |',
        '|---|---|---|',
        ...rows,
        '',
      ].join('\n');
    }),
  ].join('\n');
  appendFileSync(summaryPath, lines + '\n');
}

// ─── Core scan logic ──────────────────────────────────────────────────────────

async function scanEAN(ean) {
  console.log(`\n🔍 Scan EAN ${ean} sur ${territories.map((t) => TERRITORY_NAMES[t] ?? t).join(', ')}…`);

  const [product, ...priceArrays] = await Promise.all([
    scrapeProductByEAN(ean),
    ...territories.map((t) => scrapePricesByEAN(ean, [t])),
  ]);

  const pricesByTerritory = Object.fromEntries(
    territories.map((t, i) => [t, priceArrays[i]]),
  );

  return { ean, product, pricesByTerritory };
}

async function scanURL(url) {
  console.log(`\n🔍 Scan URL : ${url}`);
  const result = await scrapeRetailerPage(url);
  if (!result) { console.log('   ❌ Impossible d\'extraire les données de cette page.'); return null; }
  console.log(`   📦 Produit : ${result.name}`);
  console.log(`   💰 Prix    : ${fmt(result.price, result.currency)}`);
  console.log(`   📊 Dispo   : ${result.availability || 'inconnue'}`);
  if (result.ean) console.log(`   🏷️  EAN    : ${result.ean}`);
  return result;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  🔍 Scan Produit On-Demand — A KI PRI SA YÉ             ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  ensureDataDir();
  const db = await getFirestore();

  // ── Mode URL ────────────────────────────────────────────────────────────────
  if (URL_ARG) {
    await scanURL(URL_ARG);
    return;
  }

  // ── Mode Panier de base ─────────────────────────────────────────────────────
  if (PANIER) {
    console.log(`\n🛒 Scan du panier de base (${PANIER_BASE_EANS.length} produits)…`);
    const results = await bulkScanEANs(PANIER_BASE_EANS, territories);
    const scanResults = [];

    for (const { ean, product, prices } of results) {
      const pricesByTerritory = Object.fromEntries(
        territories.map((t) => [t, prices.filter((p) => p.territory === t)]),
      );
      printProductTable(product, pricesByTerritory);
      scanResults.push({ ean, product, pricesByTerritory });

      if (OUTPUT === 'json' || OUTPUT === 'both') {
        saveJSON(join(DATA_DIR, `product-scan-${ean}.json`), {
          ean, product, pricesByTerritory,
          scannedAt: new Date().toISOString(),
          territories,
        });
      }
      await saveToFirestore(db, ean, product, pricesByTerritory);
    }

    await writeStepSummary(scanResults);
    console.log(`\n✅ Panier de base scanné — ${results.length} produits\n`);
    return;
  }

  // ── Mode EANs multiples ─────────────────────────────────────────────────────
  const eans = EANS_ARG
    ? EANS_ARG.split(',').map((e) => e.trim()).filter(Boolean)
    : EAN_ARG
      ? [EAN_ARG]
      : [];

  if (!eans.length) {
    console.error('❌ Fournissez --ean EAN, --eans EAN1,EAN2, --url URL, ou --panier');
    console.error('   Exemples :');
    console.error('     node scrape-product.mjs --ean 3017620422003');
    console.error('     node scrape-product.mjs --eans 3017620422003,3068320113901 --territory gp,mq');
    console.error('     node scrape-product.mjs --panier --territory all');
    process.exit(1);
  }

  const scanResults = [];
  for (const ean of eans) {
    const result = await scanEAN(ean);
    printProductTable(result.product, result.pricesByTerritory);
    scanResults.push(result);

    if (OUTPUT === 'json' || OUTPUT === 'both') {
      const outPath = join(DATA_DIR, `product-scan-${ean}.json`);
      saveJSON(outPath, {
        ...result,
        scannedAt: new Date().toISOString(),
        territories,
      });
      console.log(`\n💾 Résultats sauvegardés : ${outPath}`);
    }

    await saveToFirestore(db, ean, result.product, result.pricesByTerritory);
  }

  await writeStepSummary(scanResults);
  console.log(`\n✅ Scan terminé — ${scanResults.length} produit(s)\n`);
}

main().catch((err) => {
  console.error('💥 Erreur scan produit :', err);
  process.exit(1);
});
