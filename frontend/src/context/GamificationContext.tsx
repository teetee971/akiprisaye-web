/**
 * Gamification Context
 * Provides real-time XP tracking and notifications across the app
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { XPGainEvent, UserProfile } from '../types/gamification';

interface GamificationContextValue {
  currentXP: number;
  currentLevel: number;
  recentGains: XPGainEvent[];
  notifyXPGain: (event: XPGainEvent) => void;
  clearGains: () => void;
  updateProfile: (profile: UserProfile) => void;
}

const GamificationContext = createContext<GamificationContextValue | undefined>(undefined);

interface GamificationProviderProps {
  children: React.ReactNode;
  initialProfile?: UserProfile | null;
}

export function GamificationProvider({ children, initialProfile }: GamificationProviderProps) {
  const [currentXP, setCurrentXP] = useState(initialProfile?.totalXP || 0);
  const [currentLevel, setCurrentLevel] = useState(initialProfile?.level || 1);
  const [recentGains, setRecentGains] = useState<XPGainEvent[]>([]);

  useEffect(() => {
    if (initialProfile) {
      setCurrentXP(initialProfile.totalXP);
      setCurrentLevel(initialProfile.level);
    }
  }, [initialProfile]);

  const notifyXPGain = useCallback((event: XPGainEvent) => {
    setCurrentXP((prev) => prev + event.points);
    setRecentGains((prev) => [...prev, event]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setRecentGains((prev) => prev.filter((e) => e.timestamp !== event.timestamp));
    }, 5000);
  }, []);

  const clearGains = useCallback(() => {
    setRecentGains([]);
  }, []);

  const updateProfile = useCallback((profile: UserProfile) => {
    setCurrentXP(profile.totalXP);
    setCurrentLevel(profile.level);
  }, []);

  const value: GamificationContextValue = {
    currentXP,
    currentLevel,
    recentGains,
    notifyXPGain,
    clearGains,
    updateProfile,
  };

  return <GamificationContext.Provider value={value}>{children}</GamificationContext.Provider>;
}

export function useGamificationContext() {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    throw new Error('useGamificationContext must be used within a GamificationProvider');
  }
  return context;
}
