import { useState, useEffect } from 'react';

/**
 * Historique Variations Component
 * Displays chronological price evolution for products
 * Uses neutral terminology, no editorial judgment
 * @param {string} productId - Product identifier
 * @param {string} territory - Territory code (guadeloupe, martinique, guyane, reunion)
 * @param {string} store - Store name filter (optional)
 */
export default function HistoriqueVariations({ 
  productId = null, 
  territory = 'guadeloupe',
  store = null 
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(productId);
  const [selectedStore, setSelectedStore] = useState(store);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/data/historique-prix.json');
        if (!response.ok) {
          throw new Error('Impossible de charger l\'historique des prix');
        }
        const jsonData = await response.json();
        setData(jsonData);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Erreur de chargement:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (productId) {
      setSelectedProduct(productId);
    }
  }, [productId]);

  useEffect(() => {
    if (store) {
      setSelectedStore(store);
    }
  }, [store]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        <p className="font-semibold">Erreur</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
        <p>Données non disponibles</p>
      </div>
    );
  }

  const availableProducts = Object.keys(data.products || {});
  const activeProduct = selectedProduct || availableProducts[0];
  const productData = data.products[activeProduct];
  
  if (!productData || !productData.history[territory]) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
        <p>Historique non disponible pour ce produit et territoire</p>
      </div>
    );
  }

  const territoryHistory = productData.history[territory];
  const availableStores = Object.keys(territoryHistory);
  const activeStore = selectedStore || availableStores[0];
  const storeHistory = territoryHistory[activeStore] || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Historique des Variations de Prix
        </h2>
        <p className="text-sm text-gray-600">
          Évolution chronologique observée
        </p>
      </div>

      {/* Legal Disclaimer */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900 font-medium mb-2">
          ℹ️ Information importante
        </p>
        <p className="text-sm text-blue-800">
          Les variations affichées correspondent à des <strong>évolutions de prix observées</strong> à différentes dates.
          Elles ne constituent ni une analyse économique ni une qualification juridique.
          Ces données sont fournies à titre informatif uniquement.
        </p>
      </div>

      {/* Product Selector */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Produit
            </label>
            <select
              value={activeProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {availableProducts.map((pid) => {
                const product = data.products[pid];
                return (
                  <option key={pid} value={pid}>
                    {product.label}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enseigne
            </label>
            <select
              value={activeStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {availableStores.map((storeName) => (
                <option key={storeName} value={storeName}>
                  {storeName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {productData && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Produit sélectionné</p>
                <p className="text-lg font-semibold text-gray-900">{productData.label}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Unité</p>
                <p className="text-lg font-semibold text-gray-900">{productData.unit}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Timeline Display */}
      <TimelinePrix 
        history={storeHistory} 
        productLabel={productData.label}
        storeName={activeStore}
        currency={data.currency}
      />
    </div>
  );
}
