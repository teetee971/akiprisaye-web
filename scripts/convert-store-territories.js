/**
 * SCRIPT : Convertir automatiquement les territoires des magasins
 * Objectif : uniformiser les données Firestore pour la carte
 * Collection cible : stores
 */

import { getDB } from '../firebase-config.js';

async function normalizeTerritories() {
  console.log('🚀 Normalisation des territoires dans Firestore…');

  const db = await getDB();
  const { collection, getDocs, updateDoc, doc } = await import(
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
  );

  const storesRef = collection(db, 'stores');
  const snap = await getDocs(storesRef);

  if (snap.empty) {
    console.warn('⚠️ Aucun magasin trouvé dans Firestore.');
    return;
  }

  let count = 0;

  for (const d of snap.docs) {
    const data = d.data();
    const storeId = d.id;

    let territory = data.territory || '';
    const original = territory;

    // --- Normalisation des territoires
    territory = territory.trim().toLowerCase();

    // Corrections intelligentes
    if (territory.includes('guadel')) territory = 'guadeloupe';
    if (territory.includes('martin')) territory = 'martinique';
    if (territory.includes('guyane') || territory.includes('guyana'))
      territory = 'guyane';
    if (territory.includes('réunion') || territory.includes('la réunion'))
      territory = 'reunion';
    if (territory.includes('mayotte')) territory = 'mayotte';

    // Si aucun match -> rester en lowercase
    if (!territory) territory = 'guadeloupe';

    // Mise à jour Firestore si changement détecté
    if (territory !== original) {
      await updateDoc(doc(db, 'stores', storeId), { territory });
      console.log(`✔️ ${storeId} — Territory corrigé : ${original} → ${territory}`);
      count++;
    }
  }

  console.log(`🎉 Normalisation terminée. ${count} magasins mis à jour.`);
}

// Lancement automatique
normalizeTerritories();