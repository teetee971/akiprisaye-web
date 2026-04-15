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
 *   - barcode?: string (omis si inconnu)
 *   - territory: string
 *   - price: number
 *   - pageUrl?: string (omis si window indisponible)
 *   - clickedAt: Timestamp
 *   - sessionId?: string (anonyme, généré côté client, non persisté)
 */

import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getApps, getApp } from 'firebase/app';

// Générer un sessionId anonyme (non persisté, non lié à l'utilisateur)
function getAnonymousSessionId(): string {
  const key = 'akp:session:anon';

  const generateId = (): string => {
    if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
      return `anon_${window.crypto.randomUUID()}`;
    }
    if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
      const bytes = new Uint8Array(16);
      window.crypto.getRandomValues(bytes);
      const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
      return `anon_${hex}`;
    }
    return `anon_${Date.now()}`;
  };

  try {
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;
    const id = generateId();
    sessionStorage.setItem(key, id);
    return id;
  } catch {
    return generateId();
  }
}

export interface FirestoreClickEvent {
  retailer: string;
  barcode?: string;
  territory: string;
  price: number;
  pageUrl?: string;
}

/**
 * Envoie un événement de clic affilié vers Firestore.
 * Fire-and-forget — ne throw jamais, ne bloque jamais l'UI.
 */
export function trackClickToFirestore(event: FirestoreClickEvent): void {
  // Ne pas awaiter — fire and forget
  void (async () => {
    try {
      if (!getApps().length) return;
      const db = getFirestore(getApp());
      const ref = collection(db, 'click_events');
      const pageUrl =
        typeof window !== 'undefined' && window.location.pathname
          ? window.location.pathname
          : event.pageUrl;
      const sessionId = getAnonymousSessionId();
      await addDoc(ref, {
        retailer: event.retailer,
        territory: event.territory,
        price: event.price,
        ...(event.barcode ? { barcode: event.barcode } : {}),
        ...(pageUrl ? { pageUrl } : {}),
        ...(sessionId ? { sessionId } : {}),
        clickedAt: serverTimestamp(),
      });
    } catch {
      // Silencieux — localStorage reste la source principale
    }
  })();
}
