/**
 * Badges Hook
 * Manages badge collection and progress tracking
 */

import { useState, useEffect, useCallback } from 'react';
import type { Badge, UserBadge, BadgeProgress } from '../types/gamification';

const API_BASE = '/api/gamification';

interface UseBadgesOptions {
  userId?: string;
  autoFetch?: boolean;
}

interface UseBadgesReturn {
  badges: UserBadge[];
  allBadges: Badge[];
  unlockedBadges: UserBadge[];
  lockedBadges: UserBadge[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getBadgeProgress: (badgeId: string) => Promise<BadgeProgress | null>;
}

export function useBadges(options: UseBadgesOptions = {}): UseBadgesReturn {
  const { userId, autoFetch = true } = options;

  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserBadges = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch(`${API_BASE}/badges?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch badges');

      const data = await response.json();
      setBadges(data);
    } catch (err) {
      console.error('Error fetching badges:', err);
      throw err;
    }
  }, [userId]);

  const fetchAllBadges = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/badges/all`);
      if (!response.ok) throw new Error('Failed to fetch all badges');

      const data = await response.json();
      setAllBadges(data);
    } catch (err) {
      console.error('Error fetching all badges:', err);
      throw err;
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!userId) {
      setError('User ID is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await Promise.all([fetchUserBadges(), fetchAllBadges()]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch badges';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId, fetchUserBadges, fetchAllBadges]);

  const getBadgeProgress = useCallback(
    async (badgeId: string): Promise<BadgeProgress | null> => {
      if (!userId) return null;

      try {
        const response = await fetch(`${API_BASE}/badges/${badgeId}/progress?userId=${userId}`);
        if (!response.ok) throw new Error('Failed to fetch badge progress');

        const data = await response.json();
        return data;
      } catch (err) {
        console.error('Error fetching badge progress:', err);
        return null;
      }
    },
    [userId]
  );

  useEffect(() => {
    if (autoFetch && userId) {
      refresh();
    }
  }, [autoFetch, userId, refresh]);

  const unlockedBadges = badges.filter((badge) => badge.isUnlocked);
  const lockedBadges = badges.filter((badge) => !badge.isUnlocked);

  return {
    badges,
    allBadges,
    unlockedBadges,
    lockedBadges,
    loading,
    error,
    refresh,
    getBadgeProgress,
  };
}
