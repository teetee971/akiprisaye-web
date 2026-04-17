import React, { createContext, useContext, useMemo, useState } from 'react';
import { storesMock } from '../modules/store/stores.mock';
import { clearSelection, getSelection, setSelection } from '../modules/store/storeSelection';
import type { ServiceMode, Store, StoreSelection } from '../modules/store/types';

interface StoreSelectionContextValue {
  selection: StoreSelection | null;
  selectedStore: Store | null;
  updateSelection: (store: Store, mode: ServiceMode) => void;
  resetSelection: () => void;
}

const StoreSelectionContext = createContext<StoreSelectionContextValue | undefined>(undefined);

export function StoreSelectionProvider({ children }: { children: React.ReactNode }) {
  const [selection, setState] = useState<StoreSelection | null>(() => getSelection());

  const selectedStore = useMemo(() => {
    if (!selection) return null;
    return storesMock.find((store) => store.id === selection.storeId) ?? null;
  }, [selection]);

  const value = useMemo<StoreSelectionContextValue>(
    () => ({
      selection,
      selectedStore,
      updateSelection: (store, mode) => {
        const next: StoreSelection = {
          storeId: store.id,
          territory: store.territory,
          serviceMode: mode,
          updatedAt: new Date().toISOString(),
        };
        setSelection(next);
        setState(next);
      },
      resetSelection: () => {
        clearSelection();
        setState(null);
      },
    }),
    [selection, selectedStore]
  );

  return <StoreSelectionContext.Provider value={value}>{children}</StoreSelectionContext.Provider>;
}

export function useStoreSelection() {
  const context = useContext(StoreSelectionContext);
  if (!context) {
    throw new Error('useStoreSelection must be used within StoreSelectionProvider');
  }
  return context;
}
