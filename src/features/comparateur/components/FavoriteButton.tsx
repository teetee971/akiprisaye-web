import { useFavorites } from '../hooks/useFavorites';
import { toast } from '../utils/toast';

interface FavoriteButtonProps {
  productId: string;
  size?: 'small' | 'medium' | 'large';
}

export function FavoriteButton({ productId, size = 'medium' }: FavoriteButtonProps) {
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const favorited = isFavorite(productId);

  const handleToggle = () => {
    if (favorited) {
      removeFavorite(productId);
      toast.success('Retiré des favoris');
    } else {
      addFavorite(productId);
      toast.success('Ajouté aux favoris');
    }
  };

  const sizeClasses = {
    small: 'text-lg p-1',
    medium: 'text-xl p-2',
    large: 'text-2xl p-3'
  };

  return (
    <button
      className={`${sizeClasses[size]} rounded-lg transition-all hover:scale-110 ${
        favorited 
          ? 'text-yellow-400 hover:text-yellow-500' 
          : 'text-gray-400 hover:text-yellow-400'
      }`}
      onClick={handleToggle}
      aria-label={favorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      aria-pressed={favorited}
    >
      <span aria-hidden="true">{favorited ? '⭐' : '☆'}</span>
      <span className="sr-only">{favorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}</span>
    </button>
  );
}
