/**
 * Leaderboard Hook
 * Manages leaderboard data and user rankings
 */

import { useState, useEffect, useCallback } from 'react';
import type { LeaderboardEntry, LeaderboardFilters, UserRank } from '../types/gamification';

const API_BASE = '/api/gamification';

interface UseLeaderboardOptions extends LeaderboardFilters {
  userId?: string;
  autoFetch?: boolean;
}

interface UseLeaderboardReturn {
  leaderboard: LeaderboardEntry[];
  userRank: UserRank | null;
  neighbors: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateFilters: (filters: Partial<LeaderboardFilters>) => void;
}

export function useLeaderboard(options: UseLeaderboardOptions = {}): UseLeaderboardReturn {
  const { userId, period = 'all_time', territory, limit = 100, autoFetch = true } = options;

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<UserRank | null>(null);
  const [neighbors, setNeighbors] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<LeaderboardFilters>({
    period,
    territory,
    limit,
  });

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        period: filters.period ?? 'all_time',
        limit: filters.limit?.toString() || '100',
      });

      if (filters.territory) {
        params.append('territory', filters.territory);
      }

      const response = await fetch(`${API_BASE}/leaderboard?${params}`);
      if (!response.ok) throw new Error('Failed to fetch leaderboard');

      const data = await response.json();
      setLeaderboard(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch leaderboard';
      setError(errorMessage);
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchUserRank = useCallback(async () => {
    if (!userId) return;

    try {
      const params = new URLSearchParams({
        userId,
        period: filters.period ?? 'all_time',
      });

      const response = await fetch(`${API_BASE}/leaderboard/rank?${params}`);
      if (!response.ok) throw new Error('Failed to fetch user rank');

      const data = await response.json();
      setUserRank(data);
    } catch (err) {
      console.error('Error fetching user rank:', err);
    }
  }, [userId, filters.period]);

  const fetchNeighbors = useCallback(async () => {
    if (!userId) return;

    try {
      const params = new URLSearchParams({
        userId,
        range: '3',
      });

      const response = await fetch(`${API_BASE}/leaderboard/neighbors?${params}`);
      if (!response.ok) throw new Error('Failed to fetch neighbors');

      const data = await response.json();
      setNeighbors(data);
    } catch (err) {
      console.error('Error fetching neighbors:', err);
    }
  }, [userId]);

  const refresh = useCallback(async () => {
    await Promise.all([
      fetchLeaderboard(),
      userId ? fetchUserRank() : Promise.resolve(),
      userId ? fetchNeighbors() : Promise.resolve(),
    ]);
  }, [fetchLeaderboard, fetchUserRank, fetchNeighbors, userId]);

  const updateFilters = useCallback((newFilters: Partial<LeaderboardFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  useEffect(() => {
    if (autoFetch) {
      refresh();
    }
  }, [autoFetch, filters, refresh]);

  return {
    leaderboard,
    userRank,
    neighbors,
    loading,
    error,
    refresh,
    updateFilters,
  };
}
