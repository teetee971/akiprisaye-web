type DataInfoProps = {
  territoire: string;
  dateSnapshot: string;
  source: string;
  qualite: string;
};

export default function DataInfo({ territoire, dateSnapshot, source, qualite }: DataInfoProps) {
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch (error) {
      console.warn('Date formatting error:', error);
      return dateStr;
    }
  };

  const getQualityBadge = (quality: string) => {
    switch (quality.toLowerCase()) {
      case 'verifie':
      case 'vérifié':
        return {
          bg: 'bg-green-100 dark:bg-green-900/30',
          text: 'text-green-700 dark:text-green-300',
          icon: '✓',
          label: 'Vérifié',
        };
      case 'en_cours':
      case 'en cours':
        return {
          bg: 'bg-yellow-100 dark:bg-yellow-900/30',
          text: 'text-yellow-700 dark:text-yellow-300',
          icon: '⏳',
          label: 'En cours',
        };
      default:
        return {
          bg: 'bg-blue-100 dark:bg-blue-900/30',
          text: 'text-blue-700 dark:text-blue-300',
          icon: 'ℹ️',
          label: quality,
        };
    }
  };

  const qualityBadge = getQualityBadge(qualite);

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-xl">📊</span>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            Informations sur les données
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Transparence et traçabilité des informations
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Territoire */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">📍</span>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Territoire
            </span>
          </div>
          <p className="text-sm font-bold text-slate-900 dark:text-white">{territoire}</p>
        </div>

        {/* Date */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">📅</span>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Dernière MAJ
            </span>
          </div>
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            {formatDate(dateSnapshot)}
          </p>
        </div>

        {/* Source */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">🔍</span>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Source</span>
          </div>
          <p className="text-sm font-bold text-slate-900 dark:text-white capitalize">
            {source.replace(/_/g, ' ')}
          </p>
        </div>

        {/* Quality */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">⭐</span>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Qualité
            </span>
          </div>
          <span
            className={`inline-flex items-center gap-1 px-2 py-1 ${qualityBadge.bg} ${qualityBadge.text} text-xs font-bold rounded-full`}
          >
            <span>{qualityBadge.icon}</span>
            <span>{qualityBadge.label}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
