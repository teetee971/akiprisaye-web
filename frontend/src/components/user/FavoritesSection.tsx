import React from 'react';

export interface FavoriteItem {
  id: string;
  name: string;
  type: 'product' | 'retailer' | 'category';
  price?: number;
}

interface FavoritesSectionProps {
  favorites?: FavoriteItem[];
  onRemove?: (id: string, type: FavoriteItem['type']) => void;
}

export function FavoritesSection({ favorites = [], onRemove }: FavoritesSectionProps) {
  if (favorites.length === 0) {
    return (
      <section className="rounded-xl bg-gray-900 border border-gray-700 p-4">
        <h2 className="text-lg font-semibold text-white mb-2">❤️ Mes favoris</h2>
        <p className="text-gray-400 text-sm">
          Ajoutez des produits ou enseignes à vos favoris pour les retrouver ici.
        </p>
      </section>
    );
  }

  const typeLabel: Record<FavoriteItem['type'], string> = {
    product: 'Produit',
    retailer: 'Enseigne',
    category: 'Catégorie',
  };

  return (
    <section className="rounded-xl bg-gray-900 border border-gray-700 p-4">
      <h2 className="text-lg font-semibold text-white mb-3">❤️ Mes favoris ({favorites.length})</h2>
      <ul className="space-y-2">
        {favorites.map((fav) => (
          <li
            key={`${fav.type}-${fav.id}`}
            className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">{fav.name}</p>
              <p className="text-xs text-gray-500">{typeLabel[fav.type]}</p>
            </div>
            <div className="flex items-center gap-2 ml-3 shrink-0">
              {fav.price != null && (
                <span className="text-sm text-green-400 font-semibold">
                  {fav.price.toFixed(2)} €
                </span>
              )}
              {onRemove && (
                <button
                  onClick={() => onRemove(fav.id, fav.type)}
                  className="text-gray-500 hover:text-red-400 text-xs"
                  aria-label={`Retirer ${fav.name} des favoris`}
                >
                  ✕
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default FavoritesSection;
