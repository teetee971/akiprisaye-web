import { useState, useEffect } from 'react';
import { useFavorites } from '../hooks/useFavorites';
import { GlassCard } from '../../../components/ui/glass-card';

interface Product {
  id: string;
  name: string;
  [key: string]: unknown;
}

export function FavoritesList() {
  const { favorites, removeFavorite, clearAll } = useFavorites();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavoriteProducts();
  }, [favorites]);

  const loadFavoriteProducts = async () => {
    setLoading(true);
    try {
      // For now, create mock products from IDs
      // In real implementation, this would fetch from API
      const mockProducts: Product[] = favorites.map(id => ({
        id,
        name: `Produit ${id}`,
        // Add more product details as needed
      }));
      setProducts(mockProducts);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-white">
          Mes Favoris ({favorites.length})
        </h2>
        {favorites.length > 0 && (
          <button 
            onClick={clearAll} 
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            Tout supprimer
          </button>
        )}
      </div>

      {loading ? (
        <GlassCard className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4" />
          <p className="text-gray-400">Chargement...</p>
        </GlassCard>
      ) : favorites.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <div className="text-6xl mb-4">⭐</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Aucun favori pour le moment
          </h3>
          <p className="text-gray-400">
            Ajoutez des produits pour les retrouver facilement
          </p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(product => (
            <GlassCard key={product.id} className="p-4">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-white flex-1">
                  {product.name}
                </h3>
                <button 
                  onClick={() => removeFavorite(product.id)}
                  className="text-red-400 hover:text-red-500 text-xl transition-colors"
                  aria-label="Retirer des favoris"
                >
                  ❌
                </button>
              </div>
              <p className="text-gray-400 text-sm">ID: {product.id}</p>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
