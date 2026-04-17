/**
 * Signalement Confirmation Component
 * Shows summary and final legal reminder before saving locally
 * @param {Object} data - Signalement form data
 * @param {Function} onBack - Go back to edit
 * @param {Function} onConfirm - Confirm and save locally
 * @param {boolean} hasAccepted - User acceptance state
 * @param {Function} onAcceptChange - Toggle acceptance
 */
export function SignalementConfirmation({ data, onBack, onConfirm, hasAccepted, onAcceptChange }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getTerritoryLabel = (id) => {
    const labels = {
      guadeloupe: 'Guadeloupe',
      martinique: 'Martinique',
      guyane: 'Guyane',
      reunion: 'La Réunion',
    };
    return labels[id] || id;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          ✅ Vérification de votre signalement
        </h2>
        <p className="text-sm text-gray-600">
          Veuillez vérifier les informations avant l'enregistrement local
        </p>
      </div>

      {/* Legal Reminder - Prominent */}
      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-5">
        <p className="text-sm text-yellow-900 font-bold mb-3">⚠️ Rappel Important</p>
        <p className="text-sm text-yellow-800 mb-3">
          Ce signalement correspond à une <strong>observation ponctuelle</strong> effectuée par un
          citoyen.
        </p>
        <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
          <li>
            Il ne constitue <strong>ni une accusation</strong> ni une preuve juridique
          </li>
          <li>
            Il ne sera <strong>pas publié automatiquement</strong>
          </li>
          <li>Il fera l'objet d'une vérification avant toute utilisation</li>
          <li>
            Il ne constitue <strong>pas une analyse économique</strong>
          </li>
        </ul>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Résumé de votre observation</h3>

        <div className="space-y-4">
          {/* Territory */}
          <div className="flex justify-between py-3 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-600">Territoire</span>
            <span className="text-sm font-semibold text-gray-900">
              {getTerritoryLabel(data.territory)}
            </span>
          </div>

          {/* Store */}
          <div className="flex justify-between py-3 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-600">Magasin</span>
            <span className="text-sm font-semibold text-gray-900">{data.store}</span>
          </div>

          {/* Product */}
          <div className="flex justify-between py-3 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-600">Produit</span>
            <span className="text-sm font-semibold text-gray-900">{data.product}</span>
          </div>

          {/* Price */}
          <div className="flex justify-between py-3 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-600">Prix observé</span>
            <span className="text-lg font-bold text-gray-900">
              {parseFloat(data.price).toFixed(2)} €
            </span>
          </div>

          {/* Date */}
          <div className="flex justify-between py-3 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-600">Date d'observation</span>
            <span className="text-sm font-semibold text-gray-900">{formatDate(data.date)}</span>
          </div>

          {/* Proof */}
          <div className="py-3">
            <span className="text-sm font-medium text-gray-600 block mb-2">Preuve jointe</span>
            {data.proof ? (
              <div className="flex items-center space-x-3 bg-green-50 border border-green-200 rounded-lg p-3">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-green-800">Photo ajoutée</p>
                  <p className="text-xs text-green-600">{data.proof.name}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                <p className="text-sm text-gray-600">Aucune preuve jointe</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Final Acceptance */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <label
          aria-label="Je confirme l'exactitude de ces informations"
          className="flex items-start space-x-3 cursor-pointer"
        >
          <input
            type="checkbox"
            checked={hasAccepted}
            onChange={(e) => onAcceptChange(e.target.checked)}
            className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          />
          <div className="text-sm text-gray-700">
            <p className="font-bold mb-2">☑ Je confirme l'exactitude de ces informations</p>
            <p className="text-xs text-gray-600">
              En cochant cette case, je confirme que ces informations correspondent à une
              observation personnelle et réelle, et que je comprends qu'elles seront stockées
              localement et ne seront pas publiées automatiquement.
            </p>
          </div>
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between space-x-4">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          ← Modifier
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={!hasAccepted}
          className={`px-8 py-3 rounded-lg font-medium transition-colors ${
            hasAccepted
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Enregistrer localement
        </button>
      </div>

      {/* Storage Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-xs text-gray-700">
          <strong>💾 Stockage local :</strong> Vos données seront enregistrées localement sur votre
          appareil et ne seront envoyées à aucun serveur. Elles pourront être consultées et gérées
          ultérieurement par les administrateurs de la plateforme après modération.
        </p>
      </div>
    </div>
  );
}
