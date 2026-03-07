/**
 * Messaging Service — Messagerie interne A KI PRI SA YÉ
 *
 * Stockage Firestore :
 *   conversations/{convId}
 *     participants:     string[]           (UIDs, toujours trié)
 *     participantNames: Record<uid, name>
 *     lastMessage:      string
 *     lastAt:           Timestamp
 *     unread:           Record<uid, number>
 *
 *   conversations/{convId}/messages/{msgId}
 *     from:    string   (UID)
 *     text:    string
 *     at:      Timestamp
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
  increment,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface Conversation {
  id: string;
  participants: string[];
  participantNames: Record<string, string>;
  lastMessage: string;
  lastAt: Timestamp | null;
  unread: Record<string, number>;
}

export interface Message {
  id: string;
  from: string;
  text: string;
  at: Timestamp | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function checkDb(): void {
  if (!db) throw new Error('Firebase non initialisé — messagerie indisponible');
}

// ── API ────────────────────────────────────────────────────────────────────────

/**
 * Retourne ou crée la conversation entre deux utilisateurs.
 */
export async function getOrCreateConversation(
  myUid: string,
  myName: string,
  otherUid: string,
  otherName: string,
): Promise<string> {
  checkDb();
  const sorted = [myUid, otherUid].sort();

  const convRef = collection(db!, 'conversations');
  const q = query(convRef, where('participants', '==', sorted));
  const snap = await getDocs(q);

  if (!snap.empty) {
    return snap.docs[0].id;
  }

  const newConv = await addDoc(convRef, {
    participants: sorted,
    participantNames: { [myUid]: myName, [otherUid]: otherName },
    lastMessage: '',
    lastAt: serverTimestamp(),
    unread: { [myUid]: 0, [otherUid]: 0 },
  });

  return newConv.id;
}

/**
 * Envoyer un message dans une conversation.
 */
export async function sendMessage(
  convId: string,
  fromUid: string,
  text: string,
  participants: string[],
): Promise<void> {
  checkDb();
  const trimmed = text.trim();
  if (!trimmed) return;

  // Ajouter le message dans la sous-collection
  await addDoc(collection(db!, 'conversations', convId, 'messages'), {
    from: fromUid,
    text: trimmed,
    at: serverTimestamp(),
  });

  // Mettre à jour le résumé + compteurs non lus pour les autres participants
  const updatePayload: Record<string, unknown> = {
    lastMessage: trimmed.slice(0, 120),
    lastAt: serverTimestamp(),
  };
  for (const uid of participants) {
    if (uid !== fromUid) {
      updatePayload[`unread.${uid}`] = increment(1);
    }
  }
  await updateDoc(doc(db!, 'conversations', convId), updatePayload);
}

/**
 * Marquer les messages d'une conversation comme lus pour un utilisateur.
 */
export async function markAsRead(convId: string, uid: string): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, 'conversations', convId), {
    [`unread.${uid}`]: 0,
  });
}

/**
 * S'abonner en temps réel aux conversations d'un utilisateur.
 * Retourne une fonction de désabonnement.
 */
export function subscribeToConversations(
  uid: string,
  onUpdate: (convs: Conversation[]) => void,
): Unsubscribe {
  if (!db) {
    onUpdate([]);
    return () => {};
  }

  const q = query(
    collection(db, 'conversations'),
    where('participants', 'array-contains', uid),
    orderBy('lastAt', 'desc'),
    limit(50),
  );

  return onSnapshot(q, (snap) => {
    const convs: Conversation[] = snap.docs.map((d) => ({
      id: d.id,
      participants: d.data().participants ?? [],
      participantNames: d.data().participantNames ?? {},
      lastMessage: d.data().lastMessage ?? '',
      lastAt: d.data().lastAt ?? null,
      unread: d.data().unread ?? {},
    }));
    onUpdate(convs);
  });
}

/**
 * S'abonner en temps réel aux messages d'une conversation.
 * Retourne une fonction de désabonnement.
 */
export function subscribeToMessages(
  convId: string,
  onUpdate: (msgs: Message[]) => void,
): Unsubscribe {
  if (!db) {
    onUpdate([]);
    return () => {};
  }

  const q = query(
    collection(db, 'conversations', convId, 'messages'),
    orderBy('at', 'asc'),
    limit(200),
  );

  return onSnapshot(q, (snap) => {
    const msgs: Message[] = snap.docs.map((d) => ({
      id: d.id,
      from: d.data().from ?? '',
      text: d.data().text ?? '',
      at: d.data().at ?? null,
    }));
    onUpdate(msgs);
  });
}

/**
 * Rechercher un utilisateur par email dans la collection "users".
 * Retourne { uid, displayName } ou null si non trouvé.
 */
export async function findUserByEmail(
  email: string,
): Promise<{ uid: string; displayName: string } | null> {
  if (!db) return null;
  const q = query(
    collection(db, 'users'),
    where('email', '==', email.toLowerCase().trim()),
    limit(1),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const data = snap.docs[0].data();
  return {
    uid: snap.docs[0].id,
    displayName: data.displayName || data.email || email,
  };
}

