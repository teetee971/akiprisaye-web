import React, { useMemo, useState } from 'react';
import type { ProductCandidate } from '../services/productEnrichApi';

interface ProductResolveModalProps {
  receiptItemLabel: string;
  candidates: ProductCandidate[];
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (candidate: ProductCandidate) => void;
  onScanBarcode?: () => void;
}

export default function ProductResolveModal({
  receiptItemLabel,
  candidates,
  isOpen,
  onClose,
  onConfirm,
  onScanBarcode,
}: ProductResolveModalProps) {
  const autoSelected = useMemo(
    () => candidates.find((candidate) => candidate.score >= 0.85)?.id ?? candidates[0]?.id,
    [candidates],
  );
  const [selectedId, setSelectedId] = useState<string | undefined>(autoSelected);

  if (!isOpen) {
    return null;
  }

  const selected = candidates.find((candidate) => candidate.id === selectedId) ?? candidates[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-xl border border-slate-700 bg-slate-900 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Résolution produit</h3>
          <button onClick={onClose} className="text-slate-300">Fermer</button>
        </div>

        <p className="text-sm text-slate-300 mb-4">Ligne ticket: <strong>{receiptItemLabel}</strong></p>

        <div className="space-y-3 max-h-[420px] overflow-y-auto">
          {candidates.map((candidate) => (
            <button
              key={candidate.id}
              type="button"
              onClick={() => setSelectedId(candidate.id)}
              className={`w-full rounded-lg border p-3 text-left ${selectedId === candidate.id ? 'border-blue-500 bg-blue-950/40' : 'border-slate-700 bg-slate-800/60'}`}
            >
              <div className="flex gap-3">
                <img
                  src={candidate.imageUrl ?? '/vite.svg'}
                  alt={candidate.name}
                  className="h-16 w-16 rounded object-cover bg-slate-700"
                />
                <div>
                  <div className="text-white font-medium">{candidate.name}</div>
                  <div className="text-sm text-slate-300">{candidate.brand ?? 'Marque inconnue'}</div>
                  <div className="text-xs text-slate-400">{candidate.quantity ?? 'Quantité inconnue'}</div>
                  <div className="text-xs text-emerald-300">Score: {Math.round(candidate.score * 100)}%</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-4 flex gap-2 justify-end">
          {onScanBarcode && (
            <button type="button" onClick={onScanBarcode} className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-200">
              Scanner code-barres
            </button>
          )}
          <button
            type="button"
            onClick={() => selected && onConfirm(selected)}
            disabled={!selected}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}
