/**
 * Composant d'historique des synchronisations
 */

import { type SyncLog } from '../../../services/sync';

interface SyncHistoryProps {
  logs: SyncLog[];
  onRefresh: () => void;
}

export default function SyncHistory({ logs, onRefresh }: SyncHistoryProps) {
  const sortedLogs = [...logs].sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}min`;
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Historique des synchronisations</h2>
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Actualiser
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Job
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Début
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Durée
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Résultats
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  Aucune synchronisation enregistrée
                </td>
              </tr>
            ) : (
              sortedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {log.jobId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(log.startTime).toLocaleString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.result?.duration ? formatDuration(log.result.duration) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        log.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : log.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {log.status === 'completed'
                        ? 'Terminé'
                        : log.status === 'failed'
                          ? 'Échec'
                          : 'En cours'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {log.result ? (
                      <div className="space-y-1">
                        <div>✅ {log.result.itemsAdded} ajoutés</div>
                        <div>🔄 {log.result.itemsUpdated} mis à jour</div>
                        <div>⏭️ {log.result.itemsSkipped} ignorés</div>
                        {log.result.errors.length > 0 && (
                          <div className="text-red-600">❌ {log.result.errors.length} erreurs</div>
                        )}
                      </div>
                    ) : log.error ? (
                      <div className="text-red-600">{log.error}</div>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
