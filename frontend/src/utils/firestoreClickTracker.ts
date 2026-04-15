/**
 * firestoreClickTracker.ts
 *
 * Envoie les événements de clics affiliés vers Firestore pour
 * agrégation côté serveur (tableau de bord admin).
 *
 * - Fire-and-forget : ne bloque jamais l'UI
 * - Graceful fallback : si Firestore indisponible, silencieux
 * - Anonymisé : aucune donnée personnelle (pas d'IP, pas d'userId)
 * - RGPD : seulement retailer, produit, territoire, prix, timestamp
 *
 * Collection Firestore : `click_events`
 * Document auto-id avec champs :
 *   - retailer: string
 *   - barcode: string (peut être vide)
 *   - territory: string
 *   - price: number
 *   - pageUrl: string
 *   - clickedAt: Timestamp
 *   - sessionId: string (anonyme, généré côté client, non persisté)
 */

import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getApp } from 'firebase/app';

// Générer un suffixe aléatoire avec une source cryptographiquement sûre (navigateur)
function getSecureRandomSuffix(length = 7): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = new Uint8Array(length);
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
  }
  // Fallback défensif (ne devrait pas arriver en navigateur moderne)
  return `${Date.now().toString(36)}`.slice(-length);
}

// Générer un sessionId anonyme (non persisté, non lié à l'utilisateur)
function getAnonymousSessionId(): string {
  const key = 'akp:session:anon';
  try {
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;
    const id = `anon_${Date.now()}_${getSecureRandomSuffix(7)}`;
    sessionStorage.setItem(key, id);
    return id;
  } catch {
    return `anon_${Date.now()}_${getSecureRandomSuffix(7)}`;
  }
}

export interface FirestoreClickEvent {
  retailer: string;
  barcode: string;
  territory: string;
  price: number;
  pageUrl: string;
}

/**
 * Envoie un événement de clic affilié vers Firestore.
 * Fire-and-forget — ne throw jamais, ne bloque jamais l'UI.
 */
export function trackClickToFirestore(event: FirestoreClickEvent): void {
  // Ne pas awaiter — fire and forget
  void (async () => {
    try {
      const db = getFirestore(getApp());
      const ref = collection(db, 'click_events');
      await addDoc(ref, {
        ...event,
        sessionId: getAnonymousSessionId(),
        pageUrl: typeof window !== 'undefined' ? window.location.pathname : event.pageUrl,
        clickedAt: serverTimestamp(),
      });
    } catch {
      // Silencieux — localStorage reste la source principale
    }
  })();
}
