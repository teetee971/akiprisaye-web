import React, { useState } from 'react';
import { isFavorite, toggleFavorite } from '../../engine/favoritesEngine';
import { logEvent } from '../../engine/analytics';

interface FavoriteButtonProps {
  productId: string;
  className?: string;
  onToggle?: (isFav: boolean) => void;
}

export function FavoriteButton({ productId, className = '', onToggle }: FavoriteButtonProps) {
  const [fav, setFav] = useState(() => isFavorite('products', productId));

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !fav;
    toggleFavorite('products', productId);
    setFav(next);
    logEvent(next ? 'add_favorite' : 'remove_favorite', { id: productId });
    onToggle?.(next);
  }

  return (
    <button
      onClick={handleClick}
      aria-label={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      title={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      className={`inline-flex items-center justify-center rounded-full w-7 h-7 transition-colors ${
        fav
          ? 'text-red-400 bg-red-900/40 hover:bg-red-900/60'
          : 'text-gray-500 bg-gray-800 hover:text-red-400'
      } ${className}`}
    >
      {fav ? '❤️' : '🤍'}
    </button>
  );
}

export default FavoriteButton;
