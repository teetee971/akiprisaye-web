/**
 * Groupes de Parole Citoyens — Service Firestore
 *
 * Collection : groupes_parole
 *   {groupId}/
 *     title:       string
 *     territory:   string
 *     description: string
 *     createdAt:   Timestamp
 *     createdBy:   string  (uid)
 *     authorName:  string
 *
 *   {groupId}/messages/{msgId}
 *     text:        string
 *     authorUid:   string
 *     authorName:  string
 *     createdAt:   Timestamp
 */

import {
  collection,
  query,
  orderBy,
  limit,
  addDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface GroupeParole {
  id: string;
  title: string;
  territory: string;
  description: string;
  createdAt: Timestamp | null;
  createdBy: string;
  authorName: string;
}

export interface GroupeMessage {
  id: string;
  text: string;
  authorUid: string;
  authorName: string;
  createdAt: Timestamp | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function checkDb(): void {
  if (!db) throw new Error('Firebase non initialisé — groupes de parole indisponibles');
}

// ── Simple text moderation ─────────────────────────────────────────────────────

const BANNED_PATTERNS = [
  /\b(spam|pub|promo|bitcoin|crypto|casino)\b/i,
  /https?:\/\//i,
  /(.)\1{6,}/,
];

export function moderateText(text: string): { ok: boolean; reason?: string } {
  const t = text.trim();
  if (t.length < 5) return { ok: false, reason: 'Message trop court.' };
  if (t.length > 2000) return { ok: false, reason: 'Message trop long (max 2000 caractères).' };
  for (const p of BANNED_PATTERNS) {
    if (p.test(t)) return { ok: false, reason: 'Contenu non autorisé détecté.' };
  }
  return { ok: true };
}

// ── API ────────────────────────────────────────────────────────────────────────

/**
 * Create a new citizen speech group.
 */
export async function createGroupe(
  title: string,
  territory: string,
  description: string,
  authorUid: string,
  authorName: string,
): Promise<string> {
  checkDb();
  const titleCheck = moderateText(title);
  if (!titleCheck.ok) throw new Error(titleCheck.reason);
  const descCheck = moderateText(description);
  if (!descCheck.ok) throw new Error(descCheck.reason);

  const ref = await addDoc(collection(db!, 'groupes_parole'), {
    title: title.trim(),
    territory: territory.trim(),
    description: description.trim(),
    createdAt: serverTimestamp(),
    createdBy: authorUid,
    authorName,
  });
  return ref.id;
}

/**
 * Subscribe to all groups (ordered by creation date, newest first).
 */
export function subscribeToGroupes(
  onUpdate: (groups: GroupeParole[]) => void,
): Unsubscribe {
  if (!db) {
    onUpdate([]);
    return () => {};
  }
  const q = query(
    collection(db, 'groupes_parole'),
    orderBy('createdAt', 'desc'),
    limit(100),
  );
  return onSnapshot(q, (snap) => {
    const groups: GroupeParole[] = snap.docs.map((d) => ({
      id: d.id,
      title: d.data().title ?? '',
      territory: d.data().territory ?? '',
      description: d.data().description ?? '',
      createdAt: d.data().createdAt ?? null,
      createdBy: d.data().createdBy ?? '',
      authorName: d.data().authorName ?? '',
    }));
    onUpdate(groups);
  });
}

/**
 * Post a message in a group.
 */
export async function postMessage(
  groupId: string,
  text: string,
  authorUid: string,
  authorName: string,
): Promise<void> {
  checkDb();
  const check = moderateText(text);
  if (!check.ok) throw new Error(check.reason);

  await addDoc(collection(db!, 'groupes_parole', groupId, 'messages'), {
    text: text.trim(),
    authorUid,
    authorName,
    createdAt: serverTimestamp(),
  });
}

/**
 * Subscribe to messages in a group (ordered by creation date ascending).
 */
export function subscribeToMessages(
  groupId: string,
  onUpdate: (msgs: GroupeMessage[]) => void,
): Unsubscribe {
  if (!db) {
    onUpdate([]);
    return () => {};
  }
  const q = query(
    collection(db, 'groupes_parole', groupId, 'messages'),
    orderBy('createdAt', 'asc'),
    limit(200),
  );
  return onSnapshot(q, (snap) => {
    const msgs: GroupeMessage[] = snap.docs.map((d) => ({
      id: d.id,
      text: d.data().text ?? '',
      authorUid: d.data().authorUid ?? '',
      authorName: d.data().authorName ?? '',
      createdAt: d.data().createdAt ?? null,
    }));
    onUpdate(msgs);
  });
}

/**
 * Fetch all groups once (no real-time subscription).
 */
export async function fetchGroupes(): Promise<GroupeParole[]> {
  if (!db) return [];
  const q = query(
    collection(db, 'groupes_parole'),
    orderBy('createdAt', 'desc'),
    limit(100),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    title: d.data().title ?? '',
    territory: d.data().territory ?? '',
    description: d.data().description ?? '',
    createdAt: d.data().createdAt ?? null,
    createdBy: d.data().createdBy ?? '',
    authorName: d.data().authorName ?? '',
  }));
}
