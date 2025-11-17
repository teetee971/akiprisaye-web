/**
 * promotions-firestore.js
 *
 * Gestion des promotions dans Firestore.
 * Collection utilisée : "promotions"
 *
 * Exemple de document dans "promotions" :
 *  - storeName: "Carrefour Destrellan"
 *  - territory: "guadeloupe"
 *  - title: "Promo -10% sur les fruits"
 *  - description: "Offre valable jusqu'au 30/11"
 *  - discountType: "percent" | "fixed"
 *  - discountValue: 10
 *  - lat: 16.241
 *  - lon: -61.583
 *  - active: true
 *  - tags: ["fruits", "bio"]
 *  - estimatedSaving: 5.5   // en euros, optionnel
 */

import { getDB } from '../firebase-config.js';
import {
  collection,
  getDocs,
  query,
  where,
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

/**
 * Transforme un document Firestore en objet promo propre.
 */
function normalizePromo(docSnap) {
  const data = docSnap.data() || {};
  return {
    id: docSnap.id,
    storeName: data.storeName || data.name || 'Magasin',
    title: data.title || 'Promotion intéressante',
    description: data.description || '',
    territory: (data.territory || 'guadeloupe').toLowerCase(),
    discountType: data.discountType || 'percent',
    discountValue: typeof data.discountValue === 'number' ? data.discountValue : 0,
    lat: typeof data.lat === 'number' ? data.lat : null,
    lon: typeof data.lon === 'number' ? data.lon : null,
    active: data.active !== false,
    tags: Array.isArray(data.tags) ? data.tags : [],
    estimatedSaving: typeof data.estimatedSaving === 'number' ? data.estimatedSaving : null,
  };
}

/**
 * Retourne le libellé lisible de l'économie.
 */
function getSavingLabel(promo) {
  if (promo.estimatedSaving && promo.estimatedSaving > 0) {
    return `≈ ${promo.estimatedSaving.toFixed(2)} € d'économie`;
  }
  if (promo.discountType === 'percent' && promo.discountValue > 0) {
    return `-${promo.discountValue}%`;
  }
  if (promo.discountType === 'fixed' && promo.discountValue > 0) {
    return `-${promo.discountValue} €`;
  }
  return 'Économie intéressante';
}

/**
 * Charge les promotions actives pour un territoire donné.
 * @param {string} territory - ex: "guadeloupe"
 * @returns {Promise<Array>}
 */
export async function fetchActivePromotions(territory = 'guadeloupe') {
  const db = await getDB();
  const colRef = collection(db, 'promotions');

  // Normalisation du territoire
  const t = territory.toLowerCase();

  const q = query(
    colRef,
    where('active', '==', true),
    where('territory', '==', t),
  );

  const snap = await getDocs(q);
  const promos = [];

  snap.forEach((docSnap) => {
    const promo = normalizePromo(docSnap);
    if (promo.lat !== null && promo.lon !== null) {
      promo.savingLabel = getSavingLabel(promo);
      promos.push(promo);
    }
  });

  return promos;
}

/**
 * Fonction utilitaire pour débogage dans la console :
 * window.debugListPromos()
 */
export async function debugListPromos() {
  const promos = await fetchActivePromotions('guadeloupe');
  console.table(
    promos.map((p) => ({
      id: p.id,
      store: p.storeName,
      title: p.title,
      saving: p.savingLabel,
      lat: p.lat,
      lon: p.lon,
    })),
  );
  return promos;
}

// Pour pouvoir appeler depuis la console du navigateur
if (typeof window !== 'undefined') {
  window.debugListPromos = debugListPromos;
}