import { useMemo } from 'react';
import { IndiceMarge } from './IndiceMarge.jsx';

/**
 * Comparatif Enseignes Component
 * Displays sorted comparison of store prices vs reference
 * Uses neutral terminology throughout
 * @param {Array} stores - Array of store price data
 * @param {number} referencePrice - Reference price for comparison
 * @param {string} currency - Currency symbol
 */
export function ComparatifEnseignes({ stores = [], referencePrice = 0, currency = 'EUR' }) {
  // Calculate differentials and sort
  const sortedStores = useMemo(() => {
    return stores
      .map((store) => {
        const differential = ((store.price - referencePrice) / referencePrice) * 100;
        return {
          ...store,
          differential,
          absoluteDiff: store.price - referencePrice,
        };
      })
      .sort((a, b) => a.price - b.price);
  }, [stores, referencePrice]);

  if (!stores || stores.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 text-gray-500">
        Aucune donnée de comparaison disponible
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Comparaison par enseigne</h3>

      <div className="space-y-3">
        {sortedStores.map((store, index) => (
          <div
            key={`${store.store}-${index}`}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {index === 0 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                      Plus bas
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{store.store}</p>
                  <p className="text-sm text-gray-600">
                    Écart vs référence: {store.absoluteDiff > 0 ? '+' : ''}
                    {store.absoluteDiff.toFixed(2)} {currency}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">
                  {store.price.toFixed(2)} {currency}
                </p>
              </div>
              <IndiceMarge value={store.differential} />
            </div>
          </div>
        ))}
      </div>

      {/* Summary Statistics */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-600">Prix le plus bas</p>
            <p className="text-lg font-semibold text-green-600">
              {sortedStores[0].price.toFixed(2)} {currency}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Prix le plus élevé</p>
            <p className="text-lg font-semibold text-red-600">
              {sortedStores[sortedStores.length - 1].price.toFixed(2)} {currency}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Écart observé</p>
            <p className="text-lg font-semibold text-gray-900">
              {(sortedStores[sortedStores.length - 1].price - sortedStores[0].price).toFixed(2)}{' '}
              {currency}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 bg-blue-50 rounded-lg p-3">
        <p className="text-xs text-blue-800">
          <strong>Note :</strong> Les données présentées sont des observations factuelles à un
          instant donné et ne constituent pas une analyse de rentabilité ou de gestion commerciale.
        </p>
      </div>
    </div>
  );
}
