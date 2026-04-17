/**
 * Main Gamification Hook
 * Manages user gamification profile, points, and level
 */

import { useState, useEffect, useCallback } from 'react';
import type { UserProfile, PointsSummary, DashboardData } from '../types/gamification';

const API_BASE = '/api/gamification';

interface UseGamificationOptions {
  userId?: string;
  autoFetch?: boolean;
}

interface UseGamificationReturn {
  profile: UserProfile | null;
  dashboard: DashboardData | null;
  pointsSummary: PointsSummary | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  initialize: () => Promise<void>;
}

export function useGamification(options: UseGamificationOptions = {}): UseGamificationReturn {
  const { userId, autoFetch = true } = options;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [pointsSummary, setPointsSummary] = useState<PointsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch(`${API_BASE}/profile?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch profile');
      const data = await response.json();
      setProfile(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
      throw err;
    }
  }, [userId]);

  const fetchDashboard = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch(`${API_BASE}/dashboard?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch dashboard');
      const data = await response.json();
      setDashboard(data);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      throw err;
    }
  }, [userId]);

  const fetchPointsSummary = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch(`${API_BASE}/points/summary?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch points summary');
      const data = await response.json();
      setPointsSummary(data);
    } catch (err) {
      console.error('Error fetching points summary:', err);
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
      await Promise.all([fetchProfile(), fetchDashboard(), fetchPointsSummary()]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch gamification data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId, fetchProfile, fetchDashboard, fetchPointsSummary]);

  const initialize = useCallback(async () => {
    if (!userId) {
      setError('User ID is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) throw new Error('Failed to initialize profile');

      await refresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize profile';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId, refresh]);

  useEffect(() => {
    if (autoFetch && userId) {
      refresh();
    }
  }, [autoFetch, userId, refresh]);

  return {
    profile,
    dashboard,
    pointsSummary,
    loading,
    error,
    refresh,
    initialize,
  };
}
