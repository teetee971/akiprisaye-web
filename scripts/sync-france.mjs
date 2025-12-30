/**
 * SYNC-FRANCE.MJS — Script 17
 * ------------------------------------------------------------
 * Synchronisation automatique des magasins France entière :
 *  - Carrefour / Market
 *  - Super U / Hyper U / U Express
 *  - Leclerc
 *  - Intermarché
 *  - Casino / Géant
 *  - Monoprix
 *  - DOM-TOM (Ecomax, autres)
 *
 * Résultat : base Firestore entièrement synchronisée + géocodée.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ------------------------------------------------------------
// FIREBASE CONFIG
// ------------------------------------------------------------
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "akiprisaye-web.firebaseapp.com",
  projectId: "akiprisaye-web",
  storageBucket: "akiprisaye-web.appspot.com",
  messagingSenderId: "00000000000",
  appId: "1:000000:web:xxxx"
};

// ------------------------------------------------------------
// API OVERPASS — OpenStreetMap — récupère magasins réels
// ------------------------------------------------------------
async function fetchShopsOSM(shopName) {
  console.log(`🔎 Recherche OSM pour : ${shopName}`);

  const query = `
    [out:json][timeout:30];
    (
      node["shop"="${shopName}"](France);
      node["brand"="${shopName}"](France);
      node["name"~"${shopName}", i](France);
    );
    out body;
  `;

  try {
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: query
    });

    const data = await res.json();

    if (!data.elements) return [];
    return data.elements;

  } catch (err) {
    console.error("❌ Erreur Overpass :", err);
    return [];
  }
}

// ------------------------------------------------------------
// TERRITOIRE AUTOMATIQUE
// ------------------------------------------------------------
function detectTerritoryFromLatLon(lat, lon) {
  if (lat > 45 && lon > -2) return "france";

  if (lat >= 14 && lat <= 17 && lon >= -62 && lon <= -60) return "guadeloupe";
  if (lat >= 14 && lat <= 16 && lon >= -62 && lon <= -60) return "martinique";
  if (lat >= 2 && lat <= 6 && lon >= -55 && lon <= -52) return "guyane";
  if (lat >= -22 && lat <= -20 && lon >= 55 && lon <= 56) return "reunion";
  if (lat >= -13 && lat <= -11 && lon >= 44 && lon <= 46) return "mayotte";

  return "france"; // fallback
}

// ------------------------------------------------------------
// IMPORTATION FIRESTORE
// ------------------------------------------------------------
async function importShop(item, chain, db) {
  const territory = detectTerritoryFromLatLon(item.lat, item.lon);

  const ref = doc(collection(db, "stores"));
  await setDoc(ref, {
    name: item.tags?.name || chain,
    address: item.tags?.addr_full || item.tags?.addr_street || "Adresse inconnue",
    chain: chain.toLowerCase().replace(/\s+/g, ""),
    lat: item.lat,
    lon: item.lon,
    phone: item.tags?.phone || "",
    openingHours: item.tags?.opening_hours || "08:00 - 20:00",
    territory,
    lastSync: new Date().toISOString()
  });

  console.log(`✅ Importé : ${item.tags?.name || chain} (${territory})`);
}

// ------------------------------------------------------------
// CHAÎNES À SYNCHRONISER
// ------------------------------------------------------------
const CHAINS = [
  "Carrefour",
  "Carrefour Market",
  "Super U",
  "U Express",
  "Hyper U",
  "Leclerc",
  "Intermarché",
  "Casino",
  "Monoprix",
  "Leader Price",
  "Ecomax"
];

// ------------------------------------------------------------
// LANCEMENT GLOBAL
// ------------------------------------------------------------
async function syncFrance() {
  console.log("====================================================");
  console.log("🇫🇷 SYNCHRONISATION FRANCE ENTIÈRE — Script 17");
  console.log("====================================================\n");

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  let totalImported = 0;

  for (const chain of CHAINS) {
    console.log(`\n======================`);
    console.log(`⛽ Chaîne : ${chain}`);
    console.log(`======================`);

    const items = await fetchShopsOSM(chain);

    for (const item of items) {
      await importShop(item, chain, db);
      totalImported++;

      await new Promise(r => setTimeout(r, 500)); // anti-ban
    }
  }

  console.log("\n====================================================");
  console.log("🎉 SYNCHRONISATION TERMINÉE");
  console.log("Total magasins importés :", totalImported);
  console.log("====================================================\n");
}

syncFrance();