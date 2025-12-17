import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Récupère l'historique utilisateur et le formate pour l'IA
 */
export const getUserBudgetContext = async (userId) => {
  if (!db) return "L'utilisateur n'a pas encore effectué de recherches.";
  const q = query(collection(db, 'history'), where('userId', '==', userId));
  const docs = await getDocs(q);
  const history = docs.docs.map((d) => d.data());

  if (history.length === 0)
    return "L'utilisateur n'a pas encore effectué de recherches.";

  const summary = history
    .map((h) => `• ${h.name} (${h.brand || 'Marque inconnue'}) — ${h.ean}`)
    .join('\n');

  return `Historique utilisateur (${history.length} éléments) :\n${summary}`;
};

/**
 * Simule une requête IA locale (en attendant backend Cloud Function GPT)
 */
export const generateBudgetAdvice = async (context) => {
  // Simule une IA avec logique simplifiée
  if (context.includes('Pain')) {
    return 'Pensez à acheter le pain en lot de 2 pour économiser 10% dans la plupart des enseignes.';
  }
  if (context.includes('Jus')) {
    return "Le jus d'orange Tropicana est souvent 20% plus cher que le Jus Caraïbos local.";
  }
  return 'Comparez les marques locales pour réduire vos dépenses alimentaires de 8 à 12%.';
};
