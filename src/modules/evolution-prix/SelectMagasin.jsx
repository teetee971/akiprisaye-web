/**
 * Select Magasin Component
 * Store selector with legal safeguards
 * Only shows stores with sufficient observations (≥10)
 * No ranking or accusatory features
 * @param {Array} stores - Available stores
 * @param {string} selected - Currently selected store ID
 * @param {Function} onSelect - Callback when store is selected
 */
export function SelectMagasin({ stores = [], selected = null, onSelect }) {
  // Minimum observation threshold for security
  const MIN_OBSERVATIONS = 10;

  // Filter stores with sufficient data
  const validStores = stores.filter((store) => store.observations >= MIN_OBSERVATIONS);

  if (validStores.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-600">
          Aucun magasin ne dispose du nombre minimum d'observations requis (≥{MIN_OBSERVATIONS}).
        </p>
      </div>
    );
  }

  const selectedStore = validStores.find((s) => s.store_id === selected);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          🏪 Sélectionner un magasin
        </label>
        <select
          value={selected || ''}
          onChange={(e) => onSelect(e.target.value || null)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">-- Aucune sélection (vue agrégée) --</option>
          {validStores.map((store) => (
            <option key={store.store_id} value={store.store_id}>
              {store.store_name} - {store.address} ({store.observations} observations)
            </option>
          ))}
        </select>
      </div>

      {selectedStore && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-3">
            Informations contextuelles
          </h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-700">Enseigne</span>
              <span className="font-medium text-blue-900">{selectedStore.store_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Adresse</span>
              <span className="font-medium text-blue-900">{selectedStore.address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Territoire</span>
              <span className="font-medium text-blue-900 capitalize">{selectedStore.territory}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Observations</span>
              <span className="font-medium text-blue-900">{selectedStore.observations}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-blue-300">
            <p className="text-xs text-blue-800">
              <strong>Note :</strong> Ces observations sont ponctuelles et ne représentent pas 
              l'intégralité des prix pratiqués par l'enseigne.
            </p>
          </div>
        </div>
      )}

      {/* Security Notice */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <p className="text-xs text-gray-700">
          <strong>Règle de sécurité :</strong> Seuls les magasins avec au moins {MIN_OBSERVATIONS} observations 
          sont affichables pour garantir la pertinence des données.
        </p>
      </div>
    </div>
  );
}
