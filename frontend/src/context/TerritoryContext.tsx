/**
 * TerritoryContext — Gestion du territoire actif sans rechargement de page
 * Module 24 — Territoire dynamique
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { TerritoryCode } from '../constants/territories';

const STORAGE_KEY = 'akiprisaye_territory';

interface TerritoryContextValue {
  territory: TerritoryCode;
  setTerritory: (code: TerritoryCode) => void;
}

const TerritoryContext = createContext<TerritoryContextValue | undefined>(undefined);

function readInitialTerritory(): TerritoryCode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored as TerritoryCode;
  } catch {
    // localStorage may be unavailable
  }
  return 'gp';
}

export function TerritoryProvider({ children }: { children: React.ReactNode }) {
  const [territory, setTerritoryState] = useState<TerritoryCode>(readInitialTerritory);

  const setTerritory = useCallback((code: TerritoryCode) => {
    setTerritoryState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo<TerritoryContextValue>(
    () => ({ territory, setTerritory }),
    [territory, setTerritory],
  );

  return <TerritoryContext.Provider value={value}>{children}</TerritoryContext.Provider>;
}

export function useTerritory(): TerritoryContextValue {
  const ctx = useContext(TerritoryContext);
  if (!ctx) throw new Error('useTerritory must be used inside TerritoryProvider');
  return ctx;
}
