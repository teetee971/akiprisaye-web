import { useState, useEffect } from 'react';
import { ComparatifEnseignes } from './ComparatifEnseignes.jsx';

/**
 * Observatoire des Marges Component
 * Displays price differentials between stores and reference prices
 * Uses neutral, legally-safe terminology
 * @param {string} territory - Territory code (guadeloupe, martinique, guyane, reunion)
 * @param {string} productId - Product identifier
 */
export default function ObservatoireMarges({ territory = 'guadeloupe', productId = null }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(productId);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${import.meta.env.BASE_URL}data/observatoire-marges.json`);
        if (!response.ok) {
          throw new Error("Impossible de charger les données de l'observatoire");
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

  if (!data || !data.territories[territory]) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
        <p>Données non disponibles pour ce territoire</p>
      </div>
    );
  }

  const territoryData = data.territories[territory];
  const availableProducts = Object.keys(territoryData.products || {});

  // Auto-select first product if none selected
  const activeProduct = selectedProduct || availableProducts[0];
  const productData = territoryData.products[activeProduct];
  const referencePrice = data.reference[activeProduct];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Observatoire des Marges</h2>
        <p className="text-sm text-gray-600">{territoryData.label}</p>
      </div>

      {/* Legal Disclaimer */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900 font-medium mb-2">ℹ️ Information importante</p>
        <p className="text-sm text-blue-800">
          Les écarts présentés sont des <strong>différences de prix observées</strong> par rapport à
          un prix de référence indicatif. Ils ne constituent ni une accusation ni une qualification
          juridique. Ces données sont fournies à titre informatif uniquement.
        </p>
      </div>

      {/* Product Selector */}
      {availableProducts.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <label
            htmlFor="observatoire-produit"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Sélectionner un produit
          </label>
          <select
            id="observatoire-produit"
            value={activeProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {availableProducts.map((pid) => (
              <option key={pid} value={pid}>
                {pid.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Reference Price */}
      {referencePrice && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">Prix de référence indicatif</p>
          <p className="text-2xl font-bold text-gray-900">
            {referencePrice.toFixed(2)} {data.currency}
          </p>
        </div>
      )}

      {/* Store Comparison */}
      {productData && referencePrice && (
        <ComparatifEnseignes
          stores={productData}
          referencePrice={referencePrice}
          currency={data.currency}
        />
      )}

      {availableProducts.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
          <p>Aucune donnée disponible pour ce territoire</p>
        </div>
      )}
    </div>
  );
}
