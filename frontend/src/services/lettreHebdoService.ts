/**
 * lettreHebdoService.ts — Service Firestore pour la Lettre Hebdomadaire IA
 *
 * Collection Firestore : lettre_hebdo_ia
 *   Document ID : weekId (ex : "2026-W10")
 *
 * Chaque document contient l'éditorial généré par l'IA (GPT-4o-mini)
 * à partir des flux RSS des médias DOM/COM de la semaine.
 *
 * Règles Firestore requises :
 *   match /lettre_hebdo_ia/{weekId} {
 *     allow read: if true;
 *     allow write: if false;  // écriture uniquement via Admin SDK (GitHub Actions)
 *   }
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface LettreSection {
  titre: string;
  territoire: string;
  contenu: string;
  sources: string[];
}

export interface LettreIndicateur {
  valeur: string;
  label: string;
  territoire: string;
}

export interface LettreSourceArticle {
  title: string;
  url: string;
  source: string;
  territory: string;
  publishedAt: string;
}

export interface LettreHebdo {
  weekId: string;
  periode: string;
  titre: string;
  chapeau: string;
  sections: LettreSection[];
  indicateurs: LettreIndicateur[];
  tags: string[];
  sourcesArticles: LettreSourceArticle[];
  model: string;
  tokensUsed?: number;
  generatedAt: string;
  status: 'published' | 'draft';
}

// ─── Collection ────────────────────────────────────────────────────────────────

const COLLECTION = 'lettre_hebdo_ia';

// ─── Fonctions publiques ────────────────────────────────────────────────────────

/**
 * Récupère la lettre la plus récente.
 * Retourne null si Firestore n'est pas configuré ou si aucune lettre n'existe.
 */
export async function getLatestLettre(): Promise<LettreHebdo | null> {
  if (!db) return null;
  try {
    const q = query(
      collection(db, COLLECTION),
      orderBy('generatedAt', 'desc'),
      limit(1),
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data() as LettreHebdo;
  } catch {
    return null;
  }
}

/**
 * Récupère une lettre par son identifiant de semaine (ex : "2026-W10").
 */
export async function getLettreByWeek(weekId: string): Promise<LettreHebdo | null> {
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, COLLECTION, weekId));
    if (!snap.exists()) return null;
    return snap.data() as LettreHebdo;
  } catch {
    return null;
  }
}

/**
 * Récupère les N dernières lettres (pour l'archive).
 */
export async function getRecentLettres(count = 12): Promise<LettreHebdo[]> {
  if (!db) return [];
  try {
    const q = query(
      collection(db, COLLECTION),
      orderBy('generatedAt', 'desc'),
      limit(count),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as LettreHebdo);
  } catch {
    return [];
  }
}
