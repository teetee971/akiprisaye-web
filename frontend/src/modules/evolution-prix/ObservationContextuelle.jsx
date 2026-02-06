/**
 * Observation Contextuelle Component
 * Displays contextualized observation data
 * Never replaces main aggregated view
 * Always includes legal disclaimers
 * @param {Object} storeData - Selected store data
 * @param {Object} productData - Selected product data
 * @param {string} currency - Currency symbol
 */
export function ObservationContextuelle({ storeData = null, productData = null, currency = 'EUR' }) {
  // If nothing is selected, show reminder about aggregated view
  if (!storeData && !productData) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <div className="text-5xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Vue agrégée active
          </h3>
          <p className="text-sm text-gray-600 max-w-md mx-auto">
            Sélectionnez un magasin ou un produit pour afficher une analyse contextuelle.
            Les données agrégées restent la vue principale.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mandatory Disclaimer - Always Visible */}
      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
        <p className="text-sm text-yellow-900 font-bold mb-2">
          ⚠️ Données contextuelles et non exhaustives
        </p>
        <p className="text-sm text-yellow-800">
          Les informations affichées ci-dessous reposent sur des <strong>observations citoyennes ponctuelles</strong>.
          Elles ne constituent pas une représentation exhaustive ou contractuelle et 
          ne permettent pas de tirer des conclusions définitives sur les pratiques commerciales.
        </p>
      </div>

      {/* Contextualized Data Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📌 Observation contextualisée
        </h3>

        {/* Store Context */}
        {storeData && (
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-3">
                Magasin sélectionné
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-blue-700 text-xs">Enseigne</p>
                  <p className="font-semibold text-blue-900">{storeData.store_name}</p>
                </div>
                <div>
                  <p className="text-blue-700 text-xs">Localisation</p>
                  <p className="font-semibold text-blue-900">{storeData.address}</p>
                </div>
                <div>
                  <p className="text-blue-700 text-xs">Territoire</p>
                  <p className="font-semibold text-blue-900 capitalize">{storeData.territory}</p>
                </div>
                <div>
                  <p className="text-blue-700 text-xs">Observations collectées</p>
                  <p className="font-semibold text-blue-900">{storeData.observations}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Product Context */}
        {productData && (
          <div className="mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-green-900 mb-3">
                Produit sélectionné
              </h4>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-green-700 text-xs">Désignation</p>
                  <p className="font-semibold text-green-900">{productData.product_name}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-green-700 text-xs">Catégorie</p>
                    <p className="font-semibold text-green-900">{productData.category}</p>
                  </div>
                  <div>
                    <p className="text-green-700 text-xs">Observations</p>
                    <p className="font-semibold text-green-900">{productData.observations}</p>
                  </div>
                </div>
                <div>
                  <p className="text-green-700 text-xs mb-1">Fourchette de prix observée</p>
                  <div className="flex items-center justify-between bg-white rounded p-2">
                    <div className="text-center flex-1">
                      <p className="text-xs text-gray-600">Minimum</p>
                      <p className="text-lg font-bold text-green-700">
                        {productData.price_range.min.toFixed(2)} {currency}
                      </p>
                    </div>
                    <div className="text-gray-400">→</div>
                    <div className="text-center flex-1">
                      <p className="text-xs text-gray-600">Maximum</p>
                      <p className="text-lg font-bold text-green-700">
                        {productData.price_range.max.toFixed(2)} {currency}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-green-700 text-xs">Période d'observation</p>
                  <p className="text-sm text-green-900">{productData.period}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Combined Context Notice */}
        {storeData && productData && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-purple-900 font-medium mb-2">
              🔄 Analyse croisée
            </p>
            <p className="text-sm text-purple-800">
              Vous visualisez des observations pour le produit <strong>{productData.product_name}</strong> 
              {' '}dans l'enseigne <strong>{storeData.store_name}</strong>.
              Cette combinaison peut réduire le nombre d'observations disponibles.
            </p>
          </div>
        )}

        {/* Usage Guidelines */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-xs font-semibold text-gray-700 uppercase mb-3">
            Utilisation de ces données
          </h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span>Compréhension contextuelle des variations de prix</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span>Analyse exploratoire à titre informatif</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-600 mr-2">✗</span>
              <span>Ne constituent pas une preuve contractuelle ou juridique</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-600 mr-2">✗</span>
              <span>Ne permettent pas de conclure sur l'ensemble des pratiques</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Footer Reminder */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-xs text-gray-700">
          <strong>Rappel :</strong> Le graphique principal présente des données agrégées.
          Cette analyse ciblée est une couche informative complémentaire,
          jamais une vérité absolue ni un classement d'enseignes.
        </p>
      </div>
    </div>
  );
}
