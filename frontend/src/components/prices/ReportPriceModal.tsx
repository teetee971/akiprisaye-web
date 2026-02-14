import { useMemo, useState } from 'react';
import { saveReport } from '../../services/localStore';

interface ReportPriceModalProps {
  isOpen: boolean;
  barcode: string;
  territory: string;
  onClose: () => void;
  onSaved: () => void;
}

type UnitType = 'unit' | 'kg' | 'l';

export default function ReportPriceModal({ isOpen, barcode, territory, onClose, onSaved }: ReportPriceModalProps) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState<UnitType>('unit');
  const [store, setStore] = useState('');
  const [city, setCity] = useState('');
  const [observedAt, setObservedAt] = useState(today);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = Number.parseFloat(price.replace(',', '.'));

    if (!barcode) {
      setError('Produit non identifié.');
      return;
    }
    if (Number.isNaN(value) || value <= 0) {
      setError('Entrez un prix valide.');
      return;
    }
    if (!observedAt) {
      setError('Sélectionnez une date.');
      return;
    }

    saveReport({
      barcode,
      territory,
      price: value,
      unit,
      store: store.trim() || undefined,
      city: city.trim() || undefined,
      observedAt,
      note: note.trim() || undefined,
    });

    setSaved(true);
    setError(null);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 p-4 overflow-auto">
      <div className="max-w-lg mx-auto bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Signaler un prix</h2>
          <button type="button" onClick={onClose} className="px-3 py-1 bg-slate-800 rounded-lg">Fermer</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-sm">
          <label className="block space-y-1">
            <span>Prix (EUR)</span>
            <input className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="Ex: 2.49" inputMode="decimal" required />
          </label>

          <label className="block space-y-1">
            <span>Unité</span>
            <select className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2" value={unit} onChange={(event) => setUnit(event.target.value as UnitType)}>
              <option value="unit">unité</option>
              <option value="kg">kg</option>
              <option value="l">l</option>
            </select>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span>Magasin (optionnel)</span>
              <input className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2" value={store} onChange={(event) => setStore(event.target.value)} />
            </label>
            <label className="block space-y-1">
              <span>Ville (optionnel)</span>
              <input className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2" value={city} onChange={(event) => setCity(event.target.value)} />
            </label>
          </div>

          <label className="block space-y-1">
            <span>Date observée</span>
            <input type="date" className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2" value={observedAt} onChange={(event) => setObservedAt(event.target.value)} required />
          </label>

          <label className="block space-y-1">
            <span>Note (optionnel)</span>
            <textarea className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2" rows={3} value={note} onChange={(event) => setNote(event.target.value)} />
          </label>

          {error && <p className="text-red-300">{error}</p>}
          {saved && <p className="text-emerald-300">Enregistré sur cet appareil.</p>}

          <button type="submit" className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold">Enregistrer</button>
        </form>
      </div>
    </div>
  );
}
