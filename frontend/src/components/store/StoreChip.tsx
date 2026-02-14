import { useMemo, useState } from 'react';
import StoreSelectorModal from './StoreSelectorModal';
import { useStoreSelection } from '../../context/StoreSelectionContext';
import type { ServiceMode } from '../../modules/store/types';

const MODE_LABEL: Record<ServiceMode, string> = {
  inStore: 'Magasin',
  drive: 'Drive',
  delivery: 'Livraison',
};

export default function StoreChip() {
  const [open, setOpen] = useState(false);
  const { selection, selectedStore, updateSelection } = useStoreSelection();

  const label = useMemo(() => {
    if (!selectedStore || !selection) return 'Choisir un magasin';
    return `${selectedStore.city ?? selectedStore.name} • ${MODE_LABEL[selection.serviceMode]}`;
  }, [selectedStore, selection]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-100 hover:bg-slate-700"
        aria-label="Choisir un magasin"
      >
        📍 {label}
      </button>
      <StoreSelectorModal
        open={open}
        territory={selection?.territory ?? 'gp'}
        onClose={() => setOpen(false)}
        onSelect={(store, mode) => {
          updateSelection(store, mode);
          setOpen(false);
        }}
      />
    </>
  );
}
