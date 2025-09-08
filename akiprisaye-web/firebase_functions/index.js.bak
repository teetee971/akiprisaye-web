const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();
const db = admin.firestore();

// ==============================
// Fonction planifiée : updatePrices toutes les 30 minutes
// ==============================
exports.updatePrices = functions.pubsub
  .schedule("every 30 minutes")
  .onRun(async (context) => {
    console.log("⏱️ Mise à jour automatique des prix toutes les 30 minutes");
    try {
      const response = await axios.get(functions.config().prices.api_url);
      const products = response.data;

      const batch = db.batch();
      products.forEach((product) => {
        const ref = db.collection("products").doc(product.id.toString());
        batch.set(
          ref,
          {
            name: product.name,
            price: product.price,
            store: product.store,
            updatedAt: new Date(),
          },
          { merge: true }
        );
      });

      await batch.commit();
      console.log("✅ Mise à jour réussie !");
    } catch (error) {
      console.error("❌ Erreur lors de la mise à jour :", error);
    }
    return null;
  });

// ==============================
// Fonction planifiée : nightlyRefresh à 3h du matin (UTC)
// ==============================
exports.nightlyRefresh = functions.pubsub
  .schedule("0 3 * * *")
  .onRun(async (context) => {
    console.log("🌙 Refresh complet des prix à 3h du matin");
    return null;
  });

// === Palmarès en "vrai" ===
// Hypothèse: ta collection "products" contient des docs { name, price, store, zone, updatedAt }
// Si "zone" n'existe pas dans tes docs actuels, adapte en conséquence.

// 1) Recalcul du palmarès par zone
async function computeRankingForZone(zone) {
  const snap = await admin.firestore()
    .collection("products")
    .where("zone", "==", zone)
    .get();

  // Regroupe par enseigne
  const byStore = new Map(); // store -> { sum, count }
  snap.forEach(doc => {
    const p = doc.data();
    if (typeof p.price !== "number" || !p.store) return;
    const key = p.store.trim();
    const agg = byStore.get(key) || { sum: 0, count: 0 };
    agg.sum += p.price;
    agg.count += 1;
    byStore.set(key, agg);
  });

  // Calcule le panier moyen simple
  const rows = Array.from(byStore.entries()).map(([store, agg]) => ({
    store,
    avgBasket: Number((agg.sum / Math.max(1, agg.count)).toFixed(2)),
    sampleSize: agg.count
  }));

  // Trie par panier croissant
  rows.sort((a, b) => a.avgBasket - b.avgBasket);

  // Écrit le résultat
  await admin.firestore()
    .collection("rankings")
    .doc(zone)
    .set({
      zone,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      rows
    }, { merge: true });

  return rows.length;
}

// 2) Tâche programmée : après updatePrices, lance un recalcul pour toutes les zones
const ZONES = ["martinique", "guadeloupe", "guyane", "reunion", "mayotte"];

exports.recomputeRanking = functions.region("us-central1").pubsub
  .schedule("every 3 hours")
  .onRun(async () => {
    functions.logger.info("Recalcul palmarès: start");
    for (const z of ZONES) {
      const n = await computeRankingForZone(z);
      functions.logger.info(`Zone ${z}: ${n} lignes`);
    }
    functions.logger.info("Recalcul palmarès: done");
    return null;
  });

// 3) API HTTP: /getRanking?zone=martinique
exports.getRanking = functions.region("us-central1").https.onRequest(async (req, res) => {
  // CORS simple
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    const zone = (req.query.zone || "").toString().toLowerCase().trim();
    if (!zone) return res.status(400).json({ error: "zone manquante" });

    const doc = await admin.firestore().collection("rankings").doc(zone).get();
    if (!doc.exists) return res.status(404).json({ error: "ranking introuvable pour cette zone" });

    return res.json(doc.data());
  } catch (e) {
    functions.logger.error("getRanking error", e);
    return res.status(500).json({ error: "server_error" });
  }
});
'use strict';

