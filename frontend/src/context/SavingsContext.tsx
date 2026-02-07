import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  loadSavingsData,
  saveSavingsData,
  addSavingsEntry,
  getTotalSavings,
  getMonthSavings,
  getWeekSavings,
  getMonthlySavings,
  setMonthlyGoal,
  getMonthlyGoalProgress,
  getBadges,
  getSavingsStats,
  SavingsData,
  SavingsEntry,
  MonthlySavings,
  Badge,
  SavingsStats
} from '../services/savingsService';

interface SavingsContextValue {
  data: SavingsData;
  stats: SavingsStats;
  badges: Badge[];
  monthlySavings: MonthlySavings[];
  goalProgress: number;
  addSaving: (amount: number, productName?: string, storeName?: string, category?: string) => void;
  updateMonthlyGoal: (goal: number) => void;
  refreshData: () => void;
}

const SavingsContext = createContext<SavingsContextValue | undefined>(undefined);

interface SavingsProviderProps {
  children: ReactNode;
}

export function SavingsProvider({ children }: SavingsProviderProps) {
  const [data, setData] = useState<SavingsData>(loadSavingsData());
  const [stats, setStats] = useState<SavingsStats>(getSavingsStats());
  const [badges, setBadges] = useState<Badge[]>(getBadges());
  const [monthlySavings, setMonthlySavings] = useState<MonthlySavings[]>(getMonthlySavings(6));
  const [goalProgress, setGoalProgress] = useState<number>(getMonthlyGoalProgress());

  const refreshData = () => {
    const newData = loadSavingsData();
    setData(newData);
    setStats(getSavingsStats());
    setBadges(getBadges());
    setMonthlySavings(getMonthlySavings(6));
    setGoalProgress(getMonthlyGoalProgress());
  };

  const addSaving = (
    amount: number,
    productName?: string,
    storeName?: string,
    category?: string
  ) => {
    addSavingsEntry(amount, productName, storeName, category);
    refreshData();
  };

  const updateMonthlyGoal = (goal: number) => {
    setMonthlyGoal(goal);
    refreshData();
  };

  useEffect(() => {
    // Refresh data on mount
    refreshData();
  }, []);

  const value: SavingsContextValue = {
    data,
    stats,
    badges,
    monthlySavings,
    goalProgress,
    addSaving,
    updateMonthlyGoal,
    refreshData
  };

  return (
    <SavingsContext.Provider value={value}>
      {children}
    </SavingsContext.Provider>
  );
}

export function useSavings() {
  const context = useContext(SavingsContext);
  if (context === undefined) {
    throw new Error('useSavings must be used within a SavingsProvider');
  }
  return context;
}
