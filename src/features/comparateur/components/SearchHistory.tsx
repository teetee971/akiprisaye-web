import { useSearchHistory } from '../hooks/useSearchHistory';

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'À l\'instant';
  if (minutes < 60) return `Il y a ${minutes} min`;
  if (hours < 24) return `Il y a ${hours}h`;
  if (days < 7) return `Il y a ${days}j`;
  return new Date(timestamp).toLocaleDateString('fr-FR');
}

export function SearchHistory() {
  const { history, clearHistory, removeHistoryItem } = useSearchHistory();

  const handleExecuteSearch = (query: string) => {
    // Dispatch custom event that can be caught by search components
    const event = new CustomEvent('execute-search', { 
      detail: { query } 
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Recherches récentes</h3>
        {history.length > 0 && (
          <button 
            onClick={clearHistory} 
            className="text-sm text-red-400 hover:text-red-500 transition-colors"
          >
            Effacer tout
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <p className="text-gray-400 text-center py-4">
          Aucune recherche récente
        </p>
      ) : (
        <ul className="space-y-2">
          {history.map((item, index) => (
            <li 
              key={index} 
              className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg hover:bg-slate-900 transition-colors"
            >
              <button 
                onClick={() => handleExecuteSearch(item.query)}
                className="flex-1 flex items-center gap-2 text-left"
              >
                <span className="text-gray-400">🔍</span>
                <span className="text-white flex-1">{item.query}</span>
                <span className="text-gray-500 text-xs">
                  {formatRelativeTime(item.timestamp)}
                </span>
              </button>
              <button 
                onClick={() => removeHistoryItem(index)}
                className="text-gray-500 hover:text-red-400 transition-colors"
                aria-label="Supprimer cette recherche"
              >
                ❌
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
