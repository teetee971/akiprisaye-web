import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { logError } from '../utils/logger';

export interface BudgetHistoryItem {
  name?: string;
  brand?: string;
  ean?: string;
}

/**
 * Récupère l'historique utilisateur depuis Firestore et le formate
 * pour être utilisé comme contexte par un moteur de conseils.
 */
export const getUserBudgetContext = async (userId: string): Promise<string> => {
  if (!db) return "L'utilisateur n'a pas encore effectué de recherches.";

  try {
    const q = query(collection(db, 'history'), where('userId', '==', userId));
    const docs = await getDocs(q);
    const history = docs.docs.map((d) => d.data() as BudgetHistoryItem);

    if (history.length === 0) {
      return "L'utilisateur n'a pas encore effectué de recherches.";
    }

    const summary = history
      .map((h) => `• ${h.name ?? '?'} (${h.brand ?? 'Marque inconnue'}) — ${h.ean ?? '?'}`)
      .join('\n');

    return `Historique utilisateur (${history.length} éléments) :\n${summary}`;
  } catch (error) {
    logError('getUserBudgetContext error', error);
    return "Impossible de récupérer l'historique utilisateur.";
  }
};

/**
 * Génère un conseil budgétaire basé sur le contexte fourni.
 *
 * NOTE — MODE DÉMONSTRATION : Cette implémentation retourne des conseils
 * génériques prédéfinis basés sur des mots-clés. Elle est conçue pour
 * illustrer le parcours utilisateur en attendant l'intégration d'un
 * vrai moteur IA (connexion LLM via le backend Cloud Function).
 * Les pourcentages indiqués sont des estimations indicatives, pas des
 * données issues d'observations réelles.
 */
export const generateBudgetAdvice = async (context: string): Promise<string> => {
  if (context.includes('Pain')) {
    return 'Pensez à acheter le pain en lot de 2 pour économiser environ 10% dans la plupart des enseignes.';
  }
  if (context.includes('Jus')) {
    return "Le jus d'orange Tropicana est souvent plus cher que les marques locales Caraïbos. Comparez les prix sur le comparateur.";
  }
  return 'Comparez les marques locales pour potentiellement réduire vos dépenses alimentaires. Utilisez le comparateur de prix pour vérifier les tarifs actuels.';
};
