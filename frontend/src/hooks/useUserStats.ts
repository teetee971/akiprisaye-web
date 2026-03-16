/**
 * useUserStats — Admin hook for real-time user statistics.
 *
 * Returns:
 *   totalUsers  — total number of registered users (Firestore count aggregate)
 *   onlineUsers — number of authenticated users currently online
 *   onlineUids  — Set of UIDs currently online (for per-row indicators)
 *   loading     — true while the initial fetch is in progress
 */

import { useEffect, useState } from 'react';

import { getTotalUsersCount, subscribeOnlineUsers } from '../services/userPresence';

export interface UserStats {
  totalUsers: number;
  onlineUsers: number;
  onlineUids: Set<string>;
  loading: boolean;
}

export function useUserStats(): UserStats {
  const [totalUsers, setTotalUsers] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [onlineUids, setOnlineUids] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // One-time aggregate count — no document data transferred
    getTotalUsersCount()
      .then((count) => {
        if (!cancelled) setTotalUsers(count);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // Real-time subscription for authenticated online users
    const unsubscribe = subscribeOnlineUsers(({ count, uids }) => {
      if (!cancelled) {
        setOnlineUsers(count);
        setOnlineUids(uids);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return { totalUsers, onlineUsers, onlineUids, loading };
}
