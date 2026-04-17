/**
 * DataSourceWarning Component
 *
 * Displays critical warnings about data sources throughout the application.
 * Shows when data is demonstration/non-official.
 * Updated to Civic Glass design - NO EMOJIS
 */

export function DataSourceWarning({ dataStatus, requiredSources, compact = false }) {
  // Only show warning if data is not official
  if (dataStatus === 'OFFICIEL' || dataStatus === 'OFFICIAL') {
    return null;
  }

  if (compact) {
    return (
      <div className="bg-red-600/10 border-l-4 border-red-500 p-3 text-sm backdrop-blur-sm">
        <p className="text-red-200 font-semibold">
          <span className="font-bold">AVERTISSEMENT:</span> Données de démonstration - Ne pas
          utiliser en production
        </p>
        {requiredSources && (
          <p className="text-red-300 text-xs mt-1">
            Sources requises: {requiredSources.join(', ')}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="border-2 border-red-500 bg-red-900/20 rounded-lg p-4">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <p className="text-red-200 font-semibold mb-2">
            <span className="font-bold">AVERTISSEMENT:</span> Données de démonstration
          </p>
          <p className="text-red-300 text-sm">
            Ne pas utiliser en production. Sources officielles requises:{' '}
            {requiredSources?.join(', ') || 'non spécifiées'}
          </p>
          <p className="text-red-300 text-sm mt-2">Statut actuel: {dataStatus || 'DEMO'}</p>
        </div>
      </div>
    </div>
  );
}

export default DataSourceWarning;
