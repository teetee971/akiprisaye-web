/**
 * batimentCalculService.ts
 *
 * Stockage Firestore de chaque calcul effectué dans le Calculateur du Bâtiment.
 *
 * Collection Firestore : calculs_batiment
 * Document :
 *   calculatorType  string        'parpaing' | 'dalle-beton' | ...
 *   category        string        'gros-oeuvre' | 'finitions' | ...
 *   territory       string|null   'GP' | 'MQ' | 'RE' | 'GF' | 'YT' | null
 *   trialDay        number|null   jour de l'essai (1–7) ou null
 *   inputs          object        valeurs brutes du formulaire
 *   results         object        valeurs calculées
 *   materials       array         [{ productId, qty }]
 *   totalEstimate   number|null   estimation coût (€) si devis magasin dispo
 *   bestStoreName   string|null   magasin le moins cher
 *   userId          string        uid Firebase ou 'anonymous'
 *   sessionId       string        uuid de session navigateur
 *   createdAt       Timestamp     serverTimestamp()
 */

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { MaterialNeed } from '@/data/batimentStoresData';

const COLLECTION = 'calculs_batiment';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BatimentSaveData {
  calcType: string;
  inputs: object;
  results: object;
  materials: MaterialNeed[];
  totalEstimate?: number | null;
  bestStoreName?: string | null;
}

interface BatimentCalcPayload extends BatimentSaveData {
  territory: string | null;
  trialDay: number | null;
}

export interface BatimentCalcRecord extends BatimentCalcPayload {
  id: string;
  userId: string;
  sessionId: string;
  createdAt: { seconds: number; nanoseconds: number } | null;
}

// ── Session ID (per browser tab, not persisted) ───────────────────────────────

let _sessionId: string | null = null;
let _sessionCounter = 0;
function getSessionId(): string {
  if (!_sessionId) {
    // Prefer native crypto.randomUUID when available
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      _sessionId = crypto.randomUUID();
    } else if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      // Fallback: generate a UUID-like value from cryptographically secure random bytes
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      // Per RFC 4122 v4 layout
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
      _sessionId = [
        hex.slice(0, 8),
        hex.slice(8, 12),
        hex.slice(12, 16),
        hex.slice(16, 20),
        hex.slice(20),
      ].join('-');
    } else {
      // Last-resort, non-cryptographic fallback (no Math.random to avoid insecure randomness)
      _sessionId = `sess-${Date.now()}-${_sessionCounter++}`;
    }
  }
  return _sessionId;
}

// ── Current user (lazy, no React dependency) ──────────────────────────────────

function getCurrentUserId(): string {
  try {
    // Firebase Auth is lazy-imported to avoid circular deps
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getAuth } = require('firebase/auth') as typeof import('firebase/auth');
    return getAuth().currentUser?.uid ?? 'anonymous';
  } catch {
    return 'anonymous';
  }
}

// ── Write ─────────────────────────────────────────────────────────────────────

/**
 * Enregistre un calcul dans Firestore.
 * Fire-and-forget — les erreurs sont silencieuses pour ne pas bloquer l'UI.
 */
export async function saveBatimentCalculation(payload: BatimentCalcPayload): Promise<void> {
  if (!db) return;
  try {
    await addDoc(collection(db, COLLECTION), {
      ...payload,
      userId: getCurrentUserId(),
      sessionId: getSessionId(),
      createdAt: serverTimestamp(),
    });
  } catch {
    // silent — non bloquant
  }
}

// ── Read (user) ───────────────────────────────────────────────────────────────

export async function getMyBatimentCalculations(): Promise<BatimentCalcRecord[]> {
  if (!db) return [];
  try {
    const userId = getCurrentUserId();
    const q = query(
      collection(db, COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as BatimentCalcRecord);
  } catch {
    return [];
  }
}

// ── Read (admin) ──────────────────────────────────────────────────────────────

export async function getAllBatimentCalculations(): Promise<BatimentCalcRecord[]> {
  if (!db) return [];
  try {
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as BatimentCalcRecord);
  } catch {
    return [];
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export const CALC_TYPE_LABELS: Record<string, string> = {
  // ── Gros œuvre ──
  parpaing: 'Parpaing / Bloc US',
  'dalle-beton': 'Dalle béton',
  fondations: 'Fondations',
  chape: 'Chape de sol',
  // ── Finitions ──
  carrelage: 'Carrelage',
  peinture: 'Peinture',
  enduit: 'Enduit / Crépissage',
  // ── Extérieur ──
  toles: 'Tôles de couverture',
  terrassement: 'Terrassement',
  cloture: 'Clôture',
  // ── Outils ──
  'beton-courant': 'Béton courant',
  escalier: 'Escalier',
  // ── Électricité & Plomberie ──
  electricite: 'Section câble électrique',
  plomberie: 'Tuyauterie / Plomberie',
  isolation: 'Isolation thermique',
  charpente: 'Charpente bois',
  // ── Second œuvre & Aménagement ──
  platrerie: 'Plâtrerie / Plaques BA13',
  parquet: 'Parquet & Sols stratifiés',
  gouttiere: 'Gouttières & Descentes EP',
  menuiserie: 'Menuiserie extérieure',
};

export const TERRITORY_LABELS: Record<string, string> = {
  GP: '🇬🇵 Guadeloupe',
  MQ: '🇲🇶 Martinique',
  RE: '🇷🇪 La Réunion',
  GF: '🇬🇫 Guyane',
  YT: '🇾🇹 Mayotte',
};
