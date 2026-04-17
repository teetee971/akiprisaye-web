/**
 * lettreJourService.ts — Service Firestore pour la Lettre Journalière IA
 *
 * Collection Firestore : lettre_jour_ia
 *   Document ID : dayId (ex : "2026-03-10")
 *
 * Chaque document contient le briefing quotidien généré par l'IA (GPT-4o-mini)
 * à partir des flux RSS des médias DOM/COM du jour.
 *
 * Règles Firestore requises :
 *   match /lettre_jour_ia/{dayId} {
 *     allow read: if true;
 *     allow write: if false;  // écriture uniquement via Admin SDK (GitHub Actions)
 *   }
 */

import { collection, doc, getDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface LettreJourSection {
  titre: string;
  territoire: string;
  contenu: string;
  sources: string[];
}

export interface LettreJourIndicateur {
  valeur: string;
  label: string;
  territoire: string;
}

export interface LettreJourSourceArticle {
  title: string;
  url: string;
  source: string;
  territory: string;
  publishedAt: string;
}

export interface LettreJour {
  dayId: string;
  date: string;
  titre: string;
  chapeau: string;
  sections: LettreJourSection[];
  indicateurs: LettreJourIndicateur[];
  tags: string[];
  sourcesArticles: LettreJourSourceArticle[];
  model: string;
  tokensUsed?: number;
  generatedAt: string;
  status: 'published' | 'draft';
}

// ─── Collection ────────────────────────────────────────────────────────────────

const COLLECTION = 'lettre_jour_ia';

// ─── Fonctions publiques ────────────────────────────────────────────────────────

/**
 * Récupère la lettre journalière la plus récente.
 * Retourne null si Firestore n'est pas configuré ou si aucune lettre n'existe.
 */
export async function getLatestLettreJour(): Promise<LettreJour | null> {
  if (!db) return null;
  try {
    const q = query(collection(db, COLLECTION), orderBy('generatedAt', 'desc'), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data() as LettreJour;
  } catch {
    return null;
  }
}

/**
 * Récupère une lettre par son identifiant de jour (ex : "2026-03-10").
 */
export async function getLettreJourByDay(dayId: string): Promise<LettreJour | null> {
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, COLLECTION, dayId));
    if (!snap.exists()) return null;
    return snap.data() as LettreJour;
  } catch {
    return null;
  }
}

/**
 * Récupère les N dernières lettres journalières (pour l'archive).
 */
export async function getRecentLettresJour(count = 30): Promise<LettreJour[]> {
  if (!db) return [];
  try {
    const q = query(collection(db, COLLECTION), orderBy('generatedAt', 'desc'), limit(count));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as LettreJour);
  } catch {
    return [];
  }
}
