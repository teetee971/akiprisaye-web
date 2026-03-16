/**
 * AUTO-FIX STORES — SCRIPT 16
 * ----------------------------------------------------------
 * Répare automatiquement les magasins dans Firestore :
 *
 *  ✔ Territory en minuscule
 *  ✔ Correction des chaines (normalisation)
 *  ✔ Correction du logo par défaut si manquant
 *  ✔ Géocodage automatique si lat/lon manquant
 *  ✔ Mise à jour immédiate Firestore
 *
 * Compatible : Node / Termux / GitHub Actions / Cloudflare Workers
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// -----------------------------
// FIREBASE CONFIG
// -----------------------------
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyAs0uisnGSK7OlrFqQPFYF6E-ctNOPY0Sw",
  authDomain: "a-ki-pri-sa-ye.firebaseapp.com",
  projectId: "a-ki-pri-sa-ye",
  storageBucket: "a-ki-pri-sa-ye.firebasestorage.app",
  messagingSenderId: "187272078809",
  appId: "1:187272078809:web:501d916973a75edb06e5c8",
  measurementId: "G-W0R1B4HHE1"
};

// -----------------------------
// UTILITAIRES LOCAUX
// -----------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ASSETS_DIR = path.resolve(__dirname, "..", "assets");

function logoExists(filename) {
  return fs.existsSync(path.join(ASSETS_DIR, filename));
}

// -----------------------------
// GÉOCODAGE (OpenStreetMap)
// -----------------------------
async function geocode(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    address
  )}&limit=1`;

  try {
    const res = await fetch(url, {
      headers: {
        "Accept-Language": "fr",
        "User-Agent": "akiprisaye-web/auto-fix-stores"
      }
    });

    const data = await res.json();

    if (!data || !data[0]) return { lat: null, lon: null };

    return {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon)
    };
  } catch (e) {
    console.error("❌ Echec géocode →", e);
    return { lat: null, lon: null };
  }
}

// -----------------------------
// RÉPARATION AUTOMATIQUE
// -----------------------------
async function autoFixStores() {
  console.log("====================================================");
  console.log("🛠️  AUTO-FIX STORES — LANCEMENT");
  console.log("====================================================\n");

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const snap = await getDocs(collection(db, "stores"));

  let fixed = 0;

  for (const document of snap.docs) {
    const store = document.data();
    const ref = doc(db, "stores", document.id);

    let needsUpdate = false;
    let updatePayload = {};

    // ------------------------------
    // TERRITORY
    // ------------------------------
    if (!store.territory || store.territory !== store.territory.toLowerCase()) {
      updatePayload.territory = (store.territory || "guadeloupe").toLowerCase();
      needsUpdate = true;
      console.log(`⚠️ Territory corrigé → ${store.name}`);
    }

    // ------------------------------
    // CHAIN → logo-friendly
    // ------------------------------
    if (store.chain) {
      const cleanChain = store.chain.toLowerCase().replace(/\s+/g, "");
      if (cleanChain !== store.chain) {
        updatePayload.chain = cleanChain;
        needsUpdate = true;
        console.log(`🔤 Chaîne normalisée → ${store.name}`);
      }
    }

    // ------------------------------
    // LOGO
    // ------------------------------
    const logoName = `logo-${store.chain?.toLowerCase().replace(/\s+/g, "")}.png`;

    if (!logoExists(logoName)) {
      updatePayload.logo = "logo-default.png";
      needsUpdate = true;
      console.log(`🖼️ Logo manquant → fallback appliqué → ${store.name}`);
    }

    // ------------------------------
    // COORDONNÉES → si absentes
    // ------------------------------
    if (!store.lat || !store.lon) {
      console.log(`📍 Géocodage → ${store.address}`);
      const { lat, lon } = await geocode(store.address);

      if (lat && lon) {
        updatePayload.lat = lat;
        updatePayload.lon = lon;
        needsUpdate = true;
        console.log(`✅ Coordonnées ajoutées → ${store.name}`);
      } else {
        console.log(`❌ Impossible géocoder → ${store.name}`);
      }

      // Pause anti-ban
      await new Promise(r => setTimeout(r, 1000));
    }

    // ------------------------------
    // Mise à jour Firestore
    // ------------------------------
    if (needsUpdate) {
      await updateDoc(ref, updatePayload);
      fixed++;
    }
  }

  console.log("\n====================================================");
  console.log("🎉 AUTO-FIX TERMINÉ !");
  console.log("Magasins mis à jour :", fixed);
  console.log("====================================================\n");
}

autoFixStores();