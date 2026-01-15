/**
 * Filtres Carte Component
 * Provides neutral filters for map observations
 * No accusatory or ranking filters allowed
 * @param {Object} filters - Current filter state
 * @param {Function} onFilterChange - Callback to update filters
 * @param {Array} territories - Available territories
 * @param {Array} products - Available products
 * @param {Array} cities - Available cities
 */
export function FiltresCarte({
  filters,
  onFilterChange,
  territories = [],
  products = [],
  cities = [],
}) {
  const handleFilterChange = (key, value) => {
    onFilterChange((prev) => ({
      ...prev,
      [key]: value,
      // Reset city when territory changes
      ...(key === 'territory' && { city: 'all' }),
    }));
  };

  const territoryLabels = {
    guadeloupe: 'Guadeloupe',
    martinique: 'Martinique',
    guyane: 'Guyane',
    reunion: 'La Réunion',
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🔍 Filtres
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Territory Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Territoire
          </label>
          <select
            value={filters.territory}
            onChange={(e) => handleFilterChange('territory', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="all">Tous les territoires</option>
            {territories.map((t) => (
              <option key={t} value={t}>
                {territoryLabels[t] || t}
              </option>
            ))}
          </select>
        </div>

        {/* City Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Commune
          </label>
          <select
            value={filters.city}
            onChange={(e) => handleFilterChange('city', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            disabled={cities.length === 0}
          >
            <option value="all">Toutes les communes</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Product Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Produit
          </label>
          <select
            value={filters.product}
            onChange={(e) => handleFilterChange('product', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="all">Tous les produits</option>
            {products.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Period Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Période
          </label>
          <select
            onChange={(e) => {
              const value = e.target.value;
              const today = new Date();
              let startDate = null;

              if (value === '7days') {
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 7);
              } else if (value === '30days') {
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 30);
              } else if (value === '3months') {
                startDate = new Date(today);
                startDate.setMonth(today.getMonth() - 3);
              }

              onFilterChange((prev) => ({
                ...prev,
                startDate: startDate ? startDate.toISOString().split('T')[0] : null,
                endDate: null,
              }));
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="all">Toute la période</option>
            <option value="7days">7 derniers jours</option>
            <option value="30days">30 derniers jours</option>
            <option value="3months">3 derniers mois</option>
          </select>
        </div>
      </div>

      {/* Reset Button */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={() =>
            onFilterChange({
              territory: 'all',
              product: 'all',
              city: 'all',
              startDate: null,
              endDate: null,
            })
          }
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          ↻ Réinitialiser tous les filtres
        </button>
      </div>

      {/* Filter Info */}
      <div className="mt-3 bg-gray-50 rounded-lg p-3">
        <p className="text-xs text-gray-600">
          <strong>Note :</strong> Les filtres permettent d'affiner la visualisation des observations.
          Aucun classement ou notation d'enseignes n'est disponible.
        </p>
      </div>
    </div>
  );
}
