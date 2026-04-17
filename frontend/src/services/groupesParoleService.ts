/**
 * Groupes de Parole Citoyens — Service Firestore
 *
 * Stockage Firestore :
 *   groupes_parole/{groupId}
 *     territory:    string          (TerritoryCode)
 *     name:         string
 *     description:  string
 *     createdBy:    string          (UID)
 *     createdByName: string
 *     createdAt:    Timestamp
 *     memberCount:  number
 *     members:      string[]        (UIDs)
 *
 *   groupes_parole/{groupId}/messages/{msgId}
 *     from:         string          (UID)
 *     fromName:     string
 *     text:         string
 *     photoUrl:     string | null
 *     at:           Timestamp
 *     flagged:      boolean         (AI/manual moderation)
 *     flagReason:   string | null
 */

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { TerritoryCode } from '../constants/territories';
import { moderateText } from '../utils/textModeration';

// Re-export so existing callers (page + tests) can import from one place
export { moderateText };

// ── Types ──────────────────────────────────────────────────────────────────────

export interface GroupParole {
  id: string;
  territory: TerritoryCode;
  name: string;
  description: string;
  createdBy: string;
  createdByName: string;
  createdAt: Timestamp | null;
  memberCount: number;
  members: string[];
}

export interface GroupMessage {
  id: string;
  from: string;
  fromName: string;
  text: string;
  photoUrl: string | null;
  at: Timestamp | null;
  flagged: boolean;
  flagReason: string | null;
}

// ── Moderation ─────────────────────────────────────────────────────────────────

// ── Helpers ────────────────────────────────────────────────────────────────────

function checkDb(): void {
  if (!db) throw new Error('Firebase non initialisé — groupes de parole indisponibles');
}

// ── API ────────────────────────────────────────────────────────────────────────

/**
 * Créer un nouveau groupe de parole.
 */
export async function createGroup(
  territory: TerritoryCode,
  name: string,
  description: string,
  uid: string,
  displayName: string
): Promise<string> {
  checkDb();
  const ref = await addDoc(collection(db!, 'groupes_parole'), {
    territory,
    name: name.trim(),
    description: description.trim(),
    createdBy: uid,
    createdByName: displayName,
    createdAt: serverTimestamp(),
    memberCount: 1,
    members: [uid],
  });
  return ref.id;
}

/**
 * Rejoindre un groupe.
 */
export async function joinGroup(groupId: string, uid: string): Promise<void> {
  checkDb();
  await updateDoc(doc(db!, 'groupes_parole', groupId), {
    members: arrayUnion(uid),
    memberCount: increment(1),
  });
}

/**
 * Quitter un groupe.
 */
export async function leaveGroup(groupId: string, uid: string): Promise<void> {
  checkDb();
  await updateDoc(doc(db!, 'groupes_parole', groupId), {
    members: arrayRemove(uid),
    memberCount: increment(-1),
  });
}

/**
 * S'abonner en temps réel à tous les groupes d'un territoire.
 * Si territory est null, retourne tous les groupes actifs (limité à 50).
 */
export function subscribeToGroups(
  territory: TerritoryCode | null,
  onUpdate: (groups: GroupParole[]) => void
): Unsubscribe {
  if (!db) {
    onUpdate([]);
    return () => {};
  }

  const baseQuery = territory
    ? query(
        collection(db, 'groupes_parole'),
        where('territory', '==', territory),
        orderBy('createdAt', 'desc'),
        limit(50)
      )
    : query(collection(db, 'groupes_parole'), orderBy('createdAt', 'desc'), limit(50));

  return onSnapshot(baseQuery, (snap) => {
    const groups: GroupParole[] = snap.docs.map((d) => ({
      id: d.id,
      territory: d.data().territory ?? 'gp',
      name: d.data().name ?? '',
      description: d.data().description ?? '',
      createdBy: d.data().createdBy ?? '',
      createdByName: d.data().createdByName ?? '',
      createdAt: d.data().createdAt ?? null,
      memberCount: d.data().memberCount ?? 0,
      members: d.data().members ?? [],
    }));
    onUpdate(groups);
  });
}

/**
 * Récupérer les groupes d'un territoire (lecture unique).
 */
export async function getGroupsByTerritory(territory: TerritoryCode): Promise<GroupParole[]> {
  if (!db) return [];
  const q = query(
    collection(db, 'groupes_parole'),
    where('territory', '==', territory),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    territory: d.data().territory ?? territory,
    name: d.data().name ?? '',
    description: d.data().description ?? '',
    createdBy: d.data().createdBy ?? '',
    createdByName: d.data().createdByName ?? '',
    createdAt: d.data().createdAt ?? null,
    memberCount: d.data().memberCount ?? 0,
    members: d.data().members ?? [],
  }));
}

/**
 * Envoyer un message dans un groupe (texte + photo optionnelle).
 * Applique la modération automatique avant stockage.
 */
export async function sendGroupMessage(
  groupId: string,
  uid: string,
  displayName: string,
  text: string,
  photoUrl?: string
): Promise<void> {
  checkDb();
  const trimmed = text.trim();
  if (!trimmed && !photoUrl) return;

  const flagReason = trimmed ? moderateText(trimmed) : null;

  await addDoc(collection(db!, 'groupes_parole', groupId, 'messages'), {
    from: uid,
    fromName: displayName,
    text: trimmed,
    photoUrl: photoUrl ?? null,
    at: serverTimestamp(),
    flagged: flagReason !== null,
    flagReason,
  });
}

/**
 * S'abonner en temps réel aux messages d'un groupe.
 * Les messages flaggés sont inclus (filtrés côté UI si besoin).
 */
export function subscribeToGroupMessages(
  groupId: string,
  onUpdate: (msgs: GroupMessage[]) => void
): Unsubscribe {
  if (!db) {
    onUpdate([]);
    return () => {};
  }

  const q = query(
    collection(db, 'groupes_parole', groupId, 'messages'),
    orderBy('at', 'asc'),
    limit(200)
  );

  return onSnapshot(q, (snap) => {
    const msgs: GroupMessage[] = snap.docs.map((d) => ({
      id: d.id,
      from: d.data().from ?? '',
      fromName: d.data().fromName ?? 'Utilisateur',
      text: d.data().text ?? '',
      photoUrl: d.data().photoUrl ?? null,
      at: d.data().at ?? null,
      flagged: d.data().flagged ?? false,
      flagReason: d.data().flagReason ?? null,
    }));
    onUpdate(msgs);
  });
}

/**
 * Signaler manuellement un message comme inapproprié.
 */
export async function flagMessage(groupId: string, msgId: string, reason: string): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, 'groupes_parole', groupId, 'messages', msgId), {
    flagged: true,
    flagReason: reason,
  });
}
