import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { STORES } from '../../data/stores';
import { getTerritory } from '../../constants/territories';
import { isOpenNow } from '../../utils/storeUtils';
import { useStoreContext } from '../../context/StoreContext';
import type { OpeningDay } from '../../types/store';

const DAY_ORDER: OpeningDay[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_LABELS: Record<OpeningDay, string> = {
  mon: 'Lundi',
  tue: 'Mardi',
  wed: 'Mercredi',
  thu: 'Jeudi',
  fri: 'Vendredi',
  sat: 'Samedi',
  sun: 'Dimanche',
};

export default function StoreDetailsPage() {
  const { id } = useParams();
  const store = STORES.find((entry) => entry.id === id);
  const [activeTab, setActiveTab] = useState<'info' | 'hours'>('info');
  const { setPreferredStore } = useStoreContext();

  const territory = useMemo(() => (store ? getTerritory(store.territory) : null), [store]);

  if (!store || !territory) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 pt-24 text-slate-100">
        <p>Magasin introuvable.</p>
        <Link className="text-blue-300" to="/stores">Retour à la liste</Link>
      </div>
    );
  }

  const status = isOpenNow(store.openingHours, new Date(), territory.timezone);

  return (
    <div className="min-h-screen bg-slate-950 px-4 pb-10 pt-24 text-slate-100">
      <div className="mx-auto max-w-4xl rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
        <p className="text-sm text-slate-400">{territory.label} • {store.city}</p>
        <h1 className="text-2xl font-bold">{store.name}</h1>
        <p className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs ${status.open ? 'bg-emerald-600/20 text-emerald-300' : 'bg-rose-600/20 text-rose-300'}`}>
          {status.label}
        </p>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`rounded-lg px-3 py-2 text-sm ${activeTab === 'info' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-200'}`}
          >
            Informations
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('hours')}
            className={`rounded-lg px-3 py-2 text-sm ${activeTab === 'hours' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-200'}`}
          >
            Horaires
          </button>
        </div>

        {activeTab === 'info' ? (
          <section className="mt-5 space-y-3 text-sm">
            <p><strong>Adresse:</strong> {store.address}</p>
            <p><strong>Téléphone:</strong> {store.phone ?? 'Non communiqué'}</p>
            <p><strong>Services:</strong> Drive (placeholder), retrait 2h (placeholder).</p>
            <div className="flex flex-wrap gap-3">
              <a href={`tel:${store.phone ?? ''}`} className="rounded-lg bg-emerald-600 px-3 py-2 text-white">Contacter</a>
              <Link to="/stores" className="rounded-lg bg-slate-800 px-3 py-2">Changer de magasin</Link>
              <button type="button" onClick={() => setPreferredStore(store)} className="rounded-lg bg-blue-600 px-3 py-2 text-white">Choisir ce magasin</button>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-400">Dernière mise à jour prix</p>
              <p className="text-sm text-slate-200">Données PriceReliability à venir (placeholder MVP).</p>
            </div>
          </section>
        ) : (
          <section className="mt-5">
            <table className="w-full text-sm">
              <tbody>
                {DAY_ORDER.map((day) => (
                  <tr key={day} className="border-b border-slate-800">
                    <td className="py-2 pr-2 text-slate-300">{DAY_LABELS[day]}</td>
                    <td className="py-2 text-right text-slate-200">
                      {store.openingHours?.[day]?.join(' • ') ?? 'Fermé'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </div>
    </div>
  );
}
