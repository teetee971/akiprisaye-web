/**
 * batimentSuggestionsService.ts
 *
 * Gestion des suggestions utilisateurs pour le Calculateur du Bâtiment.
 *
 * Collection Firestore : suggestions_batiment
 * Document :
 *   message         string        suggestion libre de l'utilisateur
 *   category        string        'nouveau_calculateur' | 'amelioration' | 'materiau' | 'magasin' | 'autre'
 *   calcType        string|null   calculateur concerné (optionnel)
 *   territory       string|null   'GP' | 'MQ' | 'RE' | 'GF' | 'YT' | null
 *   status          string        'new' | 'in_review' | 'accepted' | 'rejected' | 'done'
 *   adminNote       string|null   note admin (optionnel)
 *   userId          string        uid Firebase ou 'anonymous'
 *   sessionId       string        uuid navigateur
 *   createdAt       Timestamp
 *   updatedAt       Timestamp
 */

import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

const COLLECTION = 'suggestions_batiment';

// ── Types ─────────────────────────────────────────────────────────────────────

export type SuggestionCategory =
  | 'nouveau_calculateur'
  | 'amelioration'
  | 'materiau'
  | 'magasin'
  | 'autre';

export type SuggestionStatus = 'new' | 'in_review' | 'accepted' | 'rejected' | 'done';

export interface BatimentSuggestion {
  id: string;
  message: string;
  category: SuggestionCategory;
  calcType: string | null;
  territory: string | null;
  status: SuggestionStatus;
  adminNote: string | null;
  userId: string;
  sessionId: string;
  createdAt: { seconds: number; nanoseconds: number } | null;
  updatedAt: { seconds: number; nanoseconds: number } | null;
}

export interface NewSuggestionPayload {
  message: string;
  category: SuggestionCategory;
  calcType: string | null;
  territory: string | null;
  sessionId: string;
}

// ── Labels ────────────────────────────────────────────────────────────────────

export const SUGGESTION_CATEGORY_LABELS: Record<SuggestionCategory, string> = {
  nouveau_calculateur: '🧱 Nouveau calculateur',
  amelioration: '🔧 Amélioration',
  materiau: '📦 Nouveau matériau / produit',
  magasin: '🏪 Magasin manquant',
  autre: '💬 Autre',
};

export const SUGGESTION_STATUS_LABELS: Record<SuggestionStatus, string> = {
  new: '🆕 Nouveau',
  in_review: '🔍 En examen',
  accepted: '✅ Accepté',
  rejected: '❌ Refusé',
  done: '🚀 Intégré',
};

export const SUGGESTION_STATUS_COLORS: Record<SuggestionStatus, string> = {
  new: 'bg-blue-900/30 text-blue-300 border-blue-500/30',
  in_review: 'bg-yellow-900/30 text-yellow-300 border-yellow-500/30',
  accepted: 'bg-green-900/30 text-green-300 border-green-500/30',
  rejected: 'bg-red-900/30 text-red-300 border-red-500/30',
  done: 'bg-indigo-900/30 text-indigo-300 border-indigo-500/30',
};

// ── Current user (lazy) ───────────────────────────────────────────────────────

function getCurrentUserId(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getAuth } = require('firebase/auth') as typeof import('firebase/auth');
    return getAuth().currentUser?.uid ?? 'anonymous';
  } catch {
    return 'anonymous';
  }
}

// ── Write ─────────────────────────────────────────────────────────────────────

export async function submitBatimentSuggestion(
  payload: NewSuggestionPayload
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!db) return { success: false, error: 'Firebase non disponible' };
  try {
    const ref = await addDoc(collection(db, COLLECTION), {
      ...payload,
      status: 'new' as SuggestionStatus,
      adminNote: null,
      userId: getCurrentUserId(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { success: true, id: ref.id };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

// ── Admin: update status ──────────────────────────────────────────────────────

export async function updateSuggestionStatus(
  id: string,
  status: SuggestionStatus,
  adminNote?: string
): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, COLLECTION, id), {
    status,
    adminNote: adminNote ?? null,
    updatedAt: serverTimestamp(),
  });
}

// ── Read (admin) ──────────────────────────────────────────────────────────────

export async function getAllBatimentSuggestions(): Promise<BatimentSuggestion[]> {
  if (!db) return [];
  try {
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as BatimentSuggestion);
  } catch {
    return [];
  }
}
