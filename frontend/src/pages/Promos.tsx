import { useMemo, useState } from 'react';
import { promosDataset } from '../data/promos';
import { getPreferredTerritory } from '../utils/userPreferences';

export default function PromosPage() {
  const [territory, setTerritory] = useState(getPreferredTerritory());
  const [store, setStore] = useState('all');

  const stores = useMemo(
    () => Array.from(new Set(promosDataset.filter((p) => p.territory === territory).map((p) => p.name))),
    [territory],
  );

  const filtered = promosDataset.filter((promo) => {
    if (promo.territory !== territory) return false;
    if (store !== 'all' && promo.name !== store) return false;
    return true;
  });

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 text-slate-100">
      <h1 className="text-2xl font-bold mb-4">Promos & catalogues</h1>
      <div className="grid md:grid-cols-2 gap-3 mb-6">
        <select className="bg-slate-800 border border-slate-700 rounded-lg p-2" value={territory} onChange={(e) => setTerritory(e.target.value as typeof territory)}>
          <option value="gp">Guadeloupe</option>
          <option value="mq">Martinique</option>
          <option value="fr">France hexagonale</option>
        </select>
        <select className="bg-slate-800 border border-slate-700 rounded-lg p-2" value={store} onChange={(e) => setStore(e.target.value)}>
          <option value="all">Toutes les enseignes</option>
          {stores.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
      </div>

      <div className="grid gap-4">
        {filtered.map((promo) => (
          <article key={promo.id} className="rounded-xl border border-slate-700 bg-slate-900 p-4">
            <h2 className="font-semibold">{promo.title}</h2>
            <p className="text-sm text-slate-400 mb-2">{promo.name} · {promo.periodStart} → {promo.periodEnd}</p>
            <div className="flex gap-2 flex-wrap mb-3">
              {(promo.tags ?? []).map((tag) => <span key={tag} className="text-xs px-2 py-1 bg-slate-800 rounded">#{tag}</span>)}
            </div>
            <a className="inline-block px-3 py-2 rounded bg-blue-600 hover:bg-blue-500 text-sm" href={promo.url} target="_blank" rel="noreferrer">Ouvrir</a>
          </article>
        ))}
      </div>
    </main>
  );
}
