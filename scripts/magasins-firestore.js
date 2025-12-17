// magasins-firestore.js — Google Maps × Firestore

import { getDB } from '../firebase-config.js';

/**
 * Récupère tous les magasins du territoire
 * Ex: "guadeloupe", "martinique", "guyane", "reunion", "mayotte", "france"
 */
export async function getStoresByTerritory(territory) {
  console.log('🔎 Firestore → getStoresByTerritory :', territory);

  const db = await getDB();

  const {
    collection,
    query,
    where,
    getDocs,
  } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');

  const storesRef = collection(db, 'stores');

  // Filtrer par territoire en MINUSCULES
  const q = query(storesRef, where('territory', '==', territory.toLowerCase()));

  const snapshot = await getDocs(q);

  const stores = [];

  snapshot.forEach((doc) => {
    const data = doc.data();

    // Sécurité : ignorer les magasins sans coordonnées
    if (!data.lat || !data.lon) {
      console.warn('⛔ Magasin ignoré (coordonnées manquantes) :', data.name);
      return;
    }

    stores.push({
      id: doc.id,
      ...data,
    });
  });

  console.log(`📦 ${stores.length} magasins chargés pour ${territory}`);

  return stores;
}

/**
 * Optionnel — récupère 1 magasin par ID
 */
export async function getStoreById(id) {
  const db = await getDB();

  const { doc, getDoc } = await import(
    'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js'
  );

  const ref = doc(db, 'stores', id);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return snap.data();
}
