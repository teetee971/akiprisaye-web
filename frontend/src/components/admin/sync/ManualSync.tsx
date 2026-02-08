/**
 * Composant de synchronisation manuelle
 */

import { useState } from 'react';
import { openFoodFactsService, openPricesService } from '../../../services/sync';

interface ManualSyncProps {
  onSync: () => void;
}

export default function ManualSync({ onSync }: ManualSyncProps) {
  const [ean, setEan] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    product?: any;
    prices?: any[];
  } | null>(null);

  const handleSyncProduct = async () => {
    if (!ean.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const product = await openFoodFactsService.getProductByBarcode(ean.trim());
      
      if (product) {
        setResult({
          success: true,
          message: `Produit trouvé: ${product.product_name || 'Sans nom'}`,
          product,
        });
      } else {
        setResult({
          success: false,
          message: 'Produit non trouvé sur OpenFoodFacts',
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    } finally {
      setLoading(false);
      onSync();
    }
  };

  const handleSyncPrices = async () => {
    if (!ean.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const prices = await openPricesService.getPricesByProduct(ean.trim());
      
      setResult({
        success: true,
        message: `${prices.length} prix trouvé(s)`,
        prices,
      });
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    } finally {
      setLoading(false);
      onSync();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Synchronisation manuelle</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Code EAN du produit
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={ean}
              onChange={(e) => setEan(e.target.value)}
              placeholder="Ex: 3017620422003"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
            <button
              onClick={handleSyncProduct}
              disabled={loading || !ean.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Recherche...' : 'Sync Produit'}
            </button>
            <button
              onClick={handleSyncPrices}
              disabled={loading || !ean.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Recherche...' : 'Sync Prix'}
            </button>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div
            className={`p-4 rounded-lg ${
              result.success
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            <p className="font-medium">{result.message}</p>
            
            {result.product && (
              <div className="mt-3 text-sm space-y-1">
                <p><strong>Nom:</strong> {result.product.product_name}</p>
                <p><strong>Marque:</strong> {result.product.brands || 'N/A'}</p>
                <p><strong>Catégorie:</strong> {result.product.categories_tags?.join(', ') || 'N/A'}</p>
                {result.product.image_url && (
                  <img
                    src={result.product.image_url}
                    alt={result.product.product_name || 'Sans nom'}
                    className="mt-2 w-32 h-32 object-contain border rounded"
                  />
                )}
              </div>
            )}
            
            {result.prices && result.prices.length > 0 && (
              <div className="mt-3 text-sm">
                <p className="font-medium mb-2">Prix trouvés:</p>
                <ul className="space-y-1">
                  {result.prices.slice(0, 5).map((price: any, i: number) => (
                    <li key={i}>
                      {price.price} {price.currency} - {new Date(price.date).toLocaleDateString('fr-FR')}
                    </li>
                  ))}
                  {result.prices.length > 5 && (
                    <li className="text-gray-600">... et {result.prices.length - 5} autres</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
