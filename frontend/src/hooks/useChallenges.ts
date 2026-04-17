/**
 * Challenges Hook
 * Manages challenges and their completion tracking
 */

import { useState, useEffect, useCallback } from 'react';
import type { UserChallenge } from '../types/gamification';

const API_BASE = '/api/gamification';

interface UseChallengesOptions {
  userId?: string;
  autoFetch?: boolean;
}

interface UseChallengesReturn {
  challenges: UserChallenge[];
  activeChallenges: UserChallenge[];
  completedChallenges: UserChallenge[];
  challengeHistory: UserChallenge[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useChallenges(options: UseChallengesOptions = {}): UseChallengesReturn {
  const { userId, autoFetch = true } = options;

  const [challenges, setChallenges] = useState<UserChallenge[]>([]);
  const [challengeHistory, setChallengeHistory] = useState<UserChallenge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChallenges = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch(`${API_BASE}/challenges?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch challenges');

      const data = await response.json();
      setChallenges(data);
    } catch (err) {
      console.error('Error fetching challenges:', err);
      throw err;
    }
  }, [userId]);

  const fetchChallengeHistory = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch(`${API_BASE}/challenges/history?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch challenge history');

      const data = await response.json();
      setChallengeHistory(data);
    } catch (err) {
      console.error('Error fetching challenge history:', err);
      throw err;
    }
  }, [userId]);

  const refresh = useCallback(async () => {
    if (!userId) {
      setError('User ID is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await Promise.all([fetchChallenges(), fetchChallengeHistory()]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch challenges';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId, fetchChallenges, fetchChallengeHistory]);

  useEffect(() => {
    if (autoFetch && userId) {
      refresh();
    }
  }, [autoFetch, userId, refresh]);

  const activeChallenges = challenges.filter((c) => c.isActive && !c.isCompleted);
  const completedChallenges = challenges.filter((c) => c.isCompleted);

  return {
    challenges,
    activeChallenges,
    completedChallenges,
    challengeHistory,
    loading,
    error,
    refresh,
  };
}
