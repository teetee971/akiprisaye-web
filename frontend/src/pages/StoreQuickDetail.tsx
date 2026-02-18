import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import NavigateButtons from '../components/NavigateButtons';
import { getStore } from '../services/prices';
import type { Store } from '../types/store';

export default function StoreQuickDetail() {
  const { storeId = '' } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<Store | null>(null);

  useEffect(() => {
    const loadStore = async () => {
      setLoading(true);
      const nextStore = await getStore(storeId);
      setStore(nextStore);
      setLoading(false);
    };

    void loadStore();
  }, [storeId]);

  if (loading) {
    return <div className="min-h-[40vh] p-6 text-slate-300">Chargement du magasin…</div>;
  }

  if (!store) {
    return (
      <div className="min-h-[40vh] p-6 text-slate-100">
        <p className="mb-3">Magasin introuvable.</p>
        <button onClick={() => navigate(-1)} className="rounded-lg bg-slate-700 px-3 py-2 text-sm">Retour</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 pt-24 text-white">
      <section className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <button onClick={() => navigate(-1)} className="mb-4 text-sm text-slate-300 hover:text-white">← Retour</button>

        <h1 className="text-2xl font-bold">{store.name}</h1>
        <p className="mt-1 text-slate-300">{store.brand ?? 'Enseigne'} · {store.city ?? 'Ville n/d'}</p>

        <div className="mt-4 space-y-1 text-sm text-slate-300">
          <p>Adresse: {store.address ?? 'n/d'} {store.postalCode ?? ''}</p>
          <p>Territoire: {store.territory ?? 'n/d'}</p>
          <p>Horaires: {store.openingHours ?? 'n/d'}</p>
          {store.phone && <p>Téléphone: {store.phone}</p>}
        </div>

        {store.location && (
          <div className="mt-5">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-300">Y aller</h2>
            <NavigateButtons lat={store.location.lat} lng={store.location.lng} />
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          <Link to={`/contribuer-prix?storeId=${store.id}`} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold hover:bg-emerald-700">
            Contribuer prix ici
          </Link>
          <Link to="/comparaison-panier" className="rounded-lg border border-slate-500 px-4 py-2 text-sm">
            Voir mon panier
          </Link>
        </div>
      </section>
    </div>
  );
}
