import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { STORES } from '../data/stores';
import type { Store } from '../types/store';
import type { TerritoryCode } from '../constants/territories';

const STORAGE_KEY = 'akp_store_preferred';

interface StoreContextValue {
  preferredStore: Store | null;
  setPreferredStore: (store: Store | null) => void;
  preferredTerritory: TerritoryCode;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

function resolveStoredStore(): Store | null {
  if (typeof window === 'undefined') return null;

  const savedId = localStorage.getItem(STORAGE_KEY);
  if (!savedId) return null;

  return STORES.find((store) => store.id === savedId) ?? null;
}

function detectFallbackTerritory(): TerritoryCode {
  if (typeof Intl !== 'undefined') {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone === 'America/Guadeloupe') {
      return 'gp';
    }
  }

  return 'fr';
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [preferredStore, setPreferredStoreState] = useState<Store | null>(() => resolveStoredStore());

  const setPreferredStore = (store: Store | null) => {
    setPreferredStoreState(store);
    if (typeof window === 'undefined') return;

    if (store) {
      localStorage.setItem(STORAGE_KEY, store.id);
      return;
    }

    localStorage.removeItem(STORAGE_KEY);
  };

  const preferredTerritory: TerritoryCode = preferredStore?.territory ?? detectFallbackTerritory();

  const value = useMemo(
    () => ({ preferredStore, setPreferredStore, preferredTerritory }),
    [preferredStore, preferredTerritory]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStoreContext() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStoreContext must be used inside StoreProvider');
  }
  return context;
}

export { STORAGE_KEY as PREFERRED_STORE_STORAGE_KEY };
