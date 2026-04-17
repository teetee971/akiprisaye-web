/**
 * Observation Popup Component
 * Displays detailed information about a validated observation
 * Uses neutral, descriptive language only
 * @param {Object} observation - Validated observation data
 */
export function ObservationPopup({ observation }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getConfidenceBadge = (confidence) => {
    const badges = {
      élevée: 'bg-green-100 text-green-800 border-green-300',
      moyenne: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      faible: 'bg-gray-100 text-gray-800 border-gray-300',
    };
    return badges[confidence] || badges.moyenne;
  };

  return (
    <div className="p-2 space-y-3" style={{ minWidth: '250px' }}>
      {/* Product Name */}
      <div className="border-b border-gray-200 pb-2">
        <h3 className="font-semibold text-gray-900 text-base">{observation.product}</h3>
      </div>

      {/* Price - Most Prominent */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
        <p className="text-xs text-gray-600 mb-1">Prix observé</p>
        <p className="text-2xl font-bold text-blue-900">{observation.price.toFixed(2)} €</p>
        <p className="text-xs text-gray-600 mt-1">{observation.unit}</p>
      </div>

      {/* Details Grid */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Magasin</span>
          <span className="font-medium text-gray-900">{observation.store}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Commune</span>
          <span className="font-medium text-gray-900">{observation.city}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Date</span>
          <span className="font-medium text-gray-900">{formatDate(observation.date)}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600">Confiance</span>
          <span
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded border ${getConfidenceBadge(
              observation.confidence
            )}`}
          >
            {observation.confidence}
          </span>
        </div>
      </div>

      {/* Footer Note */}
      <div className="pt-2 border-t border-gray-200">
        <p className="text-xs text-gray-600 italic">
          Observation citoyenne validée.
          <br />
          Donnée descriptive sans valeur contractuelle.
        </p>
      </div>
    </div>
  );
}
