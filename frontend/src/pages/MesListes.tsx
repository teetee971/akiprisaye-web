import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  clearHistory,
  getFavorites,
  getHistory,
  removeFavorite,
  removeHistoryItem,
} from '../services/localStore';
import type { LocalProductItem } from '../types/localProduct';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

export default function MesListes() {
  const [tab, setTab] = useState<'favoris' | 'historique'>('favoris');
  const [favorites, setFavorites] = useState<LocalProductItem[]>(() => getFavorites());
  const [history, setHistory] = useState<LocalProductItem[]>(() => getHistory());

  const activeItems = useMemo(() => (tab === 'favoris' ? favorites : history), [favorites, history, tab]);

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-4">
        <HeroImage
          src={PAGE_HERO_IMAGES.mesListes}
          alt="Mes listes"
          gradient="from-slate-950 to-green-900"
          height="h-40 sm:h-52"
        >
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>📝 Mes listes</h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>Vos listes de courses sauvegardées</p>
        </HeroImage>

        <div className="flex gap-2">
          <button type="button" onClick={() => setTab('favoris')} className={`px-4 py-2 rounded-lg ${tab === 'favoris' ? 'bg-blue-600' : 'bg-slate-800'}`}>Favoris</button>
          <button type="button" onClick={() => setTab('historique')} className={`px-4 py-2 rounded-lg ${tab === 'historique' ? 'bg-blue-600' : 'bg-slate-800'}`}>Historique</button>
          {tab === 'historique' && (
            <button
              type="button"
              onClick={() => {
                clearHistory();
                setHistory([]);
              }}
              className="ml-auto px-4 py-2 rounded-lg bg-slate-800"
            >
              Vider historique
            </button>
          )}
        </div>

        <div className="space-y-3">
          {activeItems.length === 0 ? (
            <p className="text-slate-400">Aucun élément pour le moment.</p>
          ) : (
            activeItems.map((item) => (
              <div key={`${tab}-${item.barcode}`} className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex items-center justify-between gap-3">
                <Link to={`/recherche-produits?ean=${encodeURIComponent(item.barcode)}`} className="min-w-0">
                  <p className="font-semibold truncate">{item.title}</p>
                  <p className="text-sm text-slate-400">EAN {item.barcode}</p>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    if (tab === 'favoris') {
                      setFavorites(removeFavorite(item.barcode));
                    } else {
                      setHistory(removeHistoryItem(item.barcode));
                    }
                  }}
                  className="px-3 py-2 text-sm rounded-lg bg-slate-800"
                >
                  Supprimer
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
