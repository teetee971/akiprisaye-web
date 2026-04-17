/**
 * Toggle Analyse Ciblée Component
 * Provides opt-in toggle for targeted analysis mode
 * Default mode shows aggregated data (institution/press safe)
 * @param {boolean} enabled - Current state
 * @param {Function} onToggle - Callback when toggled
 */
export function ToggleAnalyseCiblee({ enabled = false, onToggle }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">🔍 Mode Analyse Ciblée</h3>
            <span
              className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                enabled ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {enabled ? 'Actif' : 'Inactif'}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Permet d'analyser des observations spécifiques par magasin ou produit. Les données
            restent contextuelles et non exhaustives.
          </p>

          {enabled && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
              <p className="text-xs text-yellow-900 font-medium mb-1">⚠️ Mode exploratoire</p>
              <p className="text-xs text-yellow-800">
                Les données affichées reposent sur des{' '}
                <strong>observations citoyennes ponctuelles</strong> et ne constituent pas une
                représentation exhaustive ou contractuelle des pratiques commerciales.
              </p>
            </div>
          )}
        </div>

        {/* Toggle Switch */}
        <button
          onClick={() => onToggle(!enabled)}
          className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            enabled ? 'bg-blue-600' : 'bg-gray-200'
          }`}
          role="switch"
          aria-checked={enabled}
        >
          <span className="sr-only">Activer le mode analyse ciblée</span>
          <span
            className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              enabled ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {!enabled && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            <strong>Mode par défaut :</strong> Vue agrégée compatible avec un usage institutionnel
            et presse. Les données présentées sont globales et ne ciblent aucune enseigne
            spécifique.
          </p>
        </div>
      )}
    </div>
  );
}
