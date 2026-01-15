/**
 * Timeline Prix Component
 * Displays chronological price history with variation calculations
 * @param {Array} history - Array of price history entries {date, price}
 * @param {string} productLabel - Product name
 * @param {string} storeName - Store name
 * @param {string} currency - Currency code
 */
export function TimelinePrix({ 
  history = [], 
  productLabel: _productLabel = '', 
  storeName: _storeName = '',
  currency = 'EUR' 
}) {
  if (!history || history.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Chronologie des prix
        </h3>
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500">
            Aucun historique disponible pour cette sélection
          </p>
        </div>
      </div>
    );
  }

  // Sort history by date (oldest first)
  const sortedHistory = [...history].sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );

  // Calculate variations
  const historyWithVariations = sortedHistory.map((entry, index) => {
    if (index === 0) {
      return { ...entry, variation: null, variationPercent: null };
    }
    
    const previousPrice = sortedHistory[index - 1].price;
    const variation = entry.price - previousPrice;
    const variationPercent = (variation / previousPrice) * 100;
    
    return {
      ...entry,
      variation,
      variationPercent,
    };
  });

  // Calculate overall statistics
  const firstPrice = sortedHistory[0].price;
  const lastPrice = sortedHistory[sortedHistory.length - 1].price;
  const totalVariation = lastPrice - firstPrice;
  const totalVariationPercent = (totalVariation / firstPrice) * 100;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Chronologie des prix
      </h3>

      {/* Overall Summary */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-700">Prix initial</p>
            <p className="text-xl font-bold text-gray-900">
              {firstPrice.toFixed(2)} {currency}
            </p>
            <p className="text-xs text-gray-600">{formatDate(sortedHistory[0].date)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-700">Prix actuel</p>
            <p className="text-xl font-bold text-gray-900">
              {lastPrice.toFixed(2)} {currency}
            </p>
            <p className="text-xs text-gray-600">{formatDate(sortedHistory[sortedHistory.length - 1].date)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-700">Variation totale</p>
            <p className={`text-xl font-bold ${totalVariation >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {totalVariation > 0 ? '+' : ''}{totalVariation.toFixed(2)} {currency}
            </p>
            <p className="text-xs text-gray-600">
              {totalVariationPercent > 0 ? '+' : ''}{totalVariationPercent.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Timeline List */}
      <div className="space-y-3">
        {historyWithVariations.map((entry, index) => (
          <div
            key={`${entry.date}-${index}`}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-blue-600">
                    {index + 1}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {formatDate(entry.date)}
                  </p>
                  {entry.variation !== null && (
                    <p className="text-sm text-gray-600">
                      {entry.variation > 0 ? '+' : ''}
                      {entry.variation.toFixed(2)} {currency} par rapport au point précédent
                    </p>
                  )}
                  {entry.variation === null && (
                    <p className="text-sm text-gray-500 italic">
                      Prix de référence initial
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">
                  {entry.price.toFixed(2)} {currency}
                </p>
              </div>
              {entry.variationPercent !== null && (
                <BadgeVariation value={entry.variationPercent} />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Note */}
      <div className="mt-6 bg-blue-50 rounded-lg p-3">
        <p className="text-xs text-blue-800">
          <strong>Note :</strong> L'historique présenté correspond aux prix observés aux dates indiquées.
          Les variations calculées représentent uniquement l'écart entre deux observations successives.
        </p>
      </div>
    </div>
  );
}
