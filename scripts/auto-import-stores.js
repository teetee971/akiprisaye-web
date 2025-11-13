/**
 * AUTO-IMPORT STORES GUADELOUPE
 * Importation automatique dans Firestore (collection: stores)
 * Compatible Cloudflare Pages / Browser / Lazy Loading Firebase
 */

import { getDB } from "../firebase-config.js";

/** LISTE DES MAGASINS DE GUADELOUPE */
const storesList = [
  {
    name: "Super U Bas-du-Fort",
    address: "Bas-du-Fort, Le Gosier, Guadeloupe",
    chain: "Super U",
    phone: "0590 99 99 99"
  },
  {
    name: "Carrefour Destrellan",
    address: "Destrellan, Baie-Mahault, Guadeloupe",
    chain: "Carrefour",
    phone: "0590 26 92 92"
  },
  {
    name: "Carrefour Market Saint-François",
    address: "Saint-François, Guadeloupe",
    chain: "Carrefour Market",
    phone: ""
  },
  {
    name: "Ecomax Bergevin",
    address: "Bergevin, Pointe-à-Pitre, Guadeloupe",
    chain: "Ecomax",
    phone: ""
  },
  {
    name: "Ecomax Lauricisque",
    address: "Lauricisque, Pointe-à-Pitre, Guadeloupe",
    chain: "Ecomax",
    phone: ""
  },
  {
    name: "Leader Price Besson",
    address: "Besson, Le Gosier, Guadeloupe",
    chain: "Leader Price",
    phone: ""
  },
  {
    name: "Leader Price Mornalot",
    address: "Mornalot, Sainte-Anne, Guadeloupe",
    chain: "Leader Price",
    phone: ""
  },
  {
    name: "Géant Casino Dothémare",
    address: "Dothémare, Les Abymes, Guadeloupe",
    chain: "Géant Casino",
    phone: ""
  }
];

/** GEO-CODAGE — API Nominatim (OpenStreetMap) */
async function geocode(address) {
  console.log("Géocodage :", address);

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;

  try {
    const res = await fetch(url, {
      headers: {
        "Accept-Language": "fr",
        "User-Agent": "akiprisaye-web/1.0 (+https://github.com/teetee971/akiprisaye-web)"
      }
    });

    const data = await res.json();
    if (!data[0]) return { lat: null, lon: null };

    return {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon)
    };
  } catch (e) {
    console.error("Erreur géocode:", e);
    return { lat: null, lon: null };
  }
}

/** IMPORT AUTOMATIQUE DANS FIRESTORE */
async function autoImport() {
  console.log("🚀 Importation automatique dans Firestore…");

  const db = await getDB();
  const { collection, doc, setDoc } = await import(
    "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"
  );

  for (let store of storesList) {
    // --- Géocodage (correction : geocode)
    const { lat, lon } = await geocode(store.address);

    if (lat === null || lon === null) {
      console.warn(`Géocodage non trouvé pour: ${store.address}`);
    }

    // --- Création d'un document automatique
    const ref = doc(collection(db, "stores"));

    await setDoc(ref, {
      name: store.name,
      address: store.address,
      chain: store.chain,
      phone: store.phone,
      lat,
      lon,
      openingHours: "08:00 - 20:00",
      territory: "guadeloupe"
    });

    console.log("✅ Ajouté :", store.name);

    // 🔥 Pause anti-ban (1 seconde)
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log("🎉 IMPORT TERMINÉ !");
}

// Lancer automatiquement
autoImport();
