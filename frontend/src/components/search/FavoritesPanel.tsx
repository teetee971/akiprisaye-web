import { useState } from 'react';
import { Eye, Star, X } from 'lucide-react';
import type { FavoriteItem } from '../../hooks/useFavorites';

interface FavoritesPanelProps {
  favorites: FavoriteItem[];
  onView: (favorite: FavoriteItem) => void;
  onRemove: (id: string) => void;
}

const typeBadge: Record<FavoriteItem['type'], string> = {
  product: 'Produit',
  comparison: 'Comparaison',
};

export default function FavoritesPanel({ favorites, onView, onRemove }: FavoritesPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <section className="bg-slate-900/70 border border-slate-700 rounded-2xl p-4 space-y-3">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-400" aria-hidden="true" />
          <span className="text-base font-semibold">Favoris ({favorites.length})</span>
        </span>
        <span className="text-sm text-slate-400">{open ? 'Masquer' : 'Afficher'}</span>
      </button>

      {open && (
        <>
          {favorites.length === 0 ? (
            <p className="text-xs text-slate-500">
              Ajoutez un produit en favori pour le retrouver facilement.
            </p>
          ) : (
            <ul className="space-y-2">
              {favorites.map((favorite) => (
                <li
                  key={favorite.id}
                  className="flex flex-col gap-2 bg-slate-950/70 border border-slate-800 rounded-xl p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{favorite.label}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        <span>{typeBadge[favorite.type]}</span>
                        <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-200">
                          Favori
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemove(favorite.id)}
                      className="text-slate-400 hover:text-red-300 p-1 rounded"
                      aria-label="Retirer des favoris"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => onView(favorite)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-sm rounded-lg font-semibold w-full sm:w-auto justify-center"
                  >
                    <Eye className="w-4 h-4" aria-hidden="true" />
                    Revoir
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
