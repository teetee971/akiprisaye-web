/**
 * Select Produit Component
 * Product selector with legal safeguards
 * Shows price ranges and observation counts
 * No "cheapest product" or accusatory comparisons
 * @param {Array} products - Available products
 * @param {string} selected - Currently selected product ID
 * @param {Function} onSelect - Callback when product is selected
 */
export function SelectProduit({ products = [], selected = null, onSelect }) {
  // Minimum observation threshold
  const MIN_OBSERVATIONS = 10;

  // Filter products with sufficient data
  const validProducts = products.filter((product) => product.observations >= MIN_OBSERVATIONS);

  if (validProducts.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-600">
          Aucun produit ne dispose du nombre minimum d'observations requis (≥{MIN_OBSERVATIONS}).
        </p>
      </div>
    );
  }

  const selectedProduct = validProducts.find((p) => p.product_id === selected);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          🧺 Sélectionner un produit
        </label>
        <select
          value={selected || ''}
          onChange={(e) => onSelect(e.target.value || null)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">-- Aucune sélection (vue agrégée) --</option>
          {validProducts.map((product) => (
            <option key={product.product_id} value={product.product_id}>
              {product.product_name} ({product.observations} observations)
            </option>
          ))}
        </select>
      </div>

      {selectedProduct && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-green-900 mb-3">
            Informations produit
          </h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-green-700">Produit</span>
              <span className="font-medium text-green-900">{selectedProduct.product_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700">Catégorie</span>
              <span className="font-medium text-green-900">{selectedProduct.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700">Fourchette de prix</span>
              <span className="font-medium text-green-900">
                {selectedProduct.price_range.min.toFixed(2)} € - {selectedProduct.price_range.max.toFixed(2)} €
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700">Observations</span>
              <span className="font-medium text-green-900">{selectedProduct.observations}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700">Période</span>
              <span className="font-medium text-green-900 text-xs">{selectedProduct.period}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-green-300">
            <p className="text-xs text-green-800">
              <strong>Note :</strong> Cette fourchette de prix est basée sur des observations ponctuelles 
              et peut ne pas refléter l'ensemble des prix pratiqués.
            </p>
          </div>
        </div>
      )}

      {/* Security Notice */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <p className="text-xs text-gray-700">
          <strong>Règle de sécurité :</strong> Seuls les produits avec au moins {MIN_OBSERVATIONS} observations 
          sont affichables pour garantir la pertinence des données.
        </p>
      </div>
    </div>
  );
}
