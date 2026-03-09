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
function getSessionId(): string {
  if (!_sessionId) {
    _sessionId =
      (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
        ? crypto.randomUUID()
        : `sess-${Date.now()}-${Math.random().toString(36).slice(2)}`;
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
      orderBy('createdAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as BatimentCalcRecord));
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
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as BatimentCalcRecord));
  } catch {
    return [];
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export const CALC_TYPE_LABELS: Record<string, string> = {
  'parpaing':        'Parpaing / Bloc US',
  'dalle-beton':     'Dalle béton',
  'fondations':      'Fondations',
  'chape':           'Chape de sol',
  'carrelage':       'Carrelage',
  'peinture':        'Peinture',
  'enduit':          'Enduit / Crépissage',
  'toles':           'Tôles de couverture',
  'terrassement':    'Terrassement',
  'cloture':         'Clôture',
  'beton-courant':   'Béton courant',
  'escalier':        'Escalier',
};

export const TERRITORY_LABELS: Record<string, string> = {
  GP: '🇬🇵 Guadeloupe',
  MQ: '🇲🇶 Martinique',
  RE: '🇷🇪 La Réunion',
  GF: '🇬🇫 Guyane',
  YT: '🇾🇹 Mayotte',
};
