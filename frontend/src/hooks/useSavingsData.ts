import { useState, useEffect } from 'react';
import {
  loadSavingsData,
  getSavingsStats,
  getBadges,
  getMonthlySavings,
  getMonthlyGoalProgress,
  SavingsData,
  SavingsStats,
  Badge,
  MonthlySavings
} from '../services/savingsService';

/**
 * Hook for accessing savings data
 * Can be used independently without SavingsContext
 */
export function useSavingsData() {
  const [data, setData] = useState<SavingsData>(loadSavingsData());
  const [stats, setStats] = useState<SavingsStats>(getSavingsStats());
  const [badges, setBadges] = useState<Badge[]>(getBadges());
  const [monthlySavings, setMonthlySavings] = useState<MonthlySavings[]>(getMonthlySavings(6));
  const [goalProgress, setGoalProgress] = useState<number>(getMonthlyGoalProgress());
  const [isLoading, setIsLoading] = useState(true);

  const refresh = () => {
    setData(loadSavingsData());
    setStats(getSavingsStats());
    setBadges(getBadges());
    setMonthlySavings(getMonthlySavings(6));
    setGoalProgress(getMonthlyGoalProgress());
  };

  useEffect(() => {
    // Initial load
    refresh();
    setIsLoading(false);

    // Listen for storage changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'akiprisaye_savings' || e.key === 'akiprisaye_savings_badges') {
        refresh();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return {
    data,
    stats,
    badges,
    monthlySavings,
    goalProgress,
    isLoading,
    refresh
  };
}
