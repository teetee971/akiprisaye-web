 
import { useState, useEffect } from 'react';

/**
 * Panier Anti-Crise Component
 * Displays anti-crisis basket with economy calculations
 * @param {string} territory - Territory code (guadeloupe, martinique, guyane, reunion)
 * @param {string} mode - Display mode (essentiel, equilibre, inflation_subie)
 */
export default function PanierAntiCrise({ territory = 'guadeloupe', mode = 'essentiel' }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${import.meta.env.BASE_URL}data/panier-anticrise.json`);
        if (!response.ok) {
          throw new Error('Impossible de charger les données du panier');
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
  const basket = territoryData.basket[mode] || [];
  const score = territoryData.score;

  // Calculate total and potential economy
  // Average market markup estimation: 15% based on price comparison analysis
  const AVERAGE_MARKET_MARKUP = 1.15;
  const totalMinPrice = basket.reduce((sum, item) => sum + item.price_min, 0);
  const averageMarketPrice = totalMinPrice * AVERAGE_MARKET_MARKUP;
  const potentialEconomy = averageMarketPrice - totalMinPrice;
  const economyPercentage = ((potentialEconomy / averageMarketPrice) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header with Score */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Panier Anti-Crise
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {territoryData.label} - Mode {mode}
            </p>
          </div>
          <ScoreAntiCrise score={score} />
        </div>

        {/* Economy Summary */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700">Économie potentielle</p>
              <p className="text-3xl font-bold text-blue-700">
                {potentialEconomy.toFixed(2)} {data.currency}
              </p>
              <p className="text-sm text-blue-600">
                Soit {economyPercentage}% d'économies
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-700">Total panier optimisé</p>
              <p className="text-2xl font-semibold text-gray-900">
                {totalMinPrice.toFixed(2)} {data.currency}
              </p>
            </div>
          </div>
        </div>

        {/* Product List */}
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-900 mb-3">
            Produits ({basket.length})
          </h3>
          {basket.length === 0 ? (
            <p className="text-gray-500 italic">Aucun produit disponible pour ce mode</p>
          ) : (
            basket.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.label}</p>
                  <p className="text-sm text-gray-600">{item.store}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-green-600">
                    {item.price_min.toFixed(2)} {data.currency}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Timeline (placeholder for now) */}
      <PanierTimeline history={[]} />

      {/* Disclaimer */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-xs text-blue-800">
          <strong>Note :</strong> Les prix indiqués sont des relevés à un instant donné et peuvent varier. 
          Le panier anti-crise identifie les produits structurellement les moins chers, 
          en excluant les promotions ponctuelles. Consultez notre méthodologie pour plus de détails.
        </p>
      </div>
    </div>
  );
}
