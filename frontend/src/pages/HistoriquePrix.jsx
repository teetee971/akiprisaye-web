import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getGuestHistory, getUserHistory } from '../services/freemium';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

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
      <HeroImage
        src={PAGE_HERO_IMAGES.historiquePrix}
        alt="Historique des prix"
        gradient="from-slate-950 to-blue-900"
        height="h-40 sm:h-52"
      >
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>
          📈 Historique des prix
        </h1>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>
          Évolution des prix dans le temps par territoire
        </p>
      </HeroImage>
      {loading && <p>Chargement...</p>}
      {!loading && items.length === 0 && (
        <p className="text-slate-500">Aucune recherche enregistrée.</p>
      )}
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="border rounded p-3 flex justify-between">
            <div>
              <p className="font-medium">{item.query}</p>
              <p className="text-sm text-slate-500">
                {new Date(item.createdAt).toLocaleString('fr-FR')} · {item.resultCount} résultats
              </p>
            </div>
            {item.topResult?.id ? (
              <Link className="text-blue-600" to={`/p/${encodeURIComponent(item.topResult.id)}`}>
                Voir
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
