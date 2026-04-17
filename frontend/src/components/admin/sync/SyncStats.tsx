/**
 * Composant d'affichage des statistiques de synchronisation
 */

interface SyncStatsProps {
  stats: {
    total: number;
    completed: number;
    failed: number;
    running: number;
    successRate: number;
    averageDuration: number;
  } | null;
}

export default function SyncStats({ stats }: SyncStatsProps) {
  if (!stats) {
    return null;
  }

  const statCards = [
    {
      label: 'Total Syncs',
      value: stats.total,
      icon: '📊',
      color: 'bg-blue-50 text-blue-700',
    },
    {
      label: 'Réussis',
      value: stats.completed,
      icon: '✅',
      color: 'bg-green-50 text-green-700',
    },
    {
      label: 'Échecs',
      value: stats.failed,
      icon: '❌',
      color: 'bg-red-50 text-red-700',
    },
    {
      label: 'En cours',
      value: stats.running,
      icon: '🔄',
      color: 'bg-yellow-50 text-yellow-700',
    },
    {
      label: 'Taux de réussite',
      value: `${stats.successRate.toFixed(1)}%`,
      icon: '📈',
      color: 'bg-purple-50 text-purple-700',
    },
    {
      label: 'Durée moyenne',
      value: `${(stats.averageDuration / 1000).toFixed(1)}s`,
      icon: '⏱️',
      color: 'bg-indigo-50 text-indigo-700',
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Statistiques</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className={`${stat.color} rounded-lg p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-80">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className="text-3xl">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
