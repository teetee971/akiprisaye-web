/**
 * ticket-user-history.js
 *
 * Analyse intelligente des tickets d'achat stockés dans Firestore
 * Permet d'améliorer les recommandations et les promos IA
 */

import { getDB } from '../firebase-config.js';
import {
  collection,
  query,
  where,
  getDocs,
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

/**
 * Récupère tous les tickets pour un utilisateur
 */
export async function getUserHistory(userId = 'anonymous') {
  const db = await getDB();
  const col = collection(db, 'purchaseHistory');

  const q = query(col, where('userId', '==', userId));
  const snap = await getDocs(q);

  const data = [];
  snap.forEach((doc) => data.push(doc.data()));
  return data;
}

/**
 * Analyse IA simple : trouve les catégories dominantes
 */
export function computePreferences(history) {
  const counts = {};

  history.forEach((ticket) => {
    ticket.items.forEach((item) => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
  });

  // Classement par fréquence
  const prefs = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, count]) => ({ category: cat, count }));

  return prefs;
}

/**
 * Recommandations personnalisées
 */
export function generateUserRecommendations(preferences) {
  if (!preferences.length) {
    return [
      "Aucune habitude détectée pour l'instant.",
      'Scanne quelques tickets pour obtenir des recommandations personnalisées.',
    ];
  }

  const top = preferences[0].category;

  switch (top) {
    case 'épicerie':
      return [
        "Vous achetez souvent de l'épicerie.",
        '→ Pensez à comparer les Ecomax, Leader Price et Carrefour Market.',
        '→ Des promotions épicerie sont disponibles dans votre zone.',
      ];

    case 'boisson':
      return [
        'Vous achetez beaucoup de boissons.',
        "→ Comparez Super U, Carrefour et Ecomax pour les packs d'eau.",
        '→ Des offres promo sont actives cette semaine.',
      ];

    case 'viande':
      return [
        'Vous achetez souvent de la viande.',
        '→ Les rayons boucherie U / Carrefour proposent souvent des remises.',
        '→ Vérifiez l’itinéraire promo pour les arrêts intelligents.',
      ];

    default:
      return [
        `Vous achetez souvent des produits de catégorie : ${top}.`,
        '→ De nouvelles promotions pourraient vous intéresser prochainement.',
      ];
  }
}

/**
 * Pipeline complet
 */
export async function buildUserProfile(userId = 'anonymous') {
  const history = await getUserHistory(userId);
  const prefs = computePreferences(history);
  const recommandations = generateUserRecommendations(prefs);

  return {
    userId,
    totalTickets: history.length,
    preferences: prefs,
    recommandations,
  };
}
