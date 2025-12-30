// scripts/auto-import-stores.js
// Import automatique des magasins (Guadeloupe) dans Firestore
// + géocodage auto via Nominatim (OpenStreetMap)
// + IDs stables (pour éviter les doublons)
// ⚠ À utiliser depuis un navigateur (console ou page admin)

import { getDB } from '../firebase-config.js';

/**
 * Liste des magasins de Guadeloupe
 * Tu pourras l'enrichir à volonté (ajout d'autres enseignes / communes)
 */
const GUADELOUPE_STORES = [
  {
    name: 'Super U Bas-du-Fort',
    address: 'Bas-du-Fort, Le Gosier, Guadeloupe, France',
    chain: 'Super U',
    phone: '0590 99 99 99',
  },
  {
    name: 'Carrefour Destrellan',
    address: 'Centre Commercial Destrellan, Baie-Mahault, Guadeloupe, France',
    chain: 'Carrefour',
    phone: '0590 26 92 92',
  },
  {
    name: 'Carrefour Market Saint-François',
    address: 'Saint-François, Guadeloupe, France',
    chain: 'Carrefour Market',
    phone: '',
  },
  {
    name: 'Ecomax Bergevin',
    address: 'Bergevin, Pointe-à-Pitre, Guadeloupe, France',
    chain: 'Ecomax',
    phone: '',
  },
  {
    name: 'Ecomax Lauricisque',
    address: 'Lauricisque, Pointe-à-Pitre, Guadeloupe, France',
    chain: 'Ecomax',
    phone: '',
  },
  {
    name: 'Leader Price Besson',
    address: 'Besson, Le Gosier, Guadeloupe, France',
    chain: 'Leader Price',
    phone: '',
  },
  {
    name: 'Leader Price Mornalot',
    address: 'Mornalot, Sainte-Anne, Guadeloupe, France',
    chain: 'Leader Price',
    phone: '',
  },
  {
    name: 'Géant Casino Dothémare',
    address: 'ZAC de Dothémare, Les Abymes, Guadeloupe, France',
    chain: 'Géant Casino',
    phone: '',
  },
];

/**
 * Petit helper pour fabriquer un ID stable de document Firestore
 * Exemple : "guadeloupe-super-u-bas-du-fort"
 */
function buildStoreId(territory, name) {
  return (
    `${territory}-${name}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // enlève les accents
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  );
}

/**
 * Géocodage via API Nominatim (OpenStreetMap)
 * On respecte les règles : User-Agent personnalisé + limite de 1 requête / seconde
 */
async function geocode(address) {
  console.log('📍 Géocodage :', address);

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    address,
  )}&limit=1`;

  try {
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'fr',
        // User-Agent exigé par Nominatim
        'User-Agent': 'akiprisaye-web/1.0 (+https://github.com/teetee971/akiprisaye-web)',
      },
    });

    const data = await res.json();

    if (!data || !data[0]) {
      console.warn('⚠️ Aucune coordonnée trouvée pour :', address);
      return { lat: null, lon: null };
    }

    return {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
    };
  } catch (err) {
    console.error('❌ Erreur géocode :', err);
    return { lat: null, lon: null };
  }
}

/**
 * Import générique pour un territoire donné
 */
async function importStoresForTerritory(territory, stores) {
  console.log(`🚀 Import Firestore pour le territoire : ${territory}`);

  const db = await getDB();

  const {
    collection,
    doc,
    setDoc,
    serverTimestamp,
  } = await import(
    'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js'
  );

  for (const store of stores) {
    const normalizedTerritory = (store.territory || territory).toLowerCase();

    // 1) Géocodage
    const { lat, lon } = await geocode(store.address);

    if (lat === null || lon === null) {
      console.warn('⛔ Magasin ignoré (pas de coordonnées) :', store.name);
      // Pause 1s quand même pour respecter le rate-limit
      await new Promise((r) => setTimeout(r, 1000));
      continue;
    }

    // 2) ID stable → évite les doublons si tu relances le script
    const storeId = buildStoreId(normalizedTerritory, store.name);

    const ref = doc(collection(db, 'stores'), storeId);

    // 3) Écriture dans Firestore (merge: true pour mise à jour si existe déjà)
    await setDoc(
      ref,
      {
        name: store.name,
        address: store.address,
        chain: store.chain || '',
        phone: store.phone || '',
        lat,
        lon,
        territory: normalizedTerritory,
        openingHours: store.openingHours || '08:00 - 20:00',
        updatedAt: serverTimestamp(),
        source: 'auto-import-stores.js',
      },
      { merge: true },
    );

    console.log(`✅ Magasin enregistré : ${store.name} (${normalizedTerritory})`);

    // 4) Pause anti-ban (1 requête / seconde)
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log(`🎉 Import terminé pour ${territory} !`);
}

/**
 * Fonction publique principale pour la Guadeloupe
 * → C’est celle que tu appelles depuis la console ou une page admin.
 */
export async function autoImportGuadeloupeStores() {
  await importStoresForTerritory('guadeloupe', GUADELOUPE_STORES);
}

/**
 * Mode "auto" facultatif :
 * Si tu ouvres une page avec ?autoImport=guadeloupe dans l’URL,
 * le script se lance tout seul.
 *
 * Exemple :
 *   https://akiprisaye-web.pages.dev/admin-import.html?autoImport=guadeloupe
 */
const params = new URLSearchParams(window.location.search || '');
const auto = params.get('autoImport');

if (auto === 'guadeloupe') {
  autoImportGuadeloupeStores().catch((err) => {
    console.error('❌ Erreur auto-import Guadeloupe :', err);
  });
}