/**
 * A KI PRI SA YÉ – Cloud Functions (Node.js 20)
 * - HTTP API:    GET /getRanking?zone=martinique
 * - HTTP Admin:  GET /recomputeNow?key=VOTRE_CLE&zone=martinique (ou sans zone => toutes)
 * - Cron:        recomputeRanking (toutes les 3h)
 * - Cron:        updatePrices (toutes les 30 min) => via functions.config().prices.api_url
 * - Cron:        nightlyRefresh (3h UTC)
 *
 * Tips:
 *   - Définir une clé admin pour l’endpoint /recomputeNow :
 *       firebase functions:config:set admin.key="votre_cle_ultra_secrete"
 *   - Définir l’API d’import prix pour updatePrices :
 *       firebase functions:config:set prices.api_url="https://exemple.tld/prices.json"
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

// Initialisation Admin (en prod GCF utilise le service account automatiquement)
admin.initializeApp();
const db = admin.firestore();

// ==============================
// ZONES activées (DROM + COM)
// ==============================
const ZONES = [
  // DROM (RUP)
  'guadeloupe',        // Caraïbes
  'martinique',        // Caraïbes
  'guyane',            // Amérique du Sud
  'reunion',           // Océan Indien
  'mayotte',           // Océan Indien

  // COM
  'saint-pierre-et-miquelon', // Amérique du Nord
  'saint-barthelemy',         // Caraïbes
  'saint-martin',             // Caraïbes
  'polynesie-francaise',      // Pacifique
  'wallis-et-futuna'          // Pacifique
];

// ==============================
// Utilitaires
// ==============================
function toZoneKey(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ==============================
// Recalcul d’un palmarès par zone
// ==============================
async function computeRankingForZone(zoneKey) {
  const snap = await db.collection('products').where('zone', '==', zoneKey).get();

  const byStore = new Map(); // store => { sum, count }
  snap.forEach(doc => {
    const p = doc.data();
    if (typeof p.price !== 'number') return;
    const store = String(p.store || '').trim();
    if (!store) return;
    const agg = byStore.get(store) || { sum: 0, count: 0 };
    agg.sum += p.price;
    agg.count += 1;
    byStore.set(store, agg);
  });

  const rows = Array.from(byStore.entries()).map(([store, agg]) => ({
    store,
    avgBasket: Number((agg.sum / Math.max(1, agg.count)).toFixed(2)),
    sampleSize: agg.count
  })).sort((a, b) => a.avgBasket - b.avgBasket);

  await db.collection('rankings').doc(zoneKey).set({
    zone: zoneKey,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    rows
  }, { merge: true });

  return rows.length;
}

// ==============================
// HTTP: /getRanking?zone=martinique
// ==============================
exports.getRanking = functions.region('us-central1').https.onRequest(async (req, res) => {
  // CORS simple
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const zone = toZoneKey(req.query.zone);
    if (!zone) return res.status(400).json({ error: 'zone manquante' });

    const doc = await db.collection('rankings').doc(zone).get();
    if (!doc.exists) return res.status(404).json({ error: 'ranking introuvable pour cette zone' });

    return res.json(doc.data());
  } catch (e) {
    functions.logger.error('getRanking error', e);
    return res.status(500).json({ error: 'server_error' });
  }
});

// ==============================
// Cron: toutes les 3h – recalcul pour toutes les zones
// ==============================
exports.recomputeRanking = functions.region('us-central1').pubsub
  .schedule('every 3 hours')
  .onRun(async () => {
    functions.logger.info('Recalcul palmarès: start');
    for (const z of ZONES) {
      const zoneKey = toZoneKey(z);
      const n = await computeRankingForZone(zoneKey);
      functions.logger.info(`Zone ${zoneKey}: ${n} lignes`);
    }
    functions.logger.info('Recalcul palmarès: done');
    return null;
  });

// ==============================
// HTTP admin: /recomputeNow?key=XXX[&zone=martinique]
// - si "zone" absent => traite toutes les zones
// ==============================
exports.recomputeNow = functions.region('us-central1').https.onRequest(async (req, res) => {
  // CORS simple
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const provided = String(req.query.key || '');
  const expected = (functions.config().admin && functions.config().admin.key) || '';
  if (!expected || provided !== expected) {
    return res.status(403).json({ error: 'unauthorized' });
  }

  try {
    const zoneParam = req.query.zone ? toZoneKey(req.query.zone) : null;
    const zones = zoneParam ? [zoneParam] : ZONES.map(toZoneKey);

    const results = [];
    for (const z of zones) {
      const n = await computeRankingForZone(z);
      results.push({ zone: z, rows: n });
    }
    return res.json({ ok: true, results });
  } catch (e) {
    functions.logger.error('recomputeNow error', e);
    return res.status(500).json({ error: 'server_error' });
  }
});

// ==============================
// Cron: updatePrices (toutes les 30 minutes)
// - Attend functions.config().prices.api_url (JSON [{id,name,price,store,zone}, ...])
// ==============================
exports.updatePrices = functions.region('us-central1').pubsub
  .schedule('every 30 minutes')
  .onRun(async () => {
    const api = functions.config().prices && functions.config().prices.api_url;
    if (!api) {
      functions.logger.warn('updatePrices: aucun prices.api_url configuré, skip.');
      return null;
    }

    try {
      const { data } = await axios.get(api, { timeout: 15000 });
      if (!Array.isArray(data)) {
        functions.logger.error('updatePrices: format inattendu (array attendu).');
        return null;
      }

      const batch = db.batch();
      for (const p of data) {
        if (!p || p.id == null) continue;
        const ref = db.collection('products').doc(String(p.id));
        batch.set(ref, {
          name: p.name ?? null,
          price: typeof p.price === 'number' ? p.price : Number(p.price),
          store: p.store ?? null,
          zone: toZoneKey(p.zone ?? ''),
          updatedAt: new Date()
        }, { merge: true });
      }
      await batch.commit();
      functions.logger.info(`updatePrices: ${data.length} produits traités.`);
    } catch (e) {
      functions.logger.error('updatePrices error', e);
    }
    return null;
  });

// ==============================
// Cron: 3h UTC – hook libre (ex: housekeeping)
// ==============================
exports.nightlyRefresh = functions.region('us-central1').pubsub
  .schedule('0 3 * * *')
  .onRun(async () => {
    functions.logger.info('nightlyRefresh: start 03:00 UTC');
    // Exemple: on relance aussi un recalcul global
    for (const z of ZONES.map(toZoneKey)) {
      await computeRankingForZone(z);
    }
    functions.logger.info('nightlyRefresh: done');
    return null;
  });
