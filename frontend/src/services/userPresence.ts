/**
 * userPresence.ts
 *
 * Tracks authenticated user presence in Firestore.
 *
 * Collection: user_presence/{uid}
 *   uid:      string     — Firebase Auth UID
 *   lastSeen: Timestamp  — server timestamp, refreshed every 30 s
 *
 * Admins query this collection to count authenticated users currently
 * online (lastSeen within the last 5 minutes).
 */

import {
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';

/** Duration in ms after which a presence document is considered stale. */
export const PRESENCE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ── Write / clear presence ────────────────────────────────────────────────────

/**
 * Write or refresh the current authenticated user's presence document.
 * Safe to call repeatedly (uses merge: true).
 */
export async function writeUserPresence(uid: string): Promise<void> {
  if (!db) return;
  await setDoc(
    doc(db, 'user_presence', uid),
    { uid, lastSeen: serverTimestamp() },
    { merge: true }
  );
}

/**
 * Remove the user's presence document.
 * Called on explicit sign-out so the count drops immediately.
 */
export async function clearUserPresence(uid: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, 'user_presence', uid)).catch(() => {});
}

// ── Admin read helpers ────────────────────────────────────────────────────────

/**
 * Return the total number of registered users (documents in the `users`
 * collection).  Uses a Firestore count aggregate — no document data is
 * downloaded.
 */
export async function getTotalUsersCount(): Promise<number> {
  if (!db) return 0;
  const snap = await getCountFromServer(collection(db, 'users'));
  return snap.data().count;
}

export interface OnlineUsersSnapshot {
  count: number;
  uids: Set<string>;
  lastSeenAt: Date | null;
}

/**
 * Subscribe to real-time changes in authenticated online users.
 * Only documents with lastSeen ≤ PRESENCE_TTL_MS ago are counted.
 */
export function subscribeOnlineUsers(
  callback: (snapshot: OnlineUsersSnapshot) => void
): Unsubscribe {
  if (!db) {
    callback({ count: 0, uids: new Set(), lastSeenAt: null });
    return () => {};
  }

  return onSnapshot(
    collection(db, 'user_presence'),
    (snap) => {
      const cutoff = Date.now() - PRESENCE_TTL_MS;
      const uids = new Set<string>();
      let lastSeenAt: Date | null = null;

      snap.forEach((d) => {
        const lastSeen = d.data().lastSeen as Timestamp | null;
        if (lastSeen && lastSeen.toMillis() > cutoff) {
          uids.add(d.id); // document ID == uid
          if (!lastSeenAt || lastSeen.toMillis() > lastSeenAt.getTime()) {
            lastSeenAt = lastSeen.toDate();
          }
        }
      });

      callback({ count: uids.size, uids, lastSeenAt });
    },
    () => callback({ count: 0, uids: new Set(), lastSeenAt: null })
  );
}
