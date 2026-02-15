import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getGuestHistory, getUserHistory } from '../services/freemium';

export default function HistoriquePrixPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      const list = user ? await getUserHistory(user.uid) : getGuestHistory();
      if (mounted) {
        setItems(list);
        setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [user]);

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Historique des recherches</h1>
      {loading && <p>Chargement...</p>}
      {!loading && items.length === 0 && <p className="text-slate-500">Aucune recherche enregistrée.</p>}
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="border rounded p-3 flex justify-between">
            <div>
              <p className="font-medium">{item.query}</p>
              <p className="text-sm text-slate-500">{new Date(item.createdAt).toLocaleString('fr-FR')} · {item.resultCount} résultats</p>
            </div>
            {item.topResult?.id ? <Link className="text-blue-600" to={`/p/${encodeURIComponent(item.topResult.id)}`}>Voir</Link> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
