import { useState, useEffect } from 'react';

/**
 * Evolution Prix Component
 * Main component with aggregated view (default) and optional targeted analysis
 * Maintains legal safety with disclaimers and minimum observation thresholds
 * @param {string} territory - Territory filter
 */
export default function EvolutionPrix({ territory: _territory = 'guadeloupe' }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Analysis mode state
  const [analysisEnabled, setAnalysisEnabled] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/data/evolution-prix-analysable.json');
        if (!response.ok) {
          throw new Error('Impossible de charger les données d\'évolution');
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

  // Reset selections when analysis mode is disabled
  useEffect(() => {
    if (!analysisEnabled) {
      setSelectedStore(null);
      setSelectedProduct(null);
    }
  }, [analysisEnabled]);

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

  const selectedStoreData = data.stores.find((s) => s.store_id === selectedStore);
  const selectedProductData = data.products.find((p) => p.product_id === selectedProduct);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          📈 Évolution des Prix
        </h2>
        <p className="text-sm text-gray-600">
          Analyse des variations de prix avec mode exploratoire optionnel
        </p>
      </div>

      {/* Toggle for Targeted Analysis */}
      <ToggleAnalyseCiblee 
        enabled={analysisEnabled} 
        onToggle={setAnalysisEnabled} 
      />

      {/* Main Aggregated View - Always Visible */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📊 Vue Agrégée (Données Principales)
        </h3>
        
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">📉</div>
          <p className="text-gray-700 text-lg font-medium mb-2">
            Graphique des prix agrégés
          </p>
          <p className="text-sm text-gray-600 max-w-lg mx-auto">
            Cette vue présente les données consolidées de l'ensemble des observations,
            sans ciblage spécifique d'enseigne ou de produit.
            Compatible usage institutionnel et presse.
          </p>
        </div>

        <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-xs text-green-800">
            <strong>✓ Vue principale :</strong> Les données agrégées restent la référence.
            Le mode analyse ciblée est une couche exploratoire complémentaire.
          </p>
        </div>
      </div>

      {/* Targeted Analysis Section - Only if Enabled */}
      {analysisEnabled && (
        <div className="space-y-6">
          {/* Selectors */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SelectMagasin
              stores={data.stores}
              selected={selectedStore}
              onSelect={setSelectedStore}
            />
            <SelectProduit
              products={data.products}
              selected={selectedProduct}
              onSelect={setSelectedProduct}
            />
          </div>

          {/* Contextualized Observation Display */}
          <ObservationContextuelle
            storeData={selectedStoreData}
            productData={selectedProductData}
            currency={data.currency}
          />
        </div>
      )}

      {/* Footer Legal Protection */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900 font-medium mb-2">
          ℹ️ Méthodologie et Protection
        </p>
        <p className="text-sm text-blue-800">
          Toutes les données présentées proviennent d'observations citoyennes validées.
          Le mode agrégé (vue par défaut) est recommandé pour un usage institutionnel.
          Le mode analyse ciblée est destiné à un usage exploratoire et informatif uniquement.
          Aucun classement ou comparaison accusatoire n'est effectué.
        </p>
      </div>
    </div>
  );
}
