import { useState } from 'react';
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
  const [open, setOpen] = useState(true);

  return (
    <section className="bg-slate-900/70 border border-slate-700 rounded-2xl p-4 space-y-3">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between text-left"
        aria-expanded={open}
      >
        <span className="flex flex-col">
          <span className="text-base font-semibold">⭐ Favoris ({favorites.length})</span>
          <span className="text-xs text-slate-400">À garder pour plus tard</span>
        </span>
        <span className="text-sm text-slate-400">{open ? 'Masquer' : 'Afficher'}</span>
      </button>

      {favorites.length === 0 && (
        <p className="text-xs text-slate-500">
          Ajoutez une étoile ⭐ sur un produit pour le retrouver facilement.
        </p>
      )}
      <p className="text-[11px] text-slate-500">🔒 Aucune donnée n’est envoyée vers un serveur.</p>

      <div
        className={`transition-all duration-200 ${
          open ? 'max-h-[900px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
        } overflow-hidden`}
      >
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
                      À garder
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(favorite.id)}
                  className="text-xs text-slate-400 hover:text-red-300"
                  aria-label="Retirer des favoris"
                >
                  ❌
                </button>
              </div>
              <button
                type="button"
                onClick={() => onView(favorite)}
                className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-sm rounded-lg font-semibold"
              >
                🔍 Revoir
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
